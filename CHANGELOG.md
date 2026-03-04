# Changelog

All notable changes to the Markdown / Mermaid Renderer for Power BI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


---

## [1.1.0.0] - 2026-03-04

### Added
- **Flowchart orientation override**: New "Flowchart orientation" setting in Mermaid Settings to override the direction of flowchart diagrams (Top to Bottom, Bottom to Top, Left to Right, Right to Left). Default preserves the orientation defined in the diagram code. This helps report creators choose a layout direction that best fits the available space in the visual.
- **Font settings**: New "Font settings" group with configurable font family, heading font size (h1), body font size, and Mermaid diagram font size. Heading sizes h2–h6 scale proportionally between h1 and body font size.
- **Markdown settings**: New "Markdown settings" group with "Enable line breaks" (render single newlines as `<br>`) and "Code block word wrap" (wrap long lines instead of horizontal scrollbar).

### Changed
- **Settings reorganization**: Split "Mermaid settings" into two groups for better usability:
  - **Mermaid settings**: Flowchart orientation, Max edges, Security level — commonly used settings
  - **Mermaid debug settings**: HTML labels, Markdown auto wrap, Convert `<br>` to newline, Auto backtick labels, Preserve line breaks CSS — advanced/debug settings
- **Dark / Light theme support**: New "Color mode" setting to switch between light and dark theme for the visual, Mermaid diagrams, and all UI components
- **DAX syntax highlighting**: Code blocks with ` ```dax ` are now syntax-highlighted with support for functions, keywords (VAR, RETURN, DEFINE, EVALUATE), table/column references, strings, comments, and operators
- **Power Query (M) syntax highlighting**: Code blocks with ` ```powerquery `, ` ```pq `, or ` ```mscript ` are now syntax-highlighted with support for keywords, data types, quoted identifiers, constants, and functions

### Changed
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
