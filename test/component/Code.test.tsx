import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import { createMermaidMock } from '../mocks/mermaid';
import { singleDataView } from '../fixtures/dataView';

vi.mock('mermaid', () => createMermaidMock());
vi.mock('@mermaid-js/layout-elk', () => ({ default: {} }));

type MermaidMock = {
    initialize: ReturnType<typeof vi.fn>;
    render: ReturnType<typeof vi.fn>;
    registerLayoutLoaders: ReturnType<typeof vi.fn>;
};

let mermaid: MermaidMock;
let renderApp: typeof import('../helpers/renderApp').renderApp;

/**
 * src/Code.tsx keeps the last mermaid config and a rendered-SVG cache in
 * module-level state, so the module registry is reset between tests.
 */
beforeEach(async () => {
    vi.resetModules();
    mermaid = ((await import('mermaid')) as unknown as { default: MermaidMock }).default;
    ({ renderApp } = await import('../helpers/renderApp'));
});

function mermaidMarkdown(diagram: string): string {
    return '```mermaid\n' + diagram + '\n```';
}

/** The source string mermaid.render() was called with. */
async function renderedSource(): Promise<string> {
    await waitFor(() => expect(mermaid.render).toHaveBeenCalled());
    return mermaid.render.mock.calls[0][1] as string;
}

/** The config mermaid.initialize() was called with. */
async function initializedConfig(): Promise<Record<string, unknown>> {
    await waitFor(() => expect(mermaid.initialize).toHaveBeenCalled());
    return mermaid.initialize.mock.calls[0][0] as Record<string, unknown>;
}

describe('Code — mermaid rendering', () => {
    it('renders a mermaid fence through mermaid and injects the svg', async () => {
        const { container } = renderApp({
            dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A --> B')),
        });

        await waitFor(() => expect(mermaid.render).toHaveBeenCalledTimes(1));
        await waitFor(() => {
            expect(container.querySelector('code.mermaid svg')).toBeInTheDocument();
        });
    });

    it('shows zoom and fullscreen controls around the diagram', async () => {
        renderApp({ dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A --> B')) });

        expect(await screen.findByTitle('Zoom In')).toBeInTheDocument();
        expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
        expect(screen.getByTitle('Reset Zoom')).toBeInTheDocument();
        expect(screen.getByTitle('Fullscreen')).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('falls back to the raw source when mermaid cannot parse the diagram', async () => {
        const { container } = renderApp({
            dataView: singleDataView(mermaidMarkdown('flowchart TD\n  INVALID -->')),
        });

        await waitFor(() => {
            expect(container.querySelector('code.mermaid')).toHaveTextContent('INVALID');
        });
        expect(container.querySelector('code.mermaid svg')).toBeNull();
    });

    it('does not render a mermaid diagram for an ordinary code fence', async () => {
        const { container } = renderApp({
            dataView: singleDataView('```js\nconst a = 1;\n```'),
        });

        await waitFor(() => expect(container.querySelector('code')).toBeInTheDocument());
        expect(mermaid.render).not.toHaveBeenCalled();
    });
});

describe('Code — mermaid source preprocessing', () => {
    it('decodes HTML entities in the diagram source', async () => {
        renderApp({
            dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A["a &amp; b"] --> B')),
        });
        expect(await renderedSource()).toContain('a & b');
    });

    it('converts <br/> to a newline when convertBrToNewline is on', async () => {
        renderApp({
            dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A["one<br/>two"] --> B')),
        });
        const source = await renderedSource();
        expect(source).not.toContain('<br');
        expect(source).toContain('one\ntwo');
    });

    it('keeps <br/> untouched when convertBrToNewline is off', async () => {
        renderApp({
            dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A["one<br/>two"] --> B')),
            settings: (s) => {
                s.mermaidDebug.convertBrToNewline = false;
                s.mermaidDebug.autoBacktickLabels = false;
            },
        });
        expect(await renderedSource()).toContain('<br/>');
    });

    it('wraps multi-line node labels in backticks so mermaid honours the break', async () => {
        renderApp({
            dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A["one<br/>two"] --> B')),
        });
        expect(await renderedSource()).toContain('["`one\ntwo`"]');
    });

    it('leaves already-backticked labels alone', async () => {
        renderApp({
            dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A["`one<br/>two`"] --> B')),
        });
        const source = await renderedSource();
        expect(source).toContain('["`one\ntwo`"]');
        expect(source).not.toContain('``');
    });

    it('does not add backticks when autoBacktickLabels is off', async () => {
        renderApp({
            dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A["one<br/>two"] --> B')),
            settings: (s) => { s.mermaidDebug.autoBacktickLabels = false; },
        });
        expect(await renderedSource()).toContain('["one\ntwo"]');
    });

    it('overrides the flowchart orientation when configured', async () => {
        renderApp({
            dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A --> B')),
            settings: (s) => { s.mermaid.flowchartOrientation = 'LR'; },
        });
        expect(await renderedSource()).toContain('flowchart LR');
    });

    it('leaves the orientation alone on the "default" setting', async () => {
        renderApp({
            dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A --> B')),
        });
        expect(await renderedSource()).toContain('flowchart TD');
    });
});

describe('Code — mermaid configuration contract', () => {
    it('always disables htmlLabels — DOMPurify strips <foreignObject>', async () => {
        renderApp({ dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A --> B')) });
        const config = await initializedConfig();
        expect(config.htmlLabels).toBe(false);
        expect((config.flowchart as { htmlLabels: boolean }).htmlLabels).toBe(false);
    });

    it('passes the configured security level and edge limit', async () => {
        renderApp({
            dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A --> B')),
            settings: (s) => {
                s.mermaid.securityLevel = 'strict';
                s.mermaid.maxEdges = 42;
            },
        });
        const config = await initializedConfig();
        expect(config.securityLevel).toBe('strict');
        expect(config.maxEdges).toBe(42);
    });

    it('omits the layout key on the "default" setting so frontmatter wins', async () => {
        renderApp({ dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A --> B')) });
        expect(await initializedConfig()).not.toHaveProperty('layout');
    });

    it('sets the layout when elk is selected', async () => {
        renderApp({
            dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A --> B')),
            settings: (s) => { s.mermaid.layout = 'elk'; },
        });
        expect((await initializedConfig()).layout).toBe('elk');
    });

    it('derives the theme from the colour mode when baseTheme is "auto"', async () => {
        renderApp({
            dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A --> B')),
            settings: (s) => { s.view.colorMode = 'dark'; },
        });
        expect((await initializedConfig()).theme).toBe('dark');
    });

    it('omits the theme entirely for baseTheme "none"', async () => {
        renderApp({
            dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A --> B')),
            settings: (s) => { s.mermaidThemeVars.baseTheme = 'none'; },
        });
        expect(await initializedConfig()).not.toHaveProperty('theme');
    });

    it('applies custom theme colours only when they are enabled', async () => {
        renderApp({
            dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A --> B')),
            settings: (s) => {
                s.mermaidThemeVars.enableThemeColors = true;
                s.mermaidThemeVars.primaryColor = { solid: { color: '#ff0000' } };
            },
        });
        expect((await initializedConfig()).themeVariables).toMatchObject({ primaryColor: '#ff0000' });
    });

    it('leaves out theme colours while they are disabled', async () => {
        renderApp({
            dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A --> B')),
            settings: (s) => { s.mermaidThemeVars.primaryColor = { solid: { color: '#ff0000' } }; },
        });
        expect((await initializedConfig()).themeVariables).not.toHaveProperty('primaryColor');
    });

    it('passes the mermaid font settings through', async () => {
        renderApp({
            dataView: singleDataView(mermaidMarkdown('flowchart TD\n  A --> B')),
            settings: (s) => {
                s.font.fontFamily = 'Segoe UI';
                s.font.mermaidFontSize = 16;
            },
        });
        const config = await initializedConfig();
        expect(config.fontFamily).toBe('Segoe UI');
        expect(config.fontSize).toBe(16);
        expect(config.themeVariables).toMatchObject({ fontSize: '16pt' });
    });
});

describe('Code — math and code blocks', () => {
    it('renders display math with KaTeX', async () => {
        const { container } = renderApp({ dataView: singleDataView('$$a^2 + b^2 = c^2$$') });
        await waitFor(() => expect(container.querySelector('.katex')).toBeInTheDocument());
    });

    it('renders inline math with KaTeX', async () => {
        const { container } = renderApp({ dataView: singleDataView('the value $x + y$ matters') });
        await waitFor(() => expect(container.querySelector('.katex')).toBeInTheDocument());
        expect(container.textContent).not.toContain('katex-inline:');
    });

    it('syntax-highlights a dax code block', async () => {
        const { container } = renderApp({
            dataView: singleDataView('```dax\nSales = SUM(Table[Amount])\n```'),
        });
        await waitFor(() => {
            expect(container.querySelector('code.language-dax')).toBeInTheDocument();
        });
        expect(container.querySelectorAll('.token').length).toBeGreaterThan(0);
    });

    it('ignores a style block while custom styles are disabled', async () => {
        const { container } = renderApp({
            dataView: singleDataView('```style\n.markdown-content { color: red; }\n```'),
        });
        await waitFor(() => expect(container.querySelector('.markdown-content')).toBeInTheDocument());
        expect(container.querySelector('style')).toBeNull();
    });

    it('applies a style block once custom styles are allowed', async () => {
        const { container } = renderApp({
            dataView: singleDataView('```style\n.markdown-content { color: red; }\n```'),
            settings: (s) => { s.view.allowCustomStyles = true; },
        });
        await waitFor(() => expect(container.querySelector('style')).toBeInTheDocument());
    });
});
