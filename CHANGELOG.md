# Changelog

All notable changes to the Markdown / Mermaid Renderer for Power BI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
