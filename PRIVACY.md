# Privacy Policy

**Markdown / Mermaid Renderer for Power BI**
Last updated: February 27, 2026

## Overview

The Markdown / Mermaid Renderer visual for Power BI is a free, open-source custom visual. Your privacy is important to us. This policy explains how the visual handles data and personal information.

## Data Collection

**This visual does not collect, store, transmit, or share any personal data or information whatsoever.**

Specifically, the visual does **not**:

- Collect any personal information (names, emails, IP addresses, etc.)
- Track usage or analytics
- Use cookies or local storage for tracking purposes
- Transmit any data to external servers, APIs, or third-party services
- Make any outbound network requests
- Store any data outside of the Power BI environment

## Data Processing

All data processing occurs **entirely locally** within the user's Power BI environment:

- Markdown text provided via the data field is rendered into HTML locally
- Mermaid diagram code blocks are parsed and rendered into SVG locally
- HTML sanitization (via DOMPurify) is performed locally
- No data ever leaves the Power BI report context

## Third-Party Libraries

This visual includes open-source libraries that are bundled and executed locally. None of these libraries make external network calls:

| Library | Purpose | License |
|---------|---------|---------|
| [Mermaid](https://mermaid.js.org/) | Diagram rendering | MIT |
| [react-md-editor](https://github.com/uiwjs/react-md-editor) | Markdown rendering | MIT |
| [Handlebars.js](https://github.com/handlebars-lang/handlebars.js) | Template rendering | MIT |
| [DOMPurify](https://github.com/cure53/DOMPurify) | HTML sanitization | Apache-2.0 |
| [React](https://react.dev/) | UI framework | MIT |

## Children's Privacy

This visual does not knowingly collect any information from anyone, including children under 13 years of age.

## Changes to This Policy

Any changes to this privacy policy will be reflected in the source repository and in updated versions of the visual. The "Last updated" date at the top of this document will be revised accordingly.

## Open Source

The full source code of this visual is publicly available for inspection at:
[https://github.com/pmoldmann/mermaid-powerbi](https://github.com/pmoldmann/mermaid-powerbi)

## Contact

If you have questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/pmoldmann/mermaid-powerbi/issues).
