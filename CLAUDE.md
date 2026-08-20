# CLAUDE.md

Project guidance for Claude Code when working in this repository.

## Package manager: npm (not yarn)

**Always use `npm`. Never use `yarn`.** `package-lock.json` is the lockfile of
record and must stay committed.

Why: the Microsoft AppSource certification checks the repository for
`package-lock.json` and builds the visual with npm. A submission without that
file is rejected under the "Content requirement policies" check. Building
locally with yarn would also mean testing a different dependency tree than the
one Microsoft actually builds.

- Install: `npm install` (or `npm ci` for a clean, lockfile-exact tree)
- Package the visual: `npm run package`
- After changing dependencies, commit the updated `package-lock.json`
- Dependency pins go in `overrides` — there is no `resolutions` block any more,
  that was yarn-only config
- Do not add `yarn.lock`; a second lockfile drifts from the first
