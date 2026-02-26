import React from "react";
import { getCodeString } from 'rehype-rewrite';
import mermaid from "mermaid";
import { ErrorBoundary } from "./Error";
import { debugLog } from "./DebugPanel";
import { MermaidSettings } from "./settings";

// eslint-disable-next-line powerbi-visuals/insecure-random
const randomid = () => parseInt(String(Math.random() * 1e15), 10).toString(36);

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

// Default Mermaid settings
const defaultMermaidSettings: MermaidSettings = {
    htmlLabels: true,
    markdownAutoWrap: true,
    securityLevel: "loose",
    maxEdges: 30000,
    convertBrToNewline: true,
    autoBacktickLabels: true,
    preserveLineBreaksCSS: true
};

// Context for Mermaid settings
export const MermaidSettingsContext = React.createContext<MermaidSettings>(defaultMermaidSettings);

/**
 * MermaidDiagram component with zoom and pan functionality.
 */
const MermaidDiagram: React.FC<{ code: string; className: string }> = ({ code, className }) => {
    const mermaidSettings = React.useContext(MermaidSettingsContext);
    const demoid = React.useRef(`dome${randomid()}`);
    const [container, setContainer] = React.useState<HTMLElement | null>(null);
    const [zoom, setZoom] = React.useState(1);
    const [isPanning, setIsPanning] = React.useState(false);
    const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });
    const [panOffset, setPanOffset] = React.useState({ x: 0, y: 0 });
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const previousCodeRef = React.useRef<string | null>(null);

    // Create a settings key to detect settings changes
    const settingsKey = JSON.stringify(mermaidSettings);
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
                htmlLabels: mermaidSettings.htmlLabels,
                markdownAutoWrap: mermaidSettings.markdownAutoWrap,
                secure: ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize', 'suppressErrorRendering'],
                pie: {
                    useMaxWidth: false,
                },
                flowchart: {
                    useMaxWidth: false,
                    htmlLabels: mermaidSettings.htmlLabels,
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
                        if (mermaidSettings.preserveLineBreaksCSS !== false) {
                            svgElement.classList.add('mermaid-preserve-linebreaks');
                        } else {
                            svgElement.classList.remove('mermaid-preserve-linebreaks');
                        }
                    }
                    
                    if (bindFunctions) {
                        bindFunctions(container);
                    }
                })
                .catch((error) => {
                    debugLog('error', 'Mermaid rendering error', String(error));
                    container.textContent = code;
                });
        }
    }, [container, code, mermaidSettings, settingsKey]);

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
        
        // Convert <br/> tags to newlines (Mermaid escapes <br/> as text)
        if (mermaidSettings.convertBrToNewline !== false) {
            code = code.replace(/<br\s*\/?>/gi, '\n');
        }
        
        // Convert node labels with newlines to backtick syntax
        // Mermaid only renders newlines in backtick-wrapped labels: ["`text`"]
        if (mermaidSettings.autoBacktickLabels !== false) {
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
