# Changelog

All notable changes to the Markdown / Mermaid Renderer for Power BI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


---

## [Unreleased]

### Changed
- **Dependency update.** Mermaid 11.15.0 → **11.17.0** and `@mermaid-js/layout-elk` 0.2.1 → **0.2.3**. The layout engines themselves come in transitively and are pinned by those two: `dagre-d3-es` stays at 7.0.14 (mermaid pins it exactly, and it is the current release) and `elkjs` stays on 0.9.x because `@mermaid-js/layout-elk` declares `elkjs: ^0.9.3`.
- KaTeX 0.16.45 → **0.16.47**, deliberately staying on the 0.16 line: mermaid requires `katex ^0.16.47` and `rehype-katex` requires `^0.16`, so a jump to 0.18 would ship a second KaTeX copy. A `resolutions`/`overrides` entry now pins the single version, replacing the duplicate that `rehype-katex` had pulled in.
- Further runtime updates: DOMPurify 3.4.7 → 3.4.14, React / React DOM 19.2.6 → 19.2.8, `@uiw/react-md-editor` 4.1.0 → 4.1.1.
- Power BI: `powerbi-visuals-api` 5.11.0 → **5.11.1** (`pbiviz.json` `apiVersion` raised in lockstep — the webpack plugin feeds it from the installed package), `powerbi-visuals-webpack-plugin` 5.0.3, and `powerbi-visuals-utils-dataviewutils` / `-formattingutils` 6.x → **7.0.0**. In v7 `formattingutils` moved its entry point from `lib/src/index.js` to `lib/index.js`, which the test alias in `vitest.config.ts` follows.
- Toolchain: ESLint 10.8.1, typescript-eslint 8.67.0, webpack 5.109.2, webpack-cli 7.2.2, webpack-dev-server 5 → **6**, sass 1.102.0, sass-loader 16 → **17**, ts-loader 9.6.2, vitest and `@vitest/coverage-v8` 3 → **4**.
- `rehype-rewrite` is now a declared dependency — `Code.tsx` imports `getCodeString` from it directly, but it had only been reaching the build transitively via `@uiw/react-md-editor`.
- Dropped the dead `@types/dompurify` (DOMPurify 3 ships its own types) and `@types/react-inspector` (the package is not used).

### Notes
- Vite is pinned to `^7.3.0` in `resolutions`. Vitest 4 otherwise pulls Vite 8, whose Rolldown bindings are published as per-platform optional dependencies that Yarn 1 tries — and fails — to resolve for every platform. Vitest 4 supports Vite 6, 7 and 8, so this is a lockfile constraint only.
- TypeScript stays on 6.0.3: typescript-eslint 8.67 declares `typescript >=4.8.4 <6.1.0`, so TypeScript 7 would break linting. Babel remains on 7 and `jsdom` on 29 (jsdom 30 requires Node ≥ 24.15).
- No behavioural change intended. The test suite mocks mermaid, so diagram rendering was verified manually in the developer visual.

---

## [1.3.2.0] - 2026-08-18

### Performance

Opening a report containing the visual in the Power BI Service took roughly two minutes, and the report page stayed unresponsive afterwards. The cause was the size of the shipped bundle, not the rendering itself: the package was **10.4 MB compressed, expanding to ~40 MB of JavaScript** that the browser had to download, parse and evaluate on every report load. It is now **1.7 MB / ~5.9 MB**.

- **Production build.** The packaging configuration was building in webpack's development mode with `devtool: 'inline-source-map'`, which embedded a 24 MB source map as base64 *inside* `visual.js` and shipped it to every report viewer. It also left `NODE_ENV` unset, so React, micromark and mdast used their development builds — larger and measurably slower at runtime. The package build now runs in production mode without source maps; `npm run start` and the new `npm run package:dev` still produce a fully debuggable build (with a separate `.map` file, never `eval`).
- **Syntax highlighting trimmed to the languages that are actually used.** The Markdown preview pulled in Prism's complete language set (~290 definitions) through its default entry point. Highlighting is now built from a hand-picked list — HTML/XML, CSS, JavaScript, TypeScript, JSX/TSX, JSON, YAML, Markdown, Python, SQL, Bash, PowerShell, C#, **DAX** and **Power Query (M)**. Fences tagged with any other language render unhighlighted instead of failing.
- **Only the woff2 font format is embedded.** KaTeX declares each of its ~20 fonts as woff2, woff and ttf. Every browser Power BI supports takes the woff2, so the two fallback formats are no longer carried in the bundle.
- **Bundle size is now enforced at build time** via webpack's performance budget, so a regression of this kind surfaces during the build rather than in the service.

### Changed
- **Resizing is no longer treated as a data change.** Every frame of a resize drag previously deep-cloned the entire DataView, re-extracted all Markdown sections and rebuilt one selection ID per row. Resize updates now only update the viewport, and are coalesced while the handle is being dragged.
- **Rendered diagrams are cached in memory.** Diagrams are re-mounted whenever the section list changes or content scrolls; identical diagram code with identical settings is no longer laid out from scratch each time. The cache holds the sanitized SVG, so the DOMPurify pass cannot be bypassed by a cache hit, and it is memory-only — nothing is persisted.
- Mermaid's global configuration is only re-applied when it has actually changed.

### Fixed
- **KaTeX math fonts were missing from the package.** A loader rule was misconfigured (`type: 'javascript/auto'` was absent), so webpack ignored the base64 inlining, wrote the font files next to the bundle and rewrote the `@font-face` rules to point at `publicPath + hash`. A `.pbiviz` contains exactly one JavaScript file and nothing else, so those references resolved to nothing and formulas rendered in fallback system fonts instead of KaTeX's own. The fonts are now embedded in the bundle and math renders with correct typography. This affected all previous releases that shipped math support.

### Notes
- No change to the visual's privileges: `capabilities.json` still declares an empty `privileges` array — no web access, no local storage.

---

## [1.3.1.1] - 2026-07-07

### Added
- **Content truncation warning** — when a single column value or measure reaches Power BI's per-value character limit (~32,767), the visual now shows a warning banner above the content, indicating that the text was likely truncated by Power BI before it reached the visual. Split long documents across multiple rows to render them in full.

### Changed
- Updated documentation.

---

## [1.3.1.0] - 2026-07-04

### Security
- **No `<a>` elements are rendered from data-field Markdown** (Power BI certification 1200.1.3). Previously, Markdown links, GFM autolinks and bare URLs in field data produced real `<a href="...">` anchors in the DOM. This was a concern for two reasons: relative hrefs (e.g. `href=xss`) resolve in the browser against `https://app.powerbi.com/...`, and `http`/`https` anchors could navigate directly, bypassing the host confirmation dialog.

### Changed
- Markdown links are now rendered through a dedicated `SafeLink` component (`<span>`, never `<a>`):
  - `http`/`https`/`mailto` links remain fully clickable and open externally via Power BI's `host.launchUrl()` (native confirmation dialog) — unchanged behaviour for end users.
  - Relative or other-protocol links are rendered as inert, non-navigable text.
- No functionality was removed; the Mermaid diagram link handling (which already strips `href` and routes through `host.launchUrl()`) is unaffected.

---

## [1.3.0.0] - 2026-06-05

### Added
- **LaTeX math rendering via KaTeX**: Inline and display math formulas are now rendered directly in Markdown content using [KaTeX](https://katex.org/).
  - **Inline math** — wrap expressions in `$...$`: e.g. $E = mc^2$
  - **Display math** — wrap expressions in ```$$...$$``` on their own line for centred, block-level output:
    
    $$\hat{kW}(t) = \hat{T}(\text{Tag}(t)) \cdot \frac{\overline{kW}_{\text{Slot}}}{\overline{kW}_{\text{Tag,Ref}}}$$
    
  - All standard KaTeX commands are supported (fractions, roots, integrals, Greek letters, matrices, aligned environments, etc.)
  - Fonts are fully self-contained — no external network requests required

---

## [1.2.2.0] - 2026-05-29

### Added
- **Copy rendered HTML to clipboard**: New context menu entries "Copy section HTML" and "Copy all HTML" expose the fully rendered HTML of the visual for debugging and inspection purposes.
- **Paired Definition List columns** ("Definition List Header" + "Definition List Value"): Two columns can now be assigned as a term/value pair. Each data row is rendered as one Definition List entry, enabling repeated sections — e.g. one entry per product, cost center, or time period — from a regular table measure.

### Fixed
- **Definition Lists were not rendered correctly**: Terms and definitions appeared unstyled without the expected list structure.
- **Definition List term sizing had no effect**: The "Definition List Heading" size setting was ignored — all terms appeared at the same size regardless of the selected heading level.
- **Number and currency formats not applied to Definition List values**: Measure format strings (e.g. `€ #,##0.00`) were ignored for value columns in Definition Lists.

### Changed
- Replaced deprecated `extra-watch-webpack-plugin`, `null-loader`, and `raw-loader` with webpack 5 native equivalents (`devServer.watchFiles`, `asset/source` module type)
- Resolved npm peer dependency warnings caused by outdated transitive `ajv@6.x` / `ajv-keywords@3.x` dependency chain
- Updated pbiviz API to 5.11.0
- **Heading scale factors adjusted** — H2–H6 heading sizes now use a more evenly distributed scale relative to the base heading size: H2 = 90 %, H3 = 80 %, H4 = 70 %, H5 = 60 %, H6 = 50 % (previously H2 = 85 %, H3 = 70 %, H4 = 60 %, H5 = 50 %, H6 = 45 %)
- **Default "Definition List Heading" level changed to H3** (previously "None")

---

## [1.2.1.0] - 2026-05-29

### Changed
- Prepared visual for AppSource certification
- Added localization support for all UI strings, Format Pane labels, and capabilities
- Added high contrast mode support
- Added keyboard focus and multi-visual selection support

### Fixed
- Format Pane not rendering in Power BI (migration to `getFormattingModel` API)
- 14 lint warnings resolved

---

## [1.2.0.0] - 2026-05-28

### Added
- **Extended Mermaid rendering configuration**: New settings for finer control over Mermaid diagram rendering:
  - **Layout algorithm** — choose between the default Dagre layout and ELK (layered) for more compact or structured diagrams
  - **Theme** — select Mermaid's built-in themes (Default, Dark, Forest, Neutral, Base) or "Auto" to follow the visual's color mode
  - **Look** — switch between "Default" (classic) and "Hand-drawn" (sketch-style) rendering
  - **ELK: Merge edges** — toggle edge merging in ELK layout (reduces visual clutter in complex diagrams)
  - **ELK: Node placement** — configure node placement strategy in ELK layout (Simple, Network Simplex, Linear Segments, Brandes-Köpf)
- **Mermaid theme color customization**: New color picker settings in "Mermaid theme settings". When **Theme** is set to `Base` and **Customize theme colors** is enabled, four individual colors can be overridden via Power BI color pickers:
  - **Primary color** — background of nodes and primary diagram elements
  - **Background** — base diagram canvas background
  - **Note background** — background of note boxes in sequence diagrams
  - **Note text color** — text color inside note boxes
  These settings only take effect with the `Base` theme, which exposes Mermaid's full theme variable system.

### Security
- **Mermaid 11.15.0** — fixes four CVEs directly relevant to this visual:
  - CVE-2026-41148 / CVE-2026-41149: Prevent CSS injection via `classDef` statements (replaced raw CSS injection with CSSOM)
  - CVE-2026-41159: Block CSS scope escape via `stylis`
  - CVE-2026-41150: Add iteration limit to Gantt `excludes` to prevent infinite loops
- **DOMPurify 3.4.7** — includes CVE fix from 3.4.5 (publicly known XSS bypass) plus hardening of Shadow DOM and URI validation edge cases

### Changed
- **Library upgrades**: Updated all dependencies to latest versions:
  - React 18.2.0 → **19.2.6** (major upgrade)
  - Redux Toolkit 1.9.7 → **2.12.0** (major upgrade)
  - react-redux 8.1.3 → **9.3.0** (major upgrade)
  - Mermaid 11.12.3 → **11.15.0**
  - DOMPurify 3.2.6 → **3.4.7**
  - Handlebars 4.7.8 → **4.7.9**
  - react-md-editor 4.0.4 → **4.1.1**
  - TypeScript 5.3.2 → **6.0.3** (major upgrade)
  - ESLint 8.54.0 → **10.2.0** (major upgrade)
  - webpack-cli 5.1.4 → **7.0.2** (major upgrade)
  - Babel 7.23.3 → **7.29.7** (major upgrade)
  - @typescript-eslint 8.58.2 → **8.60.0**
  - sass 1.99.0 → **1.100.0**
  - powerbi-visuals-webpack-plugin 5.0.1 → **5.0.2**
  - sass-loader 13.3.2 → **16.0.7**, css-loader 6.8.1 → **7.1.4**, and more

### Fixed
- **Zoom in Mermaid diagrams**: Fixed zoom controls not working correctly on Mermaid diagrams
- Setting "Mermaid Font Size" did not have any effect. 
- "Dark Mode" now draws a black canvas.
- fixed "highlight" markdown function (did not work before).
---

## [1.1.1.0] - 2026-03-10

### Added
- **Blockquote headers**: New settings in "Markdown functions" to automatically add a heading above blockquote sections. The heading uses the column/measure display name so users can identify what they see when multiple elements are stacked in a visual.
  - **Blockquote: Add header** (default: on) — toggles the heading on or off
  - **Blockquote: Header format** (default: H3) — sets the heading level (H1–H6)
- **Code Block headers**: New settings in "Markdown functions" to automatically add a heading above code block sections. Same rationale as blockquote headers.
  - **Code Block: Add header** (default: on) — toggles the heading on or off
  - **Code Block: Header format** (default: H3) — sets the heading level (H1–H6)

---

## [1.1.0.0] - 2026-03-09

### Added
- **Deduplicate values**: New "Deduplicate values" toggle in View settings (default: off). When enabled, each column is treated independently and only distinct values are rendered. This prevents repeated measure values when combining measures and columns in the same visual — without deduplication, Power BI repeats each measure value once per row of any column present.
- **Multiple measures support**: The "Markdown Content" field now accepts up to 10 measures. Each measure is rendered as a separate section (stacked vertically with `<hr>` separators), enabling modular report layouts without DAX string concatenation. Cross-filtering is automatically disabled in measure mode.
- **Per-measure formatting**: When two or more measures are added, a new "Measure formatting" section appears in the property pane. Each measure can be individually formatted as:
  - **Heading (H1 / H2 / H3)** — wraps the value in `#`, `##`, or `###`
  - **Code Block** — wraps the value in a fenced code block with a configurable language (free text, e.g. `json`, `sql`, `dax`, `mermaid`)
  - **Highlight** — wraps the value in `==highlight==` syntax
  - **Definition List** — renders the measure name as the term and the value as the definition (`: value`), using Markdown definition list syntax. This is ideal for displaying label/value pairs (e.g. KPI name + value) in a clean, structured format.
  - **Blockquote** — wraps each line in `> ` prefix with blank lines before and after for correct rendering.
- **Flowchart orientation override**: New "Flowchart orientation" setting in Mermaid Settings to override the direction of flowchart diagrams (Top to Bottom, Bottom to Top, Left to Right, Right to Left). Default preserves the orientation defined in the diagram code. This helps report creators choose a layout direction that best fits the available space in the visual.
- **Font settings**: New "Font settings" group with configurable font family, heading font size (h1), body font size, and Mermaid diagram font size. Heading sizes h2–h6 scale proportionally between h1 and body font size.
- **Markdown settings**: New "Markdown settings" group with "Enable line breaks" (render single newlines as `<br>`) and "Code block word wrap" (wrap long lines instead of horizontal scrollbar).
- **Mermaid tooltip support**: Tooltips defined in Mermaid `click` directives (e.g. `click A "url" "tooltip text"`) are now displayed as styled popups when hovering over diagram nodes. This uses a custom JavaScript-based tooltip system for reliable rendering across all environments including Power BI Desktop and Service.
- **Safe external link handling**: Links defined in Mermaid `click` directives are no longer opened directly inside the visual. Instead, clicking a linked node shows a confirmation dialog (via Power BI's native `host.launchUrl()`) asking the user whether to open the URL in an external browser. This prevents users from getting trapped inside the visual after clicking a link.
- **Fullscreen mode for Mermaid diagrams**: Each Mermaid diagram now includes a fullscreen button (⛶) in the toolbar. Clicking it expands the diagram to fill the entire visual area, making it easier to inspect complex diagrams. Press ESC or click the close button (✕) to exit fullscreen mode.
- **Cross-filtering**: New "Interactivity" settings group with a "Cross filter" toggle (default: off). When enabled and a column (not a measure) provides the data, clicking on a markdown section filters other visuals by the corresponding data row. Ctrl+Click to select multiple sections. Non-selected sections are visually dimmed.
- **Copy markdown context menu**: New "Copy markdown menu" toggle in View settings (default: off). When enabled, right-clicking the visual shows a custom context menu with "Copy section markdown" (copies the Markdown of the clicked section) and "Copy all markdown" (copies the entire content). A "More options…" entry opens the standard Power BI context menu. When disabled, right-click shows the standard Power BI menu directly.
- **Power BI data tooltips**: When using a column as data source, additional columns can be added to the "Tooltips" data role. Hovering over a markdown section displays the tooltip values for the corresponding row.

### Changed
- **Settings reorganization**: Moved "Show debug panel" to the "Mermaid debug settings" group for a cleaner property pane. Split "Mermaid settings" into two groups for better usability:
  - **Mermaid settings**: Flowchart orientation, Max edges, Security level — commonly used settings
  - **Mermaid debug settings**: HTML labels, Markdown auto wrap, Convert `<br>` to newline, Auto backtick labels, Preserve line breaks CSS — advanced/debug settings
- **Dark / Light theme support**: New "Color mode" setting to switch between light and dark theme for the visual, Mermaid diagrams, and all UI components
- **DAX syntax highlighting**: Code blocks with ` ```dax ` are now syntax-highlighted with support for functions, keywords (VAR, RETURN, DEFINE, EVALUATE), table/column references, strings, comments, and operators
- **Power Query (M) syntax highlighting**: Code blocks with ` ```powerquery `, ` ```pq `, or ` ```mscript ` are now syntax-highlighted with support for keywords, data types, quoted identifiers, constants, and functions
- Mermaid diagrams automatically use the dark theme when color mode is set to dark
- Search bar and debug panel adapt to the selected color mode
- Switched internal data mapping from `categorical` to `table` for improved settings persistence


### Fixed
- Settings toggles (Color mode, Show debug panel) now work correctly even when no data field is connected. Added `supportsEmptyDataView` capability so Power BI delivers a DataView with settings metadata even without bound data.

---

## [1.0.0.0] - 2026-02-26

### Added
- Initial release of Markdown / Mermaid Renderer for Power BI
- **Markdown rendering** with full CommonMark support
- **Mermaid diagram support** including:
  - Flowcharts and process diagrams
  - Sequence diagrams
  - Entity-Relationship (ER) diagrams
  - Class diagrams
  - State diagrams
  - Gantt charts
  - Pie charts
  - And more Mermaid diagram types
- **Interactive demo** on welcome page showcasing Markdown and Mermaid capabilities
- **Zoom controls** for detailed diagram viewing
- **Search functionality** (Ctrl+F) for finding text within documents
- **Security features** with DOMPurify sanitization
- **Configurable Mermaid settings**:
  - HTML labels support
  - Markdown auto wrap
  - Security level options
  - Max edges configuration
  - Line break handling options
- **Debug panel** for troubleshooting Mermaid code
- Welcome page with usage instructions when no content is provided
- Support for multiple rows concatenation

### Technical
- Built with React 18.2.0
- Mermaid 11.12.3 for diagram rendering
- TypeScript 5.3 for type safety
- Redux Toolkit for state management
- DOMPurify 3.2.6 for HTML sanitization
