# Changelog

All notable changes to the Markdown / Mermaid Renderer for Power BI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


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
