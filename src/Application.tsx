import React from 'react';

import { useAppSelector } from './redux/hooks';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from "rehype-sanitize";

import { Code } from './Code';
import { ErrorBoundary } from './Error';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import "mermaid";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ApplicationProps {
}

/**
 * Main application component that renders Markdown content from Power BI data.
 * Supports Mermaid diagrams embedded in markdown code blocks.
 */
export const Application: React.FC<ApplicationProps> = () => {
    const host = useAppSelector((state) => state.options.host);
    const settings = useAppSelector((state) => state.options.settings);
    const viewport = useAppSelector((state) => state.options.viewport);
    const markdownContent = useAppSelector((state) => state.options.markdownContent);

    const container = React.useRef<HTMLDivElement>(null);

    const onLinkClick = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'A') {
            const href = (target as HTMLAnchorElement).getAttribute('href');
            if (href) {
                host?.launchUrl(href);
            }
            e.preventDefault();
            e.stopPropagation();
        }
    }, [host]);

    const isEmpty = !markdownContent || markdownContent.trim() === '';

    return (
        <ErrorBoundary>
            {isEmpty && settings.view.showEmptyMessage ? (
                <div className='tutorial'>
                    <h4>No Markdown Content</h4>
                    <p>Add a column or measure containing Markdown text to the "Markdown Content" field.</p>
                </div>
            ) : (
                <div
                    ref={container}
                    data-color-mode="light"
                    onClick={onLinkClick}
                    style={{
                        width: viewport.width,
                        height: viewport.height,
                        overflowY: 'auto'
                    }}
                >
                    <MDEditor.Markdown
                        components={{
                            code: Code
                        }}
                        rehypePlugins={[[rehypeSanitize]]}
                        source={markdownContent}
                    />
                </div>
            )}
        </ErrorBoundary>
    );
};


