<#
.SYNOPSIS
    Builds the Power BI custom visual, gated on lint, type check and tests.

.DESCRIPTION
    Runs the quality steps in order and stops at the first failure, so a broken
    build never produces a .pbiviz that could be uploaded to the Marketplace:

        1. Version consistency (package.json / pbiviz.json / WelcomePage.tsx)
        2. ESLint
        3. TypeScript type check
        4. Vitest
        5. Webpack packaging

    Every step can be skipped individually for a quick local turnaround, but a
    build produced with -NoTest is flagged loudly in the output.

.EXAMPLE
    npm run package                # full gated build
    npm run package:notest         # skip the tests (emergency only)
    ./build.ps1 -Dev -SkipLint     # fast unminified build while developing
#>
[CmdletBinding()]
param(
    [switch]$NoTest,
    [switch]$SkipLint,
    [switch]$NoVersionCheck,
    [switch]$Dev
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
Set-Location $root

$script:stepNumber = 0

function Write-Step {
    param([string]$Title)
    $script:stepNumber++
    Write-Host ''
    Write-Host "[$script:stepNumber] $Title" -ForegroundColor Cyan
}

function Write-Skipped {
    param([string]$Title, [string]$Switch)
    $script:stepNumber++
    Write-Host ''
    Write-Host "[$script:stepNumber] $Title - skipped ($Switch)" -ForegroundColor DarkYellow
}

# Resolve a tool from node_modules/.bin instead of going through npx.
#
# Calling the local binary directly instead of going through npx saves one npm
# process start per step and keeps the build independent of whatever npx would
# resolve from the registry.
function Resolve-LocalBin {
    param([string]$Name)
    $bin = Join-Path $root "node_modules/.bin/$Name"
    $cmd = "$bin.cmd"
    if (Test-Path $cmd) { return $cmd }
    if (Test-Path $bin) { return $bin }
    Write-Host "BUILD ABORTED: '$Name' not found in node_modules/.bin. Run 'npm install' first." -ForegroundColor Red
    exit 1
}

function Invoke-Step {
    param([string]$Command, [string[]]$CommandArgs)
    & $Command @CommandArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Host ''
        Write-Host "BUILD ABORTED: '$Command $($CommandArgs -join ' ')' exited with code $LASTEXITCODE." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

# ---------------------------------------------------------------------------
# 1. Version consistency
#
# The visual version lives in three hand-maintained places. When they drift the
# landing page advertises a version the package does not have.
# ---------------------------------------------------------------------------
if ($NoVersionCheck) {
    Write-Skipped 'Version consistency' '-NoVersionCheck'
} else {
    Write-Step 'Version consistency'

    $packageVersion = (Get-Content (Join-Path $root 'package.json') -Raw | ConvertFrom-Json).version
    $pbivizVersion = (Get-Content (Join-Path $root 'pbiviz.json') -Raw | ConvertFrom-Json).visual.version

    $welcomePath = Join-Path $root 'src/WelcomePage.tsx'
    $welcomeMatch = Select-String -Path $welcomePath -Pattern "VISUAL_VERSION\s*=\s*'([^']+)'" | Select-Object -First 1
    if ($null -eq $welcomeMatch) {
        Write-Host "BUILD ABORTED: could not read VISUAL_VERSION from $welcomePath." -ForegroundColor Red
        exit 1
    }
    $welcomeVersion = $welcomeMatch.Matches[0].Groups[1].Value

    Write-Host "    package.json      $packageVersion"
    Write-Host "    pbiviz.json       $pbivizVersion"
    Write-Host "    WelcomePage.tsx   $welcomeVersion"

    if (($packageVersion -ne $pbivizVersion) -or ($packageVersion -ne $welcomeVersion)) {
        Write-Host ''
        Write-Host 'BUILD ABORTED: version mismatch. Align all three values (or pass -NoVersionCheck).' -ForegroundColor Red
        exit 1
    }
    Write-Host "    OK - all three report $packageVersion" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# 2. Lint
# ---------------------------------------------------------------------------
if ($SkipLint) {
    Write-Skipped 'ESLint' '-SkipLint'
} else {
    Write-Step 'ESLint'
    Invoke-Step (Resolve-LocalBin 'eslint') @('.')
}

# ---------------------------------------------------------------------------
# 3. Type check
#
# tsconfig.json only lists src/visual.ts, so a bare tsc never sees most files.
# tsconfig.test.json covers all of src/ plus the tests.
# ---------------------------------------------------------------------------
Write-Step 'TypeScript type check'
Invoke-Step (Resolve-LocalBin 'tsc') @('--noEmit', '-p', 'tsconfig.test.json')

# ---------------------------------------------------------------------------
# 4. Tests - the actual gate
# ---------------------------------------------------------------------------
if ($NoTest) {
    Write-Skipped 'Tests' '-NoTest'
} else {
    Write-Step 'Tests'
    Invoke-Step (Resolve-LocalBin 'vitest') @('run')
}

# ---------------------------------------------------------------------------
# 5. Package
# ---------------------------------------------------------------------------
$webpackConfig = if ($Dev) { 'view-webpack.dev.config.js' } else { 'view-webpack.config.js' }
Write-Step "Webpack build ($webpackConfig)"

$distPath = Join-Path $root 'dist'
$before = @()
if (Test-Path $distPath) {
    $before = Get-ChildItem $distPath -Filter '*.pbiviz' | Select-Object -ExpandProperty FullName
}

Invoke-Step (Resolve-LocalBin 'webpack') @('--config', $webpackConfig)

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
Write-Host ''
if (Test-Path $distPath) {
    $packages = Get-ChildItem $distPath -Filter '*.pbiviz' | Sort-Object LastWriteTime -Descending
    $newest = $packages | Select-Object -First 1
    if ($null -ne $newest) {
        $sizeMb = [math]::Round($newest.Length / 1MB, 2)
        $isNew = $before -notcontains $newest.FullName
        $label = if ($isNew) { 'created' } else { 'updated' }
        Write-Host "BUILD OK - $label $($newest.FullName) ($sizeMb MB)" -ForegroundColor Green
    } else {
        Write-Host 'BUILD OK - webpack succeeded but no .pbiviz was found in dist/.' -ForegroundColor Yellow
    }
} else {
    Write-Host 'BUILD OK - webpack succeeded but dist/ does not exist.' -ForegroundColor Yellow
}

if ($NoTest) {
    Write-Host ''
    Write-Host '*******************************************************************' -ForegroundColor Yellow
    Write-Host '  WARNING: built with -NoTest. This package is UNVERIFIED.' -ForegroundColor Yellow
    Write-Host '  Do not publish it to AppSource without a full "npm run package".' -ForegroundColor Yellow
    Write-Host '*******************************************************************' -ForegroundColor Yellow
}

exit 0
