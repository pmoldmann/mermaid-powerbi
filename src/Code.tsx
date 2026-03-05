import React from "react";
import { getCodeString } from 'rehype-rewrite';
import mermaid from "mermaid";
import { ErrorBoundary } from "./Error";
import { debugLog } from "./DebugPanel";
import { MermaidSettings, MermaidDebugSettings, FontSettings, MarkdownSettings } from "./settings";
import { useAppSelector } from './redux/hooks';

// eslint-disable-next-line powerbi-visuals/insecure-random
const randomid = () => parseInt(String(Math.random() * 1e15), 10).toString(36);

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

// Default Mermaid settings
const defaultMermaidSettings: MermaidSettings = {
    flowchartOrientation: "default",
    maxEdges: 30000,
    securityLevel: "loose",
};

// Default Mermaid debug settings
const defaultMermaidDebugSettings: MermaidDebugSettings = {
    htmlLabels: true,
    markdownAutoWrap: true,
    convertBrToNewline: true,
    autoBacktickLabels: true,
    preserveLineBreaksCSS: true
};

// Default Font settings
const defaultFontSettings: FontSettings = {
    fontFamily: "DIN",
    headingFontSize: 14,
    bodyFontSize: 9,
    mermaidFontSize: 14
};

// Default Markdown settings
const defaultMarkdownSettings: MarkdownSettings = {
    enableLineBreaks: true,
    codeBlockWordWrap: true
};

// Context for color mode (light/dark)
export const ColorModeContext = React.createContext<string>('light');

// Context for Mermaid settings
export const MermaidSettingsContext = React.createContext<MermaidSettings>(defaultMermaidSettings);

// Context for Mermaid debug settings
export const MermaidDebugSettingsContext = React.createContext<MermaidDebugSettings>(defaultMermaidDebugSettings);

// Context for Font settings
export const FontSettingsContext = React.createContext<FontSettings>(defaultFontSettings);

// Context for Markdown settings
export const MarkdownSettingsContext = React.createContext<MarkdownSettings>(defaultMarkdownSettings);

// ============================================
// Tooltip Management for Mermaid Diagrams
// ============================================

let tooltipDiv: HTMLDivElement | null = null;

function getOrCreateTooltipDiv(): HTMLDivElement {
    if (!tooltipDiv || !document.body.contains(tooltipDiv)) {
        tooltipDiv = document.createElement('div');
        tooltipDiv.className = 'mermaid-custom-tooltip';
        document.body.appendChild(tooltipDiv);
    }
    return tooltipDiv;
}

function showMermaidTooltip(text: string, event: MouseEvent): void {
    const div = getOrCreateTooltipDiv();
    div.textContent = text;
    div.style.display = 'block';
    positionMermaidTooltip(event);
}

function hideMermaidTooltip(): void {
    if (tooltipDiv) {
        tooltipDiv.style.display = 'none';
    }
}

function positionMermaidTooltip(event: MouseEvent): void {
    if (tooltipDiv) {
        const offset = 12;
        const x = event.pageX + offset;
        const y = event.pageY + offset;

        // Keep tooltip within viewport
        const rect = tooltipDiv.getBoundingClientRect();
        const maxX = window.innerWidth - (rect.width || 200) - 10;
        const maxY = window.innerHeight - (rect.height || 30) - 10;

        tooltipDiv.style.left = `${Math.min(x, Math.max(0, maxX))}px`;
        tooltipDiv.style.top = `${Math.min(y, Math.max(0, maxY))}px`;
    }
}

// ============================================
// Mermaid Click Directive Parser
// ============================================

interface MermaidClickDirective {
    nodeId: string;
    url: string | null;
    tooltip: string | null;
}

/**
 * Parses Mermaid click directives from the diagram code.
 * Supports: click nodeId "URL" "tooltip", click nodeId href "URL" "tooltip",
 *           click nodeId callback "tooltip", click nodeId "URL" _blank
 */
function parseMermaidClickDirectives(code: string): MermaidClickDirective[] {
    const directives: MermaidClickDirective[] = [];
    const lines = code.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.toLowerCase().startsWith('click ')) continue;

        const afterClick = trimmed.substring(6).trim();
        const spaceIdx = afterClick.indexOf(' ');
        if (spaceIdx === -1) continue;

        const nodeId = afterClick.substring(0, spaceIdx);
        let rest = afterClick.substring(spaceIdx + 1).trim();

        // Detect and remove 'callback' keyword — if present, all quoted strings are tooltips (no URL)
        const isCallback = /^callback(\s|$)/i.test(rest);
        if (isCallback) {
            rest = rest.replace(/^callback\s*/i, '');
        }

        // Detect and remove 'href' keyword — if present, first quoted string is always a URL
        const isHref = /^href(\s|$)/i.test(rest);
        if (isHref) {
            rest = rest.replace(/^href\s*/i, '');
        }

        // Remove target keywords at the end
        rest = rest.replace(/\s+_(blank|self|parent|top)\s*$/i, '');

        // Extract all quoted strings
        const quotedStrings: string[] = [];
        const quoteRegex = /"([^"]*)"/g;
        let quoteMatch;
        while ((quoteMatch = quoteRegex.exec(rest)) !== null) {
            quotedStrings.push(quoteMatch[1]);
        }

        let url: string | null = null;
        let tooltip: string | null = null;

        if (isCallback) {
            // callback directive: all quoted strings are tooltips, never URLs
            tooltip = quotedStrings.length > 0 ? quotedStrings[quotedStrings.length - 1] : null;
        } else if (isHref) {
            // href directive: first = URL, second = tooltip
            url = quotedStrings.length >= 1 ? quotedStrings[0] : null;
            tooltip = quotedStrings.length >= 2 ? quotedStrings[1] : null;
        } else if (quotedStrings.length >= 2) {
            // Two quoted strings without keyword: first = URL, second = tooltip
            url = quotedStrings[0];
            tooltip = quotedStrings[1];
        } else if (quotedStrings.length === 1) {
            // Single quoted string: use stricter URL detection (only real URLs, not arbitrary text with dots)
            const val = quotedStrings[0];
            if (/^https?:\/\//i.test(val) || /^(ftp|mailto):/i.test(val)) {
                url = val;
            } else {
                tooltip = val;
            }
        }

        directives.push({ nodeId, url, tooltip });
    }

    return directives;
}

/**
 * Finds a Mermaid diagram node element in the SVG by its node ID.
 */
function findMermaidNode(container: HTMLElement, nodeId: string): Element | null {
    // Try multiple selector patterns used by different Mermaid diagram types
    const selectors = [
        `[id*="flowchart-${nodeId}-"]`,
        `[id*="-${nodeId}-"]`,
        `[id="${nodeId}"]`,
    ];

    for (const selector of selectors) {
        try {
            const el = container.querySelector(selector);
            if (el) {
                // Return the .node group if it exists, otherwise the element itself
                return el.closest('.node') || el;
            }
        } catch {
            continue;
        }
    }

    return null;
}

/**
 * Opens an external link via Power BI host (with confirmation dialog) or fallback browser dialog.
 * Power BI's host.launchUrl() shows a native confirmation dialog before opening in an external browser.
 */
function openExternalLink(url: string, host: unknown): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pbiHost = host as any;
    if (pbiHost && typeof pbiHost.launchUrl === 'function') {
        // Power BI host.launchUrl() shows a native confirmation dialog
        pbiHost.launchUrl(url);
    } else {
        // Fallback for development/testing
        // eslint-disable-next-line no-restricted-globals
        if (confirm(`Do you want to open this external link in your browser?\n\n${url}`)) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    }
}

/**
 * Processes tooltips and link interception for a rendered Mermaid SVG.
 * - Adds JavaScript-based tooltips for click directive tooltips
 * - Intercepts <a> links to open via host.launchUrl() (with confirmation dialog)
 * - Removes direct navigation handlers from Mermaid
 * - We intentionally do NOT call Mermaid's bindFunctions() to prevent
 *   uncontrolled navigation that traps the user inside the visual.
 */
function processMermaidInteractivity(container: HTMLElement, code: string, host: unknown): void {
    // 1. Parse click directives from the Mermaid code
    const clickDirectives = parseMermaidClickDirectives(code);

    // 2. Apply tooltips and click handlers from click directives
    for (const { nodeId, url, tooltip } of clickDirectives) {
        const nodeEl = findMermaidNode(container, nodeId);
        if (!nodeEl) {
            debugLog('info', 'Mermaid click directive: node not found', `nodeId=${nodeId}`);
            continue;
        }

        // Add tooltip on hover
        if (tooltip) {
            nodeEl.addEventListener('mouseenter', (e: Event) => {
                showMermaidTooltip(tooltip, e as MouseEvent);
            });
            nodeEl.addEventListener('mouseleave', () => {
                hideMermaidTooltip();
            });
            nodeEl.addEventListener('mousemove', (e: Event) => {
                positionMermaidTooltip(e as MouseEvent);
            });
            (nodeEl as HTMLElement).style.cursor = url ? 'pointer' : 'help';
        }

        // Add click handler for URL (opens in external browser with confirmation)
        if (url) {
            (nodeEl as HTMLElement).style.cursor = 'pointer';
            nodeEl.addEventListener('click', (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                openExternalLink(url, host);
            });
        }
    }

    // 3. Intercept <a> elements in the SVG (Mermaid may create these for links)
    const links = container.querySelectorAll('a[href], a[xlink\\:href]');
    links.forEach((link) => {
        const href = link.getAttribute('href') || link.getAttribute('xlink:href');
        if (href && href !== '#' && !href.startsWith('javascript:')) {
            link.removeAttribute('href');
            link.removeAttribute('xlink:href');
            (link as HTMLElement).style.cursor = 'pointer';

            link.addEventListener('click', (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                openExternalLink(href, host);
            });
        }
    });

    // 4. Remove any inline onclick attributes (from Mermaid's loose security mode)
    const onclickEls = container.querySelectorAll('[onclick]');
    onclickEls.forEach((el) => {
        el.removeAttribute('onclick');
    });

    debugLog('info', 'Mermaid interactivity processed',
        `${clickDirectives.length} click directive(s), ${links.length} link(s) intercepted`);
}

/**
 * MermaidDiagram component with zoom and pan functionality.
 */
const MermaidDiagram: React.FC<{ code: string; className: string }> = ({ code, className }) => {
    const mermaidSettings = React.useContext(MermaidSettingsContext);
    const mermaidDebugSettings = React.useContext(MermaidDebugSettingsContext);
    const fontSettings = React.useContext(FontSettingsContext);
    const colorMode = React.useContext(ColorModeContext);
    const host = useAppSelector((state) => state.options.host);
    const demoid = React.useRef(`dome${randomid()}`);
    const [container, setContainer] = React.useState<HTMLElement | null>(null);
    const [zoom, setZoom] = React.useState(1);
    const [isPanning, setIsPanning] = React.useState(false);
    const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });
    const [panOffset, setPanOffset] = React.useState({ x: 0, y: 0 });
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const previousCodeRef = React.useRef<string | null>(null);

    // Create a settings key to detect settings changes
    const settingsKey = JSON.stringify(mermaidSettings) + JSON.stringify(mermaidDebugSettings) + JSON.stringify(fontSettings) + colorMode;
    const previousSettingsRef = React.useRef<string | null>(null);

    React.useEffect(() => {
        // Skip re-render if neither code nor settings have changed
        const settingsChanged = settingsKey !== previousSettingsRef.current;
        const codeChanged = code !== previousCodeRef.current;
        
        if (!settingsChanged && !codeChanged) {
            return;
        }
        
        if (container && demoid.current && code) {
            // Mark as rendered
            previousCodeRef.current = code;
            previousSettingsRef.current = settingsKey;
            
            mermaid.initialize({
                securityLevel: mermaidSettings.securityLevel as "loose" | "strict" | "sandbox",
                maxEdges: mermaidSettings.maxEdges,
                htmlLabels: mermaidDebugSettings.htmlLabels,
                markdownAutoWrap: mermaidDebugSettings.markdownAutoWrap,
                theme: colorMode === 'dark' ? 'dark' : 'default',
                fontFamily: fontSettings.fontFamily || 'DIN',
                fontSize: fontSettings.mermaidFontSize || 14,
                secure: ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize', 'suppressErrorRendering'],
                pie: {
                    useMaxWidth: false,
                },
                flowchart: {
                    useMaxWidth: false,
                    htmlLabels: mermaidDebugSettings.htmlLabels,
                },
                sequence: {
                    useMaxWidth: false,
                },
                gantt: {
                    useMaxWidth: false,
                },
                journey: {
                    useMaxWidth: false,
                },
                class: {
                    useMaxWidth: false,
                },
                state: {
                    useMaxWidth: false,
                },
                er: {
                    useMaxWidth: false,
                },
            });
            
            mermaid
                .render(demoid.current, code)
                .then(({ svg, bindFunctions }) => {
                    // eslint-disable-next-line powerbi-visuals/no-inner-outer-html
                    container.innerHTML = svg;
                    
                    // Ensure SVG has max-width constraint for responsiveness
                    const svgElement = container.querySelector('svg');
                    if (svgElement) {
                        svgElement.style.maxWidth = '100%';
                        svgElement.style.height = 'auto';
                        
                        // Add class for CSS line break preservation if enabled
                        if (mermaidDebugSettings.preserveLineBreaksCSS !== false) {
                            svgElement.classList.add('mermaid-preserve-linebreaks');
                        } else {
                            svgElement.classList.remove('mermaid-preserve-linebreaks');
                        }
                    }
                    
                    // Process tooltips and link interception instead of calling
                    // bindFunctions() directly. This prevents Mermaid from setting up
                    // direct navigation handlers that trap the user inside the visual.
                    // Links are instead routed through host.launchUrl() which shows a
                    // confirmation dialog before opening in an external browser.
                    processMermaidInteractivity(container, code, host);
                })
                .catch((error) => {
                    debugLog('error', 'Mermaid rendering error', String(error));
                    container.textContent = code;
                });
        }
    }, [container, code, mermaidSettings, mermaidDebugSettings, fontSettings, settingsKey, colorMode]);

    const refElement = React.useCallback((node: HTMLElement | null) => {
        if (node !== null) {
            setContainer(node);
        }
    }, []);

    const handleZoomIn = React.useCallback(() => {
        setZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM));
    }, []);

    const handleZoomOut = React.useCallback(() => {
        setZoom(z => Math.max(z - ZOOM_STEP, MIN_ZOOM));
    }, []);

    const handleZoomReset = React.useCallback(() => {
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
    }, []);

    const handleWheel = React.useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
            setZoom(z => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
        }
    }, []);

    const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
        if (e.button === 0 && zoom > 1) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
            e.preventDefault();
        }
    }, [zoom, panOffset]);

    const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
        if (isPanning) {
            setPanOffset({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
        }
    }, [isPanning, panStart]);

    const handleMouseUp = React.useCallback(() => {
        setIsPanning(false);
    }, []);

    const handleMouseLeave = React.useCallback(() => {
        setIsPanning(false);
    }, []);

    return (
        <div className="mermaid-zoom-wrapper" ref={wrapperRef}>
            <div className="mermaid-zoom-controls">
                <button onClick={handleZoomOut} title="Zoom Out" disabled={zoom <= MIN_ZOOM}>−</button>
                <span className="mermaid-zoom-level">{Math.round(zoom * 100)}%</span>
                <button onClick={handleZoomIn} title="Zoom In" disabled={zoom >= MAX_ZOOM}>+</button>
                <button onClick={handleZoomReset} title="Reset Zoom">⟲</button>
            </div>
            <div
                className="mermaid-zoom-container"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
            >
                <code id={demoid.current} style={{ display: "none" }} />
                <code
                    className={className + " mermaid"}
                    ref={refElement}
                    data-name="mermaid"
                    style={{
                        display: 'inline-block',
                        transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                        transformOrigin: 'top left',
                    }}
                />
            </div>
        </div>
    );
};

/**
 * Code component that handles rendering of code blocks.
 * Supports special handling for Mermaid diagrams and inline styles.
 */
export const Code = (props: any) => {
    // Get settings from context (must be at top level)
    const mermaidSettings = React.useContext(MermaidSettingsContext);
    const mermaidDebugSettings = React.useContext(MermaidDebugSettingsContext);
    
    const children = props?.children || [];
    const className = props?.className;

    const isMermaid =
        className && /^language-mermaid/.test(className.toLocaleLowerCase());

    const isStyling =
        className && /^language-style/.test(className.toLocaleLowerCase());

    let code = children
        ? getCodeString(props.node.children)
        : children[0] || "";

    // Process Mermaid code
    if (isMermaid && code) {
        // Log raw code for debugging
        debugLog('code', 'Mermaid code (raw)', code);
        
        // Decode HTML entities (e.g., &lt;br/&gt; -> <br/>)
        // Using textarea to safely decode HTML entities - no user input is executed
        const textarea = document.createElement('textarea');
        // eslint-disable-next-line powerbi-visuals/no-inner-outer-html
        textarea.innerHTML = code;
        code = textarea.value;
        
        // Apply flowchart orientation override
        if (mermaidSettings.flowchartOrientation && mermaidSettings.flowchartOrientation !== 'default') {
            // Replace orientation in flowchart/graph declarations
            // Matches: flowchart TB, flowchart LR, graph TD, etc.
            code = code.replace(
                /^(\s*(?:flowchart|graph)\s+)(TB|TD|BT|LR|RL)/im,
                `$1${mermaidSettings.flowchartOrientation}`
            );
            // Also handle flowchart without explicit orientation (defaults to TB)
            code = code.replace(
                /^(\s*(?:flowchart|graph))\s*$/im,
                `$1 ${mermaidSettings.flowchartOrientation}`
            );
        }
        
        // Convert <br/> tags to newlines (Mermaid escapes <br/> as text)
        if (mermaidDebugSettings.convertBrToNewline !== false) {
            code = code.replace(/<br\s*\/?>/gi, '\n');
        }
        
        // Convert node labels with newlines to backtick syntax
        // Mermaid only renders newlines in backtick-wrapped labels: ["`text`"]
        if (mermaidDebugSettings.autoBacktickLabels !== false) {
            code = code.replace(/\["([^"]*\n[^"]*)"\]/g, (match, content) => {
                if (content.startsWith('`') && content.endsWith('`')) return match;
                return '["`' + content + '`"]';
            });
            code = code.replace(/\("([^"]*\n[^"]*)"\)/g, (match, content) => {
                if (content.startsWith('`') && content.endsWith('`')) return match;
                return '("`' + content + '`")';
            });
            code = code.replace(/\{"([^"]*\n[^"]*)"\}/g, (match, content) => {
                if (content.startsWith('`') && content.endsWith('`')) return match;
                return '{"`' + content + '`"}';
            });
        }
        
        // Log processed code for debugging
        debugLog('code', 'Mermaid code (processed)', code);
    }

    if (isMermaid) {
        return (
            <ErrorBoundary>
                <MermaidDiagram code={code} className={className} />
            </ErrorBoundary>
        );
    }

    if (isStyling) {
        if (code.trim() === "") {
            return null;
        }
        return (
            <ErrorBoundary>
                <React.Fragment>
                    <style
                        dangerouslySetInnerHTML={{ __html: code }}
                        className={className + " style"}
                        data-name="style"
                    />
                </React.Fragment>
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <code className={className}>{children}</code>
        </ErrorBoundary>
    );
};
