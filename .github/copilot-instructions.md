# GitHub Copilot Instructions for Mermaid Power BI Visual

## Project Overview

This is a **Power BI Custom Visual** that integrates Markdown and Mermaid diagram rendering into Power BI reports. Users can write Markdown content with embedded Mermaid diagrams using Handlebars templating to dynamically bind Power BI data.

## Tech Stack

- **TypeScript 5.3** with React 18 (JSX)
- **Redux Toolkit** for global state management
- **Mermaid 11.x** for diagram rendering
- **Handlebars** for templating with data binding
- **D3.js** for data formatting, scales, and axes
- **Ant Design (antd)** for UI components
- **DOMPurify** for HTML sanitization
- **SCSS** for styling
- **Webpack** with `powerbi-visuals-webpack-plugin` for bundling

## Project Structure

```
src/
├── visual.ts          # Main Power BI visual entry point (implements IVisual interface)
├── Application.tsx    # Root React application component
├── Editor.tsx         # Template editor with Markdown/Mermaid preview
├── Error.tsx          # Error boundary component
├── helpers.ts         # Handlebars helpers for D3 formatting/scales
├── settings.ts        # Visual settings definitions using DataViewObjectsParser
├── utils.ts           # Data conversion and sanitization utilities
├── Sponsor.tsx        # Sponsorship component
├── Resources.tsx      # Resource management (images)
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

### State Management

Use typed Redux hooks instead of plain `useDispatch`/`useSelector`:
```typescript
import { useAppSelector, useAppDispatch } from './redux/hooks';

const settings = useAppSelector((state) => state.options.settings);
const dispatch = useAppDispatch();
```

### Data Flow

1. Power BI calls `visual.update()` with new data
2. Visual dispatches actions: `setDataView`, `setSettings`, `setViewport`, `setMode`
3. Always use `deepClone()` before dispatching dataViews (they're mutable)
4. React components consume state via `useAppSelector`

### Handlebars Templating

Custom helpers are registered in `helpers.ts` for D3 integration:
- `{{format value ",.2f"}}` - D3 number formatting
- `{{utcFormat date "%Y-%m-%d"}}` - UTC date formatting
- `{{timeFormat date "%H:%M"}}` - Local time formatting
- Scale helpers: `createScale`, `bandScale`, `linearScale`
- `{{#each table.rows}}` - Iterate over data rows

### Mermaid Rendering

Mermaid code blocks in Markdown are rendered in `Editor.tsx`:
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

### Settings
- Define settings classes extending `DataViewObjectsParser`
- Template content is chunked across `chunk0`-`chunk10` due to Power BI property size limits

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
4. Changes hot-reload automatically

## Key Files for Common Tasks

| Task | Files |
|------|-------|
| Add new setting | `settings.ts`, `capabilities.json` |
| Add Handlebars helper | `helpers.ts` |
| Modify editor UI | `Editor.tsx` |
| Change data processing | `utils.ts`, `slice.ts` |
| Update styling | `style/visual.scss` |
| Modify visual metadata | `pbiviz.json`, `capabilities.json` |

## Dependencies Notes

- `powerbi-visuals-api` version must match `apiVersion` in `pbiviz.json`
- `powerbi-visuals-utils-dataviewutils` provides settings parsing utilities
- Mermaid requires `securityLevel: "loose"` for click handlers to work
