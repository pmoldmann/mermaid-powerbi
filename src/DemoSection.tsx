import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkDefinitionList from 'remark-definition-list';
import { Code, MermaidSettingsContext, MermaidDebugSettingsContext, ColorModeContext } from './Code';
import { ErrorBoundary } from './Error';
import { useAppSelector } from './redux/hooks';
import { SafeLink } from './SafeLink';
import { preprocessDisplayMath, remarkMark } from './markdownPreprocess';
import 'katex/dist/katex.min.css';
import readmeRaw from '../README.md';

/**
 * Prepare the project README for embedding as live demo content.
 * Images are stripped because the visual runs in a sandbox with no external
 * network access: Markdown badges (shields.io) would be external requests and
 * relative screenshot/logo paths would resolve to broken images. The text,
 * tables and Mermaid diagrams remain — which is exactly the demo material.
 */
const prepareReadmeForDemo = (md: string): string =>
    md
        // remove HTML <img> tags (e.g. embedded logo)
        .replace(/<img\b[^>]*>/gi, '')
        // remove Markdown image syntax (shields.io badges, screenshots)
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        // collapse blank lines left behind by removed images
        .replace(/\n{3,}/g, '\n\n')
        .trim();

// Demo markdown content: the project's own README, rendered live in the visual.
// DEMO_MARKDOWN is the source shown in the raw view / copied to clipboard;
// DEMO_RENDER_SOURCE has the same display-math preprocessing the main render path
// applies, so the embedded README (incl. its LaTeX section) renders identically.
const DEMO_MARKDOWN = prepareReadmeForDemo(readmeRaw);
const DEMO_RENDER_SOURCE = preprocessDisplayMath(DEMO_MARKDOWN);

// Sanitize schema that preserves br/mark tags and allows className/style on spans
// (className for syntax-highlighting tokens, style for KaTeX math positioning)
const sanitizeSchema = {
    ...defaultSchema,
    tagNames: [...(defaultSchema.tagNames || []), 'br', 'mark'],
    ancestors: {
        ...defaultSchema.ancestors,
        br: ['code', 'pre', 'span', 'div', 'p', 'li', 'td', 'th'],
    },
    attributes: {
        ...defaultSchema.attributes,
        span: [...(defaultSchema.attributes?.span || []), 'className', 'class', 'style'],
        code: [...(defaultSchema.attributes?.code || []), 'className', 'class'],
    },
};

// Default Mermaid settings for demo
const defaultMermaidSettings = {
    flowchartOrientation: 'default' as const,
    layout: 'default' as const,
    theme: 'auto' as const,
    look: 'default' as const,
    maxEdges: 30000,
    securityLevel: 'loose' as const,
    elkMergeEdges: 'default' as const,
    elkNodePlacement: 'default' as const,
};

// Default Mermaid debug settings for demo
const defaultMermaidDebugSettings = {
    showDebugPanel: false,
    markdownAutoWrap: true,
    convertBrToNewline: true,
    autoBacktickLabels: true,
    preserveLineBreaksCSS: true,
};

/**
 * Demo section component that shows raw markdown and renders it on button click
 */
export const DemoSection: React.FC = () => {
    const settings = useAppSelector((state) => state.options.settings);
    const colorMode = settings?.view?.colorMode === 'dark' ? 'dark' : 'light';
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
        <>
        <p className="demo-intro">
            📖 The demo below is this visual's own <strong>README</strong>, rendered live inside the visual.
            It documents every feature in detail — and at the same time serves as a hands-on example of how
            Markdown and Mermaid look once rendered here. Switch between <strong>Raw Markdown</strong> and
            <strong> Render</strong> to see the source and the result side by side.
        </p>
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
                        <div className="demo-rendered-content" data-color-mode={colorMode}>
                            <ErrorBoundary>
                                <ColorModeContext.Provider value={colorMode}>
                                    <MermaidSettingsContext.Provider value={defaultMermaidSettings}>
                                        <MermaidDebugSettingsContext.Provider value={defaultMermaidDebugSettings}>
                                        <MDEditor.Markdown
                                            source={DEMO_RENDER_SOURCE}
                                            rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
                                            remarkPlugins={[remarkDefinitionList, remarkMark]}
                                            components={{
                                                code: Code,
                                                a: SafeLink,
                                            }}
                                        />
                                        </MermaidDebugSettingsContext.Provider>
                                    </MermaidSettingsContext.Provider>
                                </ColorModeContext.Provider>
                            </ErrorBoundary>
                        </div>
                    </div>
                )}
            </div>
        </section>
        </>
    );
};
