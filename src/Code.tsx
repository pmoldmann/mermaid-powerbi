import React from "react";
import { getCodeString } from 'rehype-rewrite';
import mermaid from "mermaid";
import { ErrorBoundary } from "./Error";

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

    React.useEffect(() => {
        if (container && demoid.current && code) {
            mermaid.initialize({
                securityLevel: "loose",
                maxEdges: 30000,
                secure: ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize', 'suppressErrorRendering'],
            });
            mermaid
                .render(demoid.current, code)
                .then(({ svg, bindFunctions }) => {
                    // eslint-disable-next-line powerbi-visuals/no-inner-outer-html
                    container.innerHTML = svg;
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
    }, [container, code, demoid]);

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
                        display: 'block',
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

    const code = children
        ? getCodeString(props.node.children)
        : children[0] || "";

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
