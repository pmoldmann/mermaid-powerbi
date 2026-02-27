import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { Code, MermaidSettingsContext } from './Code';
import { ErrorBoundary } from './Error';

// Demo markdown content showcasing Markdown + Mermaid capabilities
const DEMO_MARKDOWN = `# Creating Beautiful Documentation with Markdown & Mermaid

Documentation is the backbone of successful projects. With **Markdown** and **Mermaid**, you can create clear, visual, and maintainable documentation directly in Power BI.

## Why Markdown?

Markdown offers:
- **Simplicity** — Write in plain text, get beautiful formatting
- **Portability** — Works everywhere, no vendor lock-in
- **Version Control** — Track changes like code
- **Focus** — Concentrate on content, not formatting

## Why Mermaid?

Mermaid transforms text into diagrams. No design tools needed!

### Example: Document Workflow

\`\`\`mermaid
flowchart LR
    subgraph Create["📝 Create"]
        A[Write Content]
        B[Add Diagrams]
    end
    subgraph Review["🔍 Review"]
        C[Peer Review]
        D[Update]
    end
    subgraph Publish["🚀 Publish"]
        E[Render in Power BI]
    end
    
    A --> B --> C --> D --> E
    D -.->|Iterate| A
\`\`\`

## Key Diagram Types

### 1. Flowcharts for Processes

Perfect for visualizing workflows, decision trees, and procedures.

\`\`\`mermaid
flowchart TD
    Start([Start]) --> Input[/User Input/]
    Input --> Validate{Valid?}
    Validate -->|Yes| Process[Process Data]
    Validate -->|No| Error[Show Error]
    Error --> Input
    Process --> Output[/Display Results/]
    Output --> End([End])
\`\`\`

### 2. Sequence Diagrams for Interactions

Show how components communicate over time.

\`\`\`mermaid
sequenceDiagram
    participant User
    participant PowerBI
    participant Visual
    participant Mermaid

    User->>PowerBI: Add Markdown Data
    PowerBI->>Visual: Update with Content
    Visual->>Mermaid: Parse Diagrams
    Mermaid-->>Visual: Return SVG
    Visual-->>User: Display Result
\`\`\`

### 3. Entity Relationships for Data Models

Document your data structure clearly.

\`\`\`mermaid
erDiagram
    REPORT ||--o{ PAGE : contains
    PAGE ||--o{ VISUAL : displays
    VISUAL ||--o| DATA : uses
    DATA ||--|| SOURCE : "comes from"
    
    REPORT {
        string name
        date created
        string author
    }
    VISUAL {
        string type
        int width
        int height
    }
\`\`\`

## Best Practices

| Practice | Benefit |
|----------|---------|
| Use headers consistently | Easy navigation |
| Keep diagrams focused | Better comprehension |
| Add context with text | Explain the "why" |
| Use meaningful names | Self-documenting |

## Getting Started

1. **Create a column or measure** with your Markdown text
2. **Add Mermaid code blocks** using \\\`\\\`\\\`mermaid syntax
3. **Drop into this visual** and watch it render
4. **Iterate** — Update your data, see instant results

> 💡 **Pro Tip:** Store your documentation in a table and reference it dynamically. This keeps docs in sync with your data!

---

*Start documenting better today. Your future self will thank you.*
`;

// Sanitize schema that preserves br tags
const sanitizeSchema = {
    ...defaultSchema,
    tagNames: [...(defaultSchema.tagNames || []), 'br'],
    ancestors: {
        ...defaultSchema.ancestors,
        br: ['code', 'pre', 'span', 'div', 'p', 'li', 'td', 'th'],
    },
};

// Default Mermaid settings for demo
const defaultMermaidSettings = {
    htmlLabels: true,
    markdownAutoWrap: true,
    securityLevel: 'loose' as const,
    maxEdges: 30000,
    convertBrToNewline: true,
    autoBacktickLabels: true,
    preserveLineBreaksCSS: true,
};

/**
 * Demo section component that shows raw markdown and renders it on button click
 */
export const DemoSection: React.FC = () => {
    const [isRendered, setIsRendered] = React.useState(false);
    const [copyLabel, setCopyLabel] = React.useState('📋 Copy Markdown');

    const handleRenderClick = () => {
        setIsRendered(true);
    };

    const handleShowRawClick = () => {
        setIsRendered(false);
    };

    const handleCopyClick = React.useCallback(() => {
        navigator.clipboard.writeText(DEMO_MARKDOWN).then(() => {
            setCopyLabel('✅ Copied!');
            setTimeout(() => setCopyLabel('📋 Copy Markdown'), 2000);
        }).catch(() => {
            // Fallback for environments without clipboard API
            const textarea = document.createElement('textarea');
            textarea.value = DEMO_MARKDOWN;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopyLabel('✅ Copied!');
            setTimeout(() => setCopyLabel('📋 Copy Markdown'), 2000);
        });
    }, []);

    return (
        <section className="demo-section">
            <div className="demo-header">
                <h2>🎯 Markdown / Mermaid Demo</h2>
                <div className="demo-buttons">
                    <button
                        className={`demo-button ${!isRendered ? 'active' : ''}`}
                        onClick={handleShowRawClick}
                        disabled={!isRendered}
                    >
                        📄 Raw Markdown
                    </button>
                    <button
                        className={`demo-button render-button ${isRendered ? 'active' : ''}`}
                        onClick={handleRenderClick}
                        disabled={isRendered}
                    >
                        ✨ Render
                    </button>
                    <button
                        className="demo-button copy-button"
                        onClick={handleCopyClick}
                    >
                        {copyLabel}
                    </button>
                </div>
            </div>

            <div className="demo-content">
                {!isRendered ? (
                    <div className="demo-raw">
                        <div className="demo-raw-header">
                            <span className="demo-raw-label">Raw Markdown Source</span>
                            <span className="demo-raw-hint">Click "Render" to see the magic →</span>
                        </div>
                        <pre className="demo-raw-content">
                            <code>{DEMO_MARKDOWN}</code>
                        </pre>
                    </div>
                ) : (
                    <div className="demo-rendered">
                        <div className="demo-rendered-header">
                            <span className="demo-rendered-label">✅ Rendered Output</span>
                            <span className="demo-rendered-hint">This is what your reports will look like!</span>
                        </div>
                        <div className="demo-rendered-content" data-color-mode="light">
                            <ErrorBoundary>
                                <MermaidSettingsContext.Provider value={defaultMermaidSettings}>
                                    <MDEditor.Markdown
                                        source={DEMO_MARKDOWN}
                                        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
                                        components={{
                                            code: Code,
                                        }}
                                    />
                                </MermaidSettingsContext.Provider>
                            </ErrorBoundary>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};
