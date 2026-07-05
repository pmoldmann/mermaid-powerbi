# Markdown & Mermaid Renderer for Power BI — Version 1.3.0.0 Released

*From basic diagram rendering to a full-featured documentation engine — here's everything that's new.*

---

When I first published the **Markdown / Mermaid Renderer** for Power BI, it did one thing: render Markdown and Mermaid diagrams inside a Power BI visual. Version 1.1.0.0 was lean by design. A lot has changed since then.

Version 1.3.0.0 is now live — and the gap between where this visual started and where it is today is substantial. Here's what's new.

---

## LaTeX Math Rendering via KaTeX

The headline feature of 1.3.0.0: **mathematical formulas are now first-class citizens** in your Power BI reports.

Using [KaTeX](https://katex.org/), the visual renders both inline and display-mode math expressions directly from your Markdown content — no external network requests, fully self-contained.

- **Inline math** — wrap an expression in `$...$`: e.g. `$E = mc^2$`
- **Display math** — centre a formula in its own block with `$$...$$`

This is particularly useful for analytics reports that reference statistical models, forecasting formulas, or financial calculations. Instead of a screenshot of a formula, you can now embed the real thing — rendered crisply, right next to your data.

---

## Advanced Mermaid Diagram Control

Version 1.2.0.0 introduced a new level of control over how Mermaid diagrams are rendered:

**Layout algorithm** — switch between the classic Dagre layout and **ELK (layered)** for more structured diagrams. ELK support includes node placement strategies (Simple, Network Simplex, Linear Segments, Brandes-Köpf) and optional edge merging to reduce clutter in complex graphs.

**Themes and look** — choose from Mermaid's built-in themes (Default, Dark, Forest, Neutral, Base) or set it to *Auto* to follow the visual's color mode. A **Hand-drawn** rendering mode (sketch style) is also available for a more casual feel.

**Color customization** — when using the `Base` theme, four diagram colors can be overridden via Power BI's own color pickers: primary node color, canvas background, note background, and note text.

---

## Definition Lists — Now with Data Binding

You can now bind **two columns as a Definition List pair** — one for the term, one for the value. Each data row becomes one definition list entry, making it easy to render structured label/value layouts (think: product specs, KPI summaries, cost center breakdowns) directly from a table measure — no DAX string concatenation required.

Existing rendering bugs for Definition Lists were also fixed: terms and definitions now render with the correct structure, heading size settings are respected, and measure format strings (e.g. `€ #,##0.00`) are applied correctly.


---

## AppSource Certification — Pending

One more note: I've submitted the visual for **AppSource certification** for the first time. Once approved, it will be installable directly from the Power BI AppSource marketplace without any additional steps.

**Until then**, version 1.3.0.0 is available right now via GitHub and can be integrated as an **organisational custom visual** — meaning your Power BI admins can deploy it tenant-wide without users having to install it manually.

→ [GitHub: pmoldmann/mermaid-powerbi](https://github.com/pmoldmann/mermaid-powerbi)

---

*If you're using this visual in your reports — I'd love to hear what you're building with it.*