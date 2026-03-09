import React from 'react';

import { useAppSelector } from './redux/hooks';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

import { Code, MermaidSettingsContext, MermaidDebugSettingsContext, ColorModeContext, FontSettingsContext, MarkdownSettingsContext } from './Code';
import remarkBreaks from 'remark-breaks';
import { ErrorBoundary } from './Error';
import { WelcomePage } from './WelcomePage';
import { SearchBar, SearchToggle } from './SearchBar';
import { DebugPanel, useDebugLogs, clearDebugLogs, setDebugEnabled } from './DebugPanel';
import { ContextMenu } from './ContextMenu';

import powerbiVisualsApi from "powerbi-visuals-api";
import ITooltipService = powerbiVisualsApi.extensibility.ITooltipService;
import VisualTooltipDataItem = powerbiVisualsApi.extensibility.VisualTooltipDataItem;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import "mermaid";

// Register DAX and Power Query (M) as custom languages for syntax highlighting in code blocks
import './dax-language';

// Custom schema that preserves br tags (needed for Mermaid diagrams with line breaks)
// Also allow br inside code elements and className on spans (needed for syntax highlighting tokens)
const sanitizeSchema = {
    ...defaultSchema,
    tagNames: [...(defaultSchema.tagNames || []), 'br'],
    ancestors: {
        ...defaultSchema.ancestors,
        br: ['code', 'pre', 'span', 'div', 'p', 'li', 'td', 'th'],
    },
    attributes: {
        ...defaultSchema.attributes,
        // Allow className on span elements for Prism syntax highlighting tokens
        span: [...(defaultSchema.attributes?.span || []), 'className', 'class'],
        code: [...(defaultSchema.attributes?.code || []), 'className', 'class'],
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
    const markdownSections = useAppSelector((state) => state.options.markdownSections);
    const selectionIds = useAppSelector((state) => state.options.selectionIds);
    const selectionManager = useAppSelector((state) => state.options.selectionManager);
    const tooltipColumns = useAppSelector((state) => state.options.tooltipColumns);

    const container = React.useRef<HTMLDivElement>(null);
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [highlights, setHighlights] = React.useState<HTMLElement[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = React.useState(0);
    const [isDebugOpen, setIsDebugOpen] = React.useState(false);
    const [selectedSectionIndices, setSelectedSectionIndices] = React.useState<Set<number>>(new Set());
    const debugLogs = useDebugLogs();

    // Context menu state
    const [contextMenu, setContextMenu] = React.useState<{
        visible: boolean;
        x: number;
        y: number;
        sectionIdx: number | null;
        selectionId: any;
    }>({ visible: false, x: 0, y: 0, sectionIdx: null, selectionId: null });

    const showDebugPanel = settings?.mermaidDebug?.showDebugPanel === true;

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

    /**
     * Handles right-click to show the custom context menu (if enabled)
     * or falls back to the native Power BI context menu.
     */
    const handleContextMenu = React.useCallback((e: React.MouseEvent) => {
        // Determine which section was right-clicked (if any)
        const sectionEl = (e.target as HTMLElement).closest?.('[data-section-index]');
        let sectionIdx: number | null = null;
        let selId = null;

        if (sectionEl) {
            const secIdx = parseInt(sectionEl.getAttribute('data-section-index')!, 10);
            if (secIdx >= 0 && secIdx < markdownSections.length) {
                sectionIdx = secIdx;
                if (secIdx < selectionIds.length) {
                    selId = selectionIds[secIdx];
                }
            }
        }

        // When the copy menu setting is off, show the native Power BI context menu
        if (!settings?.view?.enableCopyMenu) {
            e.preventDefault();
            if (selectionManager) {
                selectionManager.showContextMenu(
                    selId,
                    { x: e.clientX, y: e.clientY }
                );
            }
            return;
        }

        // Custom context menu
        e.preventDefault();
        e.stopPropagation();

        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            sectionIdx,
            selectionId: selId,
        });
    }, [markdownSections, selectionIds, settings, selectionManager]);

    const handleCloseContextMenu = React.useCallback(() => {
        setContextMenu(prev => ({ ...prev, visible: false }));
    }, []);

    /**
     * Triggers the native Power BI context menu.
     */
    const handleShowPbiMenu = React.useCallback(() => {
        if (!selectionManager) return;
        selectionManager.showContextMenu(
            contextMenu.selectionId,
            { x: contextMenu.x, y: contextMenu.y }
        );
    }, [selectionManager, contextMenu]);

    // Clear selection when data changes
    React.useEffect(() => {
        setSelectedSectionIndices(new Set());
        // Also clear Power BI selection to keep selectionManager in sync
        selectionManager?.clear();
    }, [markdownSections]);

    /**
     * Builds tooltip data items for a given section index.
     */
    const getTooltipDataItems = React.useCallback((sectionIdx: number): VisualTooltipDataItem[] => {
        if (!tooltipColumns || tooltipColumns.length === 0 || sectionIdx < 0) return [];
        const section = markdownSections[sectionIdx];
        if (!section) return [];
        const rowIdx = section.rowIndex;

        return tooltipColumns
            .filter(col => col.values[rowIdx] != null)
            .map(col => ({
                displayName: col.displayName,
                value: String(col.values[rowIdx])
            }));
    }, [tooltipColumns, markdownSections]);

    /**
     * Handles tooltip show on section mouse enter/move.
     */
    const handleSectionMouseOver = React.useCallback((sectionIdx: number, event: React.MouseEvent) => {
        if (!host?.tooltipService) return;
        const dataItems = getTooltipDataItems(sectionIdx);
        if (dataItems.length === 0) return;

        const identities = sectionIdx < selectionIds.length ? [selectionIds[sectionIdx]] : [];

        host.tooltipService.show({
            coordinates: [event.clientX, event.clientY],
            dataItems,
            isTouchEvent: false,
            identities
        });
    }, [host, getTooltipDataItems, selectionIds]);

    /**
     * Handles tooltip move when mouse moves within a section.
     */
    const handleSectionMouseMove = React.useCallback((sectionIdx: number, event: React.MouseEvent) => {
        if (!host?.tooltipService) return;
        const dataItems = getTooltipDataItems(sectionIdx);
        if (dataItems.length === 0) return;

        const identities = sectionIdx < selectionIds.length ? [selectionIds[sectionIdx]] : [];

        host.tooltipService.move({
            coordinates: [event.clientX, event.clientY],
            dataItems,
            isTouchEvent: false,
            identities
        });
    }, [host, getTooltipDataItems, selectionIds]);

    /**
     * Handles tooltip hide on section mouse leave.
     */
    const handleSectionMouseLeave = React.useCallback(() => {
        if (!host?.tooltipService) return;
        host.tooltipService.hide({
            immediately: true,
            isTouchEvent: false
        });
    }, [host]);

    /**
     * Handles cross-filter click on a section.
     */
    const handleSectionClick = React.useCallback((sectionIdx: number, event: React.MouseEvent) => {
        // Check if cross-filtering is enabled
        if (!settings?.interactivity?.enableCrossFilter) return;
        // Don't cross-filter if there are no selectionIds (measure mode)
        if (!selectionIds || selectionIds.length === 0 || !selectionManager) return;
        // Don't cross-filter if host doesn't allow interactions
        if (host && (host as any).allowInteractions === false) return;

        // Don't cross-filter if user clicked a link
        const target = event.target as HTMLElement;
        if (target.tagName === 'A' || target.closest('a')) return;

        const selectionId = selectionIds[sectionIdx];
        if (!selectionId) return;

        const isMultiSelect = event.ctrlKey || event.metaKey;

        // If clicking an already-selected section (single selection), toggle off
        if (!isMultiSelect && selectedSectionIndices.has(sectionIdx) && selectedSectionIndices.size === 1) {
            selectionManager.clear();
            setSelectedSectionIndices(new Set());
            return;
        }

        // Helper to perform the selection and update local state
        const performSelect = () => {
            selectionManager.select(selectionId, isMultiSelect).then((ids) => {
                if (ids.length === 0) {
                    setSelectedSectionIndices(new Set());
                } else {
                    const next = new Set(isMultiSelect ? Array.from(selectedSectionIndices) : []);
                    next.add(sectionIdx);
                    setSelectedSectionIndices(next);
                }
            });
        };

        // For single-select with an active selection: clear first to avoid
        // Power BI toggling off when rows share the same data identity
        // (duplicate content produces equivalent selectionIds).
        if (!isMultiSelect && selectedSectionIndices.size > 0) {
            selectionManager.clear().then(performSelect);
        } else {
            performSelect();
        }
    }, [settings, selectionIds, selectionManager, host, selectedSectionIndices]);

    const crossFilterEnabled = settings?.interactivity?.enableCrossFilter && selectionIds.length > 0;
    const hasSelection = selectedSectionIndices.size > 0;

    const isEmpty = !markdownContent || markdownContent.trim() === '';

    return (
        <ErrorBoundary>
            {isEmpty ? (
                <div
                    data-color-mode={settings?.view?.colorMode === 'dark' ? 'dark' : 'light'}
                    style={{
                        width: viewport.width,
                        height: viewport.height,
                        overflowY: 'auto'
                    }}
                >
                    <WelcomePage />
                </div>
            ) : (
                <div className="markdown-container" style={{ width: viewport.width, height: viewport.height }} onContextMenu={handleContextMenu}>
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

                    {/* Custom context menu */}
                    <ContextMenu
                        visible={contextMenu.visible}
                        x={contextMenu.x}
                        y={contextMenu.y}
                        sectionMarkdown={
                            contextMenu.sectionIdx !== null && contextMenu.sectionIdx < markdownSections.length
                                ? markdownSections[contextMenu.sectionIdx].content
                                : null
                        }
                        fullMarkdown={markdownContent}
                        colorMode={settings?.view?.colorMode === 'dark' ? 'dark' : 'light'}
                        onClose={handleCloseContextMenu}
                        onShowPbiMenu={handleShowPbiMenu}
                    />

                    <div
                        ref={container}
                        className={`markdown-content${settings?.markdown?.codeBlockWordWrap !== false ? ' code-word-wrap' : ''}${crossFilterEnabled ? ' cross-filter-enabled' : ''}`}
                        data-color-mode={settings?.view?.colorMode === 'dark' ? 'dark' : 'light'}
                        onClick={onLinkClick}
                        style={{
                            height: isSearchOpen ? 'calc(100% - 44px)' : '100%',
                            overflowY: 'auto',
                            '--md-font-family': settings?.font?.fontFamily || 'DIN',
                            '--md-heading-base-size': `${settings?.font?.headingFontSize || 14}pt`,
                            '--md-body-font-size': `${settings?.font?.bodyFontSize || 9}pt`,
                            fontFamily: `"${settings?.font?.fontFamily || 'DIN'}", sans-serif`,
                        } as React.CSSProperties}
                    >
                        <ColorModeContext.Provider value={settings?.view?.colorMode === 'dark' ? 'dark' : 'light'}>
                            <FontSettingsContext.Provider value={settings?.font || {
                                fontFamily: 'DIN',
                                headingFontSize: 14,
                                bodyFontSize: 9,
                                mermaidFontSize: 14
                            }}>
                                <MermaidSettingsContext.Provider value={settings?.mermaid || {
                                    flowchartOrientation: "default",
                                    maxEdges: 30000,
                                    securityLevel: "loose",
                                }}>
                                    <MermaidDebugSettingsContext.Provider value={settings?.mermaidDebug || {
                                        showDebugPanel: false,
                                        htmlLabels: true,
                                        markdownAutoWrap: true,
                                        convertBrToNewline: true,
                                        autoBacktickLabels: true,
                                        preserveLineBreaksCSS: true
                                    }}>
                                    <MarkdownSettingsContext.Provider value={settings?.markdown || {
                                        enableLineBreaks: true,
                                        codeBlockWordWrap: true
                                    }}>
                                        {markdownSections.length > 1 ? (
                                            /* Multi-section: render each row as separate markdown block */
                                            markdownSections.map((section, sectionIdx) => {
                                                const isDimmed = hasSelection && !selectedSectionIndices.has(sectionIdx);
                                                const isSelected = selectedSectionIndices.has(sectionIdx);
                                                return (
                                                    <React.Fragment key={`section-${sectionIdx}`}>
                                                        <div
                                                            className={`markdown-section${isDimmed ? ' section-dimmed' : ''}${isSelected ? ' section-selected' : ''}`}
                                                            data-section-index={sectionIdx}
                                                            data-row-index={section.rowIndex}
                                                            onMouseEnter={(e) => handleSectionMouseOver(sectionIdx, e)}
                                                            onMouseMove={(e) => handleSectionMouseMove(sectionIdx, e)}
                                                            onMouseLeave={handleSectionMouseLeave}
                                                            onClick={(e) => handleSectionClick(sectionIdx, e)}
                                                        >
                                                            <MDEditor.Markdown
                                                                components={{ code: Code }}
                                                                rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
                                                                remarkPlugins={settings?.markdown?.enableLineBreaks !== false ? [remarkBreaks] : []}
                                                                source={section.content}
                                                            />
                                                        </div>
                                                        {sectionIdx < markdownSections.length - 1 && <hr className="section-separator" />}
                                                    </React.Fragment>
                                                );
                                            })
                                        ) : (
                                            /* Single section (measure or single row) — render as before */
                                            <MDEditor.Markdown
                                                components={{ code: Code }}
                                                rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
                                                remarkPlugins={settings?.markdown?.enableLineBreaks !== false ? [remarkBreaks] : []}
                                                source={markdownContent}
                                            />
                                        )}
                                    </MarkdownSettingsContext.Provider>
                                    </MermaidDebugSettingsContext.Provider>
                                </MermaidSettingsContext.Provider>
                            </FontSettingsContext.Provider>
                        </ColorModeContext.Provider>
                    </div>
                </div>
            )}
        </ErrorBoundary>
    );
};


