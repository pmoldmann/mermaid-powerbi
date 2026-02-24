import React from "react";
import { getCodeString } from 'rehype-rewrite';
import mermaid from "mermaid";
import { ErrorBoundary } from "./Error";

// eslint-disable-next-line powerbi-visuals/insecure-random
const randomid = () => parseInt(String(Math.random() * 1e15), 10).toString(36);

/**
 * Code component that handles rendering of code blocks.
 * Supports special handling for Mermaid diagrams and inline styles.
 */
export const Code = (props: any) => {
    const children = props?.children || [];
    const className = props?.className;
    const demoid = React.useRef(`dome${randomid()}`);
    const [container, setContainer] = React.useState<HTMLElement | null>(null);

    const isMermaid =
        className && /^language-mermaid/.test(className.toLocaleLowerCase());

    const isStyling =
        className && /^language-style/.test(className.toLocaleLowerCase());

    const code = children
        ? getCodeString(props.node.children)
        : children[0] || "";

    React.useEffect(() => {
        if (container && isMermaid && demoid.current && code) {
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
    }, [container, isMermaid, code, demoid]);

    const refElement = React.useCallback((node: HTMLElement | null) => {
        if (node !== null) {
            setContainer(node);
        }
    }, []);

    if (isMermaid) {
        return (
            <React.Fragment>
                <ErrorBoundary>
                    <code id={demoid.current} style={{ display: "none" }} />
                    <code className={className + " mermaid"} ref={refElement} data-name="mermaid" />
                </ErrorBoundary>
            </React.Fragment>
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
