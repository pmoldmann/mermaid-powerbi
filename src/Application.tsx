import React from 'react';

import { useAppSelector } from './redux/hooks';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

import { Code } from './Code';
import { ErrorBoundary } from './Error';
import { WelcomePage } from './WelcomePage';
import { SearchBar, SearchToggle } from './SearchBar';
import { DebugPanel, useDebugLogs, clearDebugLogs, setDebugEnabled } from './DebugPanel';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import "mermaid";

// Custom schema that preserves br tags (needed for Mermaid diagrams with line breaks)
// Also allow br inside code elements
const sanitizeSchema = {
    ...defaultSchema,
    tagNames: [...(defaultSchema.tagNames || []), 'br'],
    ancestors: {
        ...defaultSchema.ancestors,
        br: ['code', 'pre', 'span', 'div', 'p', 'li', 'td', 'th'],
    },
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ApplicationProps {
}

/**
 * Highlights text matches in the DOM
 */
const highlightMatches = (container: HTMLElement, query: string): HTMLElement[] => {
    const highlights: HTMLElement[] = [];
    if (!query.trim()) return highlights;

    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
    );

    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
        if (node.textContent && node.textContent.toLowerCase().includes(query.toLowerCase())) {
            textNodes.push(node as Text);
        }
    }

    textNodes.forEach(textNode => {
        const text = textNode.textContent || '';
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        
        if (parts.length > 1) {
            const fragment = document.createDocumentFragment();
            parts.forEach(part => {
                if (part.toLowerCase() === query.toLowerCase()) {
                    const mark = document.createElement('mark');
                    mark.className = 'search-highlight';
                    mark.textContent = part;
                    highlights.push(mark);
                    fragment.appendChild(mark);
                } else {
                    fragment.appendChild(document.createTextNode(part));
                }
            });
            textNode.parentNode?.replaceChild(fragment, textNode);
        }
    });

    return highlights;
};

/**
 * Removes all search highlights from the DOM
 */
const clearHighlights = (container: HTMLElement) => {
    const marks = container.querySelectorAll('mark.search-highlight');
    marks.forEach(mark => {
        const parent = mark.parentNode;
        if (parent) {
            parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
            parent.normalize();
        }
    });
};

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
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [highlights, setHighlights] = React.useState<HTMLElement[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = React.useState(0);
    const [isDebugOpen, setIsDebugOpen] = React.useState(false);
    const debugLogs = useDebugLogs();

    const showDebugPanel = settings?.view?.showDebugPanel === true;

    // Enable/disable debug logging based on settings
    React.useEffect(() => {
        setDebugEnabled(showDebugPanel);
    }, [showDebugPanel]);

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

    const handleSearch = React.useCallback((query: string) => {
        if (container.current) {
            clearHighlights(container.current);
            const newHighlights = highlightMatches(container.current, query);
            setHighlights(newHighlights);
            setCurrentMatchIndex(newHighlights.length > 0 ? 1 : 0);
            
            // Scroll to first match
            if (newHighlights.length > 0) {
                newHighlights[0].classList.add('search-highlight-current');
                newHighlights[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, []);

    const handleNavigate = React.useCallback((direction: 'prev' | 'next') => {
        if (highlights.length === 0) return;

        // Remove current highlight
        highlights.forEach(h => h.classList.remove('search-highlight-current'));

        let newIndex = currentMatchIndex;
        if (direction === 'next') {
            newIndex = currentMatchIndex >= highlights.length ? 1 : currentMatchIndex + 1;
        } else {
            newIndex = currentMatchIndex <= 1 ? highlights.length : currentMatchIndex - 1;
        }

        setCurrentMatchIndex(newIndex);
        const target = highlights[newIndex - 1];
        target.classList.add('search-highlight-current');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [highlights, currentMatchIndex]);

    const handleCloseSearch = React.useCallback(() => {
        setIsSearchOpen(false);
        if (container.current) {
            clearHighlights(container.current);
        }
        setHighlights([]);
        setCurrentMatchIndex(0);
    }, []);

    // Keyboard shortcut (Ctrl+F)
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const isEmpty = !markdownContent || markdownContent.trim() === '';
    const showWelcome = isEmpty && (settings?.view?.showEmptyMessage !== false);

    return (
        <ErrorBoundary>
            {showWelcome ? (
                <div
                    style={{
                        width: viewport.width,
                        height: viewport.height,
                        overflowY: 'auto'
                    }}
                >
                    <WelcomePage />
                </div>
            ) : (
                <div className="markdown-container" style={{ width: viewport.width, height: viewport.height }}>
                    {/* Debug toggle button */}
                    {showDebugPanel && !isDebugOpen && (
                        <button 
                            className="debug-toggle-btn"
                            onClick={() => { clearDebugLogs(); setIsDebugOpen(true); }}
                            title="Open Debug Panel"
                        >
                            🔧
                        </button>
                    )}

                    {/* Debug panel */}
                    {showDebugPanel && isDebugOpen && (
                        <DebugPanel 
                            logs={debugLogs} 
                            onClose={() => setIsDebugOpen(false)}
                            markdownContent={markdownContent}
                        />
                    )}

                    {/* Search toggle button */}
                    {!isSearchOpen && (
                        <SearchToggle onClick={() => setIsSearchOpen(true)} />
                    )}
                    
                    {/* Search bar */}
                    {isSearchOpen && (
                        <SearchBar
                            onSearch={handleSearch}
                            onNavigate={handleNavigate}
                            onClose={handleCloseSearch}
                            matchCount={highlights.length}
                            currentMatch={currentMatchIndex}
                        />
                    )}

                    <div
                        ref={container}
                        className="markdown-content"
                        data-color-mode="light"
                        onClick={onLinkClick}
                        style={{
                            height: isSearchOpen ? 'calc(100% - 44px)' : '100%',
                            overflowY: 'auto'
                        }}
                    >
                        <MDEditor.Markdown
                            components={{
                                code: Code
                            }}
                            rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
                            source={markdownContent}
                        />
                    </div>
                </div>
            )}
        </ErrorBoundary>
    );
};


