import React from 'react';
import { useLocalize } from './useLocalize';

export interface ContextMenuProps {
    /** Whether the context menu is visible */
    visible: boolean;
    /** X position (clientX) */
    x: number;
    /** Y position (clientY) */
    y: number;
    /** Markdown content of the clicked section (null if no section) */
    sectionMarkdown: string | null;
    /** Full markdown content (all sections) */
    fullMarkdown: string;
    /** Rendered HTML of the clicked section (for debugging) */
    sectionHtml?: string | null;
    /** Full rendered HTML of the markdown container (for debugging) */
    fullHtml?: string;
    /** Color mode for theming */
    colorMode: 'light' | 'dark';
    /** Callback when menu should close */
    onClose: () => void;
    /** Callback to show the native Power BI context menu */
    onShowPbiMenu?: () => void;
}

/**
 * Copies text to the clipboard with a fallback for sandboxed iframes.
 */
async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback for sandboxed iframes where navigator.clipboard is unavailable
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            return true;
        } catch {
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

/**
 * Custom context menu component for copying markdown content.
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({
    visible,
    x,
    y,
    sectionMarkdown,
    fullMarkdown,
    sectionHtml,
    fullHtml,
    colorMode,
    onClose,
    onShowPbiMenu,
}) => {
    const menuRef = React.useRef<HTMLDivElement>(null);
    const [copyFeedback, setCopyFeedback] = React.useState<string | null>(null);
    const copiedLabel = useLocalize('UI_Copied', 'Copied!');
    const copySectionLabel = useLocalize('UI_CopySection', 'Copy section markdown');
    const copyAllLabel = useLocalize('UI_CopyAll', 'Copy all markdown');
    const pbiMenuLabel = useLocalize('UI_PbiMenu', 'More options…');

    // Close menu when clicking outside
    React.useEffect(() => {
        if (!visible) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        // Use setTimeout to avoid the same click that opened the menu from closing it
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [visible, onClose]);

    // Close on Escape
    React.useEffect(() => {
        if (!visible) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [visible, onClose]);

    // Adjust position to stay within viewport
    const [adjustedPos, setAdjustedPos] = React.useState({ x, y });
    React.useEffect(() => {
        if (!visible || !menuRef.current) return;
        const rect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let adjX = x;
        let adjY = y;

        if (x + rect.width > viewportWidth) {
            adjX = viewportWidth - rect.width - 4;
        }
        if (y + rect.height > viewportHeight) {
            adjY = viewportHeight - rect.height - 4;
        }

        setAdjustedPos({ x: adjX, y: adjY });
    }, [visible, x, y]);

    if (!visible) return null;

    const handleCopy = async (text: string, label: string) => {
        const success = await copyToClipboard(text);
        if (success) {
            setCopyFeedback(label);
            setTimeout(() => {
                setCopyFeedback(null);
                onClose();
            }, 800);
        } else {
            onClose();
        }
    };

    return (
        <div
            ref={menuRef}
            className={`custom-context-menu${colorMode === 'dark' ? ' custom-context-menu--dark' : ''}`}
            style={{
                left: adjustedPos.x,
                top: adjustedPos.y,
            }}
        >
            {copyFeedback ? (
                <div className="context-menu-feedback">
                    ✓ {copyFeedback}
                </div>
            ) : (
                <>
                    {sectionMarkdown && (
                        <button
                            className="context-menu-item"
                            onClick={() => handleCopy(sectionMarkdown, copiedLabel)}
                        >
                            <span className="context-menu-icon">📋</span>
                            {copySectionLabel}
                        </button>
                    )}
                    <button
                        className="context-menu-item"
                        onClick={() => handleCopy(fullMarkdown, copiedLabel)}
                    >
                        <span className="context-menu-icon">📄</span>
                        {copyAllLabel}
                    </button>
                    {sectionHtml && (
                        <button
                            className="context-menu-item"
                            onClick={() => handleCopy(sectionHtml, copiedLabel)}
                        >
                            <span className="context-menu-icon">🔍</span>
                            Copy section HTML
                        </button>
                    )}
                    {fullHtml && (
                        <button
                            className="context-menu-item"
                            onClick={() => handleCopy(fullHtml, copiedLabel)}
                        >
                            <span className="context-menu-icon">🔎</span>
                            Copy all HTML
                        </button>
                    )}
                    {onShowPbiMenu && (
                        <>
                            <div className="context-menu-separator" />
                            <button
                                className="context-menu-item"
                                onClick={() => {
                                    onClose();
                                    onShowPbiMenu();
                                }}
                            >
                                <span className="context-menu-icon">⋯</span>
                                {pbiMenuLabel}
                            </button>
                        </>
                    )}
                </>
            )}
        </div>
    );
};
