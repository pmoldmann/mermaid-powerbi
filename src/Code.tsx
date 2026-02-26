import React from "react";
import { getCodeString } from 'rehype-rewrite';
import mermaid from "mermaid";
import { ErrorBoundary } from "./Error";
import { debugLog } from "./DebugPanel";

// eslint-disable-next-line powerbi-visuals/insecure-random
const randomid = () => parseInt(String(Math.random() * 1e15), 10).toString(36);

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

/**
 * MermaidDiagram component with zoom and pan functionality.
 */
const MermaidDiagram: React.FC<{ code: string; className: string }> = ({ code, className }) => {
    const demoid = React.useRef(`dome${randomid()}`);
    const [container, setContainer] = React.useState<HTMLElement | null>(null);
    const [zoom, setZoom] = React.useState(1);
    const [isPanning, setIsPanning] = React.useState(false);
    const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });
    const [panOffset, setPanOffset] = React.useState({ x: 0, y: 0 });
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const previousCodeRef = React.useRef<string | null>(null);

    React.useEffect(() => {
        // Skip re-render if code hasn't actually changed
        if (code === previousCodeRef.current) {
            return;
        }
        
        if (container && demoid.current && code) {
            // Mark as rendered only when actually rendering
            previousCodeRef.current = code;
            
            mermaid.initialize({
                securityLevel: "loose",
                maxEdges: 30000,
                htmlLabels: true,        // Global: Enable HTML in labels (needed for <br/>)
                markdownAutoWrap: true,  // Enable markdown line wrapping in backtick labels
                secure: ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize', 'suppressErrorRendering'],
                pie: {
                    useMaxWidth: false,  // Don't stretch pie charts to full width
                },
                flowchart: {
                    useMaxWidth: false,  // Don't stretch flowcharts to full width
                    htmlLabels: true,    // Enable HTML in labels (needed for <br/>)
                },
                sequence: {
                    useMaxWidth: false,  // Don't stretch sequence diagrams to full width
                },
                gantt: {
                    useMaxWidth: false,  // Don't stretch gantt charts to full width
                },
                journey: {
                    useMaxWidth: false,  // Don't stretch journey diagrams to full width
                },
                class: {
                    useMaxWidth: false,  // Don't stretch class diagrams to full width
                },
                state: {
                    useMaxWidth: false,  // Don't stretch state diagrams to full width
                },
                er: {
                    useMaxWidth: false,  // Don't stretch ER diagrams to full width
                },
            });
            
            // Debug: Log what's being passed to mermaid.render
            debugLog('info', 'Code passed to mermaid.render()', code);
            
            mermaid
                .render(demoid.current, code)
                .then(({ svg, bindFunctions }) => {
                    // Debug: Log a snippet of the generated SVG to see how labels are rendered
                    const labelSnippet = svg.substring(0, 2000);
                    debugLog('info', 'SVG output (first 2000 chars)', labelSnippet);
                    
                    // Check if foreignObject is used (indicates HTML rendering)
                    const hasForeignObject = svg.includes('foreignObject');
                    const hasTspan = svg.includes('tspan');
                    debugLog('info', 'SVG rendering mode', `foreignObject: ${hasForeignObject}, tspan: ${hasTspan}`);
                    
                    // Check how "Source" label is rendered (should contain line break)
                    const sourceMatch = svg.match(/Source.{0,200}/);
                    if (sourceMatch) {
                        debugLog('info', 'How "Source" is rendered', sourceMatch[0]);
                    }
                    
                    // eslint-disable-next-line powerbi-visuals/no-inner-outer-html
                    container.innerHTML = svg;
                    
                    // Ensure SVG has max-width constraint for responsiveness
                    const svgElement = container.querySelector('svg');
                    if (svgElement) {
                        svgElement.style.maxWidth = '100%';
                        svgElement.style.height = 'auto';
                    }
                    
                    if (bindFunctions) {
                        bindFunctions(container);
                    }
                })
                .catch((error) => {
                    console.log("Mermaid rendering error:", error);
                    // eslint-disable-next-line powerbi-visuals/no-inner-outer-html
                    container.textContent = code;
                });
        }
    // Note: demoid is a ref (stable), only re-render when container or code changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [container, code]);

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
    const children = props?.children || [];
    const className = props?.className;

    const isMermaid =
        className && /^language-mermaid/.test(className.toLocaleLowerCase());

    const isStyling =
        className && /^language-style/.test(className.toLocaleLowerCase());

    let code = children
        ? getCodeString(props.node.children)
        : children[0] || "";

    // Debug: Log the code before and after decoding
    if (isMermaid) {
        debugLog('code', 'Mermaid code (raw)', code);
        
        // Debug: Check for br tags and show hex codes of first few chars
        const brMatch = code.match(/<br\s*\/?>/gi);
        debugLog('info', 'BR tags found', brMatch ? `Count: ${brMatch.length}, Matches: ${JSON.stringify(brMatch)}` : 'NONE FOUND');
        
        // Show hex codes around potential br tags
        const brIndex = code.indexOf('<br');
        if (brIndex >= 0) {
            const snippet = code.substring(Math.max(0, brIndex - 5), brIndex + 10);
            const hexCodes = snippet.split('').map((c: string) => c.charCodeAt(0).toString(16).padStart(4, '0')).join(' ');
            debugLog('info', 'Hex codes around <br', `Chars: "${snippet}"\nHex: ${hexCodes}`);
        }
    }

    // Decode HTML entities for Mermaid code (e.g., &lt;br/&gt; -> <br/>)
    if (isMermaid && code) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = code;
        code = textarea.value;
        
        // Convert <br/> and <br> tags to actual newlines
        // Mermaid doesn't render <br/> as HTML even with htmlLabels: true,
        // it escapes them as text. Using \n works with both regular and backtick syntax.
        const beforeReplace = code;
        code = code.replace(/<br\s*\/?>/gi, '\n');
        
        const replacedCount = (beforeReplace.match(/<br\s*\/?>/gi) || []).length;
        debugLog('info', 'BR to newline conversion', `Replaced ${replacedCount} <br/> tags`);
        
        // Convert standard node labels with newlines to backtick syntax
        // Mermaid only renders newlines in backtick-wrapped labels: ["`text`"]
        // This regex finds ["..."] labels containing newlines and adds backticks
        const beforeBacktick = code;
        code = code.replace(/\["([^"]*\n[^"]*)"\]/g, (match, content) => {
            // Skip if already has backticks
            if (content.startsWith('`') && content.endsWith('`')) {
                return match;
            }
            return '["`' + content + '`"]';
        });
        
        // Also handle round brackets (...) and curly brackets {...}
        code = code.replace(/\("([^"]*\n[^"]*)"\)/g, (match, content) => {
            if (content.startsWith('`') && content.endsWith('`')) return match;
            return '("`' + content + '`")';
        });
        code = code.replace(/\{"([^"]*\n[^"]*)"\}/g, (match, content) => {
            if (content.startsWith('`') && content.endsWith('`')) return match;
            return '{"`' + content + '`"}';
        });
        
        const backtickConversions = (beforeBacktick !== code);
        debugLog('info', 'Backtick syntax conversion', backtickConversions ? 'Labels converted to backtick syntax' : 'No conversion needed');
        debugLog('code', 'Mermaid code (after processing)', code);
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
