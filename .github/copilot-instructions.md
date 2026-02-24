# GitHub Copilot Instructions for Mermaid Power BI Visual

## Project Overview

This is a **Power BI Custom Visual** that renders Markdown content with embedded Mermaid diagrams. Users provide a column or measure containing Markdown text, which is then visualized in the report. No editor functionality - content is driven entirely by data.

## Tech Stack

- **TypeScript 5.3** with React 18 (JSX)
- **Redux Toolkit** for global state management
- **Mermaid 11.x** for diagram rendering
- **@uiw/react-md-editor** for Markdown rendering
- **DOMPurify** for HTML sanitization
- **SCSS** for styling
- **Webpack** with `powerbi-visuals-webpack-plugin` for bundling

## Project Structure

```
src/
├── visual.ts          # Main Power BI visual entry point (implements IVisual interface)
├── Application.tsx    # Root React component - renders Markdown content
├── Code.tsx           # Code block handler for Mermaid diagrams and inline styles
├── Error.tsx          # Error boundary component
├── settings.ts        # Visual settings definitions using DataViewObjectsParser
├── utils.ts           # Markdown extraction and sanitization utilities
└── redux/
    ├── store.ts       # Redux store configuration
    ├── slice.ts       # Redux slice with visual state actions/reducers
    └── hooks.ts       # Typed Redux hooks (useAppSelector, useAppDispatch)
```

## Key Patterns

### Power BI Visual Lifecycle

The visual implements the `IVisual` interface from `powerbi-visuals-api`:
- Constructor initializes React with Redux Provider
- `update()` dispatches data changes to Redux store
- `enumerateObjectInstances()` exposes settings to Power BI property pane

```typescript
export class Visual implements IVisual {
    constructor(options: VisualConstructorOptions) { /* init React/Redux */ }
    public update(options: VisualUpdateOptions) { /* dispatch to Redux */ }
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions) { /* expose settings */ }
}
```

### Data Flow

1. User adds a column/measure containing Markdown text to the "Markdown Content" field
2. Power BI calls `visual.update()` with new data
3. Visual extracts markdown from `dataView.single.value` using `extractMarkdownContent()`
4. Redux state is updated with the markdown content
5. React renders the markdown with Mermaid diagram support

### State Management

Use typed Redux hooks instead of plain `useDispatch`/`useSelector`:
```typescript
import { useAppSelector, useAppDispatch } from './redux/hooks';

const markdownContent = useAppSelector((state) => state.options.markdownContent);
const settings = useAppSelector((state) => state.options.settings);
```

### Markdown & Mermaid Rendering

Markdown is rendered using `@uiw/react-md-editor`. The `Code` component handles:
- **Mermaid diagrams**: Code blocks with `language-mermaid` are rendered as SVG diagrams
- **Inline styles**: Code blocks with `language-style` inject CSS into the document
- **Regular code**: Rendered as standard `<code>` elements

```tsx
// Detect mermaid code blocks via className
const isMermaid = className && /^language-mermaid/.test(className.toLocaleLowerCase());

// Render with loose security level for interactivity
mermaid.initialize({
    securityLevel: "loose",
    maxEdges: 30000,
});
```

### Security & Sanitization

Use DOMPurify for HTML sanitization. Default config in `utils.ts`:
- Forbids script injection attributes and tags
- Allows SVG, HTML, data-* attributes
- Use `defaultDompurifyConfig` for consistent sanitization

## Coding Guidelines

### TypeScript
- Use explicit types, avoid `any`
- Import types from `powerbi-visuals-api` with `import X =` syntax
- Define interfaces for component props

### React
- Use functional components with hooks
- Wrap components in `ErrorBoundary` for error handling
- Use `React.useCallback` for event handlers passed to children
- Use `React.useMemo` for computed values

### Redux
- All state changes go through dispatched actions
- Never mutate state directly
- Keep actions in `slice.ts`, use `PayloadAction<T>` typing

## Build Commands

```bash
yarn start          # Start dev server with hot reload
yarn package        # Build production .pbiviz package
yarn lint           # Run ESLint
yarn lintfix        # Auto-fix lint issues
```

## Testing Locally

1. Run `yarn start` to start dev server
2. Enable Developer Mode in Power BI Desktop
3. Add "Developer Visual" to your report
4. Add a column or measure with Markdown text to the visual
5. Changes hot-reload automatically

## Key Files for Common Tasks

| Task | Files |
|------|-------|
| Add new setting | `settings.ts`, `capabilities.json` |
| Modify Markdown rendering | `Application.tsx`, `Code.tsx` |
| Change data extraction | `utils.ts`, `slice.ts` |
| Update styling | `style/visual.scss` |
| Modify visual metadata | `pbiviz.json`, `capabilities.json` |

## Data Binding

The visual uses a "single" dataViewMapping - it expects one value (column or measure) containing Markdown text:

```json
{
    "dataRoles": [
        {
            "displayName": "Markdown Content",
            "name": "markdown",
            "kind": "Measure"
        }
    ],
    "dataViewMappings": [
        {
            "single": {
                "role": "markdown"
            }
        }
    ]
}
```

## Dependencies Notes

- `powerbi-visuals-api` version must match `apiVersion` in `pbiviz.json`
- `powerbi-visuals-utils-dataviewutils` provides settings parsing utilities
- Mermaid requires `securityLevel: "loose"` for click handlers to work
