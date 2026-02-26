# Markdown / Mermaid Renderer for Power BI

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Power BI](https://img.shields.io/badge/Power%20BI-Custom%20Visual-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

A Power BI custom visual that renders **Markdown** content with embedded **Mermaid diagrams**. Transform your text-based content into beautifully formatted documentation, flowcharts, sequence diagrams, and more — directly within your Power BI reports.

## 📄 What is this Visual?

This visual allows you to embed rich documentation and diagrams in your Power BI reports using standard Markdown syntax and Mermaid diagram notation. It's perfect for:

- Embedding **documentation** directly in Power BI reports
- Visualising **flowcharts** and **process diagrams**
- Visualizing **data relationships** with ER diagrams
- Documenting **architecture** and system designs
- Adding **dynamic content** using Handlebars templates

## Prerequisites
- You need a column in your data model that contains markdown text.

## 🚀 How to Use

1. Add a **column or measure** containing Markdown text to the *"Markdown Content"* field
2. Write standard Markdown syntax in your data source
3. For diagrams, use Mermaid code blocks: ` ```mermaid `
4. Use the **zoom controls** (+/−) for detailed diagram viewing
5. Use **Ctrl+F** to search within the document

> 💡 **Tip:** When using a column, multiple rows are automatically concatenated and displayed together.

### Example Markdown with Mermaid

```markdown
# Project Status

Here's the current workflow:

` ` `mermaid
flowchart LR
    A["Data Input"] --> B["Processing"]
    B --> C["Output"]
` ` `

## Details

- Step 1: Gather data
- Step 2: Process
- Step 3: Deliver
```

## 📦 Libraries & Versions

| Library | Version |
|---------|---------|
| Mermaid | 11.12.3 |
| React | 18.2.0 |
| react-md-editor | 4.0.4 (Markdown rendering) |
| Handlebars | 4.7.8 |
| DOMPurify | 3.2.6 |

---

## ⚙️ Configuration Settings

### View Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| **Show empty message** | Boolean | `true` | Shows a welcome page when no markdown content is provided |
| **Show debug panel** | Boolean | `false` | Shows debug information including raw and processed Mermaid code |

### Mermaid Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| **HTML labels** | Boolean | `true` | Enable HTML rendering in node labels. Required for rich text formatting in labels. |
| **Markdown auto wrap** | Boolean | `true` | Enable automatic line wrapping in markdown labels |
| **Security level** | Enum | `Loose` | Security level for Mermaid rendering: `Loose`, `Strict`, or `Sandbox`. Loose is required for click handlers. |
| **Max edges** | Number | `30000` | Maximum number of edges allowed in a diagram |
| **Convert &lt;br&gt; to newline** | Boolean | `true` | Converts `<br/>` tags to newlines. Mermaid escapes `<br>` as text, this fixes line breaks. |
| **Auto backtick labels** | Boolean | `true` | Automatically wraps labels containing newlines in backticks. Mermaid only renders newlines in backtick-wrapped labels. |
| **Preserve line breaks CSS** | Boolean | `true` | Applies CSS to preserve line breaks in Mermaid labels (`white-space: pre-wrap`) |

### Line Break Settings Explained

The three line-break settings work together to ensure `<br/>` tags render correctly in Mermaid diagrams:

```mermaid
flowchart TD
    subgraph Input["Source Data"]
        A["Label with BR tag"]
    end
    
    subgraph S1["Convert BR to Newline"]
        B["BR replaced with newline char"]
    end
    
    subgraph S2["Auto Backtick Labels"]
        C["Wrap in backtick syntax"]
    end
    
    subgraph S3["Preserve Line Breaks CSS"]
        D["white-space: pre-wrap"]
    end
    
    subgraph Output["Rendered Diagram"]
        E["Multi-line label"]
    end
    
    A --> B --> C --> D --> E
```

**Why these are needed:**
- `htmlLabels: true` uses HTML `<foreignObject>` which escapes `<br/>` as text
- `htmlLabels: false` uses SVG `<tspan>` which handles newlines natively (but with tighter spacing)

---

## 🛠️ Technical Documentation

### Architecture Overview

```mermaid
flowchart TB
    subgraph PowerBI["Power BI Host"]
        DV["DataView\n(Markdown Content)"]
    end
    
    subgraph Visual["Visual Entry Point"]
        VT["visual.ts\nIVisual Implementation"]
    end
    
    subgraph Redux["State Management"]
        ST["store.ts"]
        SL["slice.ts\nActions & Reducers"]
    end
    
    subgraph React["React Components"]
        APP["Application.tsx\nRoot Component"]
        WP["WelcomePage.tsx\nLanding Page"]
        MD["MDEditor.Markdown\nMarkdown Renderer"]
        CODE["Code.tsx\nCode Block Handler"]
        MERM["MermaidDiagram\nZoom/Pan Component"]
        SB["SearchBar.tsx\nCtrl+F Search"]
        DP["DebugPanel.tsx\nDevelopment Tools"]
    end
    
    subgraph Mermaid["Mermaid Library"]
        MI["mermaid.initialize()"]
        MR["mermaid.render()"]
    end
    
    DV --> VT
    VT -->|"dispatch"| SL
    SL --> ST
    ST -->|"useAppSelector"| APP
    APP -->|"No Content"| WP
    APP -->|"Has Content"| MD
    MD -->|"code blocks"| CODE
    CODE -->|"language-mermaid"| MERM
    MERM --> MI --> MR
    APP --> SB
    APP --> DP
```

### Component Hierarchy

```mermaid
flowchart TD
    V["Visual.ts"] --> P["Provider (Redux Store)"]
    P --> A["Application"]
    A --> W["WelcomePage"]
    A --> S["SearchBar"]
    A --> D["DebugPanel"]
    A --> CTX["MermaidSettingsContext.Provider"]
    CTX --> M["MDEditor.Markdown"]
    M --> C["Code"]
    C --> MD["MermaidDiagram"]
    C --> ST["Style Injection"]
    C --> CD["Regular Code Block"]
    
    style V fill:#4FD1C5
    style A fill:#68D391
    style M fill:#F6AD55
    style MD fill:#FC8181
```

### Data Flow

```mermaid
sequenceDiagram
    participant PBI as Power BI
    participant V as Visual.ts
    participant R as Redux Store
    participant A as Application
    participant M as MDEditor
    participant C as Code.tsx
    participant D as MermaidDiagram
    
    PBI->>V: update(options)
    V->>V: extractMarkdownContent()
    V->>R: dispatch(setOptions)
    R->>A: State Update
    A->>A: useAppSelector()
    A->>M: source={markdownContent}
    M->>C: code block detected
    
    alt is Mermaid
        C->>C: Process code (br→\n, backticks)
        C->>D: <MermaidDiagram code={...} />
        D->>D: mermaid.initialize()
        D->>D: mermaid.render()
        D-->>M: SVG Output
    else is Style
        C->>C: Inject <style> tag
    else is Regular Code
        C-->>M: <code> element
    end
```

### File Structure

```
src/
├── visual.ts              # Power BI IVisual implementation
├── Application.tsx        # Root React component
├── Code.tsx               # Code block handler (Mermaid, styles)
├── WelcomePage.tsx        # Landing page when no content
├── SearchBar.tsx          # Ctrl+F search functionality
├── DebugPanel.tsx         # Development debugging panel
├── Error.tsx              # Error boundary component
├── settings.ts            # Visual settings definitions
├── utils.ts               # Markdown extraction, sanitization
├── helpers.ts             # Utility functions
└── redux/
    ├── store.ts           # Redux store configuration
    ├── slice.ts           # State slice with actions/reducers
    └── hooks.ts           # Typed useAppSelector/useAppDispatch
```

### Mermaid Code Processing Pipeline

```mermaid
flowchart LR
    subgraph Input
        RAW["Raw Mermaid Code"]
    end
    
    subgraph Processing["Code.tsx Processing"]
        DE["Decode HTML Entities"]
        BR["Convert BR to Newline"]
        BT["Add Backtick Syntax"]
    end
    
    subgraph Rendering["MermaidDiagram"]
        INIT["mermaid.initialize"]
        RENDER["mermaid.render"]
        CSS["Apply CSS Class"]
    end
    
    subgraph Output
        SVG["Rendered SVG"]
    end
    
    RAW --> DE --> BR --> BT --> INIT --> RENDER --> CSS --> SVG
```

### Settings Context Flow

```mermaid
flowchart TD
    VS["VisualSettings\n(settings.ts)"]
    VT["visual.ts\nparse settings"]
    RD["Redux Store\nstate.options.settings"]
    APP["Application.tsx"]
    CTX["MermaidSettingsContext"]
    CODE["Code.tsx\nuseContext()"]
    MERM["MermaidDiagram\nuseContext()"]
    
    VS --> VT --> RD --> APP
    APP -->|"Provider value"| CTX
    CTX --> CODE
    CTX --> MERM
    
    CODE -->|"convertBrToNewline\nautoBacktickLabels"| PROC["Code Processing"]
    MERM -->|"htmlLabels, securityLevel\nmaxEdges, preserveLineBreaksCSS"| INIT["mermaid.initialize()"]
```

### Zoom & Pan State Machine

```mermaid
stateDiagram-v2
    [*] --> Normal: Initial (zoom = 1)
    
    Normal --> ZoomedIn: Zoom In (+)
    Normal --> ZoomedOut: Zoom Out (-)
    Normal --> ZoomedIn: Ctrl+Wheel Up
    Normal --> ZoomedOut: Ctrl+Wheel Down
    
    ZoomedIn --> Panning: MouseDown (zoom > 1)
    ZoomedIn --> Normal: Reset (⟲)
    ZoomedIn --> ZoomedIn: Zoom In (max 400%)
    ZoomedIn --> ZoomedOut: Zoom Out
    
    ZoomedOut --> Normal: Zoom In
    ZoomedOut --> ZoomedOut: Zoom Out (min 25%)
    ZoomedOut --> Normal: Reset (⟲)
    
    Panning --> ZoomedIn: MouseUp / MouseLeave
    
    note right of Panning
        Pan offset updated
        on MouseMove
    end note
```

---

## 🔧 Development

### Prerequisites

- Node.js 18+
- Yarn package manager
- Power BI Desktop with Developer Mode enabled

### Setup

```bash
# Install dependencies
yarn install

# Start development server (hot reload)
yarn start

# Build production package
yarn package

# Run linting
yarn lint
yarn lintfix
```

### Testing Locally

1. Run `yarn start` to start the dev server
2. Enable Developer Mode in Power BI Desktop
3. Add "Developer Visual" to your report
4. Add a column or measure with Markdown text
5. Changes hot-reload automatically

---

## � Security & Certification Compliance

This visual is designed to meet **Microsoft Power BI certification requirements**. It operates entirely offline with no external communication.

### No External Communication

**This visual does not communicate with any external services or resources.**

The following measures ensure complete isolation:

| Measure | Implementation |
|---------|----------------|
| **No network requests** | No `fetch()`, `XMLHttpRequest`, or `WebSocket` calls in the codebase |
| **Empty privileges** | `capabilities.json` contains `"privileges": []` - no web access requested |
| **No external URLs** | All resources are bundled; no CDN or external script loading |
| **Offline rendering** | Mermaid diagrams are rendered entirely client-side |

### DOM Security

User-provided content is sanitized to prevent XSS attacks:

| Component | Sanitization Method |
|-----------|---------------------|
| **Markdown content** | Sanitized via `rehype-sanitize` with strict schema |
| **HTML content** | Sanitized via `DOMPurify` with comprehensive config |
| **Mermaid SVG output** | Rendered by Mermaid library, inserted as SVG elements |

### DOMPurify Configuration

The visual uses a strict DOMPurify configuration that:

- **Forbids** all event handler attributes (`onclick`, `onerror`, `onload`, etc.)
- **Forbids** dangerous tags (`script`, `iframe`, `object`, `embed`, etc.)
- **Forbids** external URL protocols
- **Allows** SVG and HTML profiles for diagram rendering
- **Sanitizes** all user input before DOM insertion

### innerHTML Usage

Where `innerHTML` is used, it is explicitly marked with ESLint disable comments and justified:

1. **Mermaid SVG rendering** - Required to insert Mermaid's generated SVG output
2. **HTML entity decoding** - Uses a detached textarea element (safe pattern)
3. **Style injection** - User-defined styles with React's `dangerouslySetInnerHTML`
4. **Handlebars axis rendering** - SVG generation for D3 axes

All `innerHTML` usage involves either:
- Library-generated content (Mermaid SVG)
- Controlled non-executable content (textarea for entity decoding)
- User-acknowledged custom styling (Style code blocks)

### Certification Checklist

| Requirement | Status |
|-------------|--------|
| No external HTTP/HTTPS requests | ✅ |
| No WebSocket connections | ✅ |
| No `fetch()` or `XMLHttpRequest` | ✅ |
| No `eval()` or `new Function()` | ✅ |
| Privileges array is empty | ✅ |
| DOM manipulation is sanitized | ✅ |
| Only public OSS dependencies | ✅ |
| TypeScript source code | ✅ |
| ESLint with powerbi-visuals plugin | ✅ |

---

## �👤 Author

**Paul Moldmann**

*Special thanks to **Ilfat Galiev** who originally created this visual, which has been adapted and enhanced.*

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
