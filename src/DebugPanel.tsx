import React from 'react';

export interface DebugLog {
    timestamp: string;
    type: 'info' | 'code' | 'error';
    label: string;
    content: string;
}

interface DebugPanelProps {
    logs: DebugLog[];
    onClose: () => void;
    markdownContent: string;
}

/**
 * Copy text to clipboard
 */
const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
};

/**
 * Debug panel that displays Mermaid code processing information.
 * Useful for debugging when browser DevTools are not available.
 */
export const DebugPanel: React.FC<DebugPanelProps> = ({ logs, onClose, markdownContent }) => {
    const [activeTab, setActiveTab] = React.useState<'logs' | 'raw'>('logs');

    const handleClearLogs = () => {
        clearDebugLogs();
    };

    return (
        <div className="debug-panel">
            <div className="debug-panel-header">
                <span className="debug-panel-title">🔧 Debug Panel</span>
                <div className="debug-panel-tabs">
                    <button 
                        className={activeTab === 'logs' ? 'active' : ''} 
                        onClick={() => setActiveTab('logs')}
                    >
                        Logs ({logs.length})
                    </button>
                    <button 
                        className={activeTab === 'raw' ? 'active' : ''} 
                        onClick={() => setActiveTab('raw')}
                    >
                        Raw Markdown
                    </button>
                    <button 
                        className="debug-clear-btn"
                        onClick={handleClearLogs}
                        title="Clear all logs"
                    >
                        🗑️ Clear
                    </button>
                </div>
                <button className="debug-panel-close" onClick={onClose}>✕</button>
            </div>
            <div className="debug-panel-content">
                {activeTab === 'logs' && (
                    <div className="debug-logs">
                        {logs.length === 0 ? (
                            <p className="debug-empty">No debug logs yet. Render a Mermaid diagram to see logs.</p>
                        ) : (
                            logs.map((log, index) => (
                                <div key={index} className={`debug-log debug-log-${log.type}`}>
                                    <div className="debug-log-header">
                                        <span className="debug-log-time">{log.timestamp}</span>
                                        <span className="debug-log-label">{log.label}</span>
                                        <button 
                                            className="debug-copy-btn"
                                            onClick={() => copyToClipboard(log.content)}
                                            title="Copy to clipboard"
                                        >
                                            📋
                                        </button>
                                    </div>
                                    <pre className="debug-log-content">{log.content}</pre>
                                </div>
                            ))
                        )}
                    </div>
                )}
                {activeTab === 'raw' && (
                    <div className="debug-raw">
                        <button 
                            className="debug-copy-btn debug-copy-all"
                            onClick={() => copyToClipboard(markdownContent || '')}
                        >
                            📋 Copy All
                        </button>
                        <pre>{markdownContent || '(No markdown content)'}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

// Global debug log storage (singleton pattern for cross-component access)
let globalDebugLogs: DebugLog[] = [];
let globalDebugListeners: Array<(logs: DebugLog[]) => void> = [];
let isDebugEnabled = false;
const recentLogKeys: Set<string> = new Set();
let clearRecentTimeout: ReturnType<typeof setTimeout> | null = null;

export const setDebugEnabled = (enabled: boolean) => {
    isDebugEnabled = enabled;
    if (enabled) {
        // Clear logs when enabling debug
        globalDebugLogs = [];
        recentLogKeys.clear();
    }
};

export const debugLog = (type: DebugLog['type'], label: string, content: string) => {
    // Only log when debug is enabled to prevent performance issues
    if (!isDebugEnabled) return;
    
    // Deduplicate: skip if same content was logged recently (within 2 seconds)
    const contentKey = `${label}:${content}`;
    if (recentLogKeys.has(contentKey)) return;
    
    // Add to recent keys and auto-clear after 2 seconds
    recentLogKeys.add(contentKey);
    if (clearRecentTimeout) clearTimeout(clearRecentTimeout);
    clearRecentTimeout = setTimeout(() => {
        recentLogKeys.clear();
    }, 2000);
    
    const log: DebugLog = {
        timestamp: new Date().toLocaleTimeString(),
        type,
        label,
        content: content.length > 5000 ? content.substring(0, 5000) + '\n... (truncated)' : content
    };
    globalDebugLogs = [...globalDebugLogs, log].slice(-100); // Keep last 100 logs
    // Use setTimeout to avoid state updates during render
    setTimeout(() => {
        globalDebugListeners.forEach(listener => listener([...globalDebugLogs]));
    }, 0);
};

export const clearDebugLogs = () => {
    globalDebugLogs = [];
    setTimeout(() => {
        globalDebugListeners.forEach(listener => listener([]));
    }, 0);
};

export const useDebugLogs = (): DebugLog[] => {
    const [logs, setLogs] = React.useState<DebugLog[]>(globalDebugLogs);

    React.useEffect(() => {
        const listener = (newLogs: DebugLog[]) => setLogs(newLogs);
        globalDebugListeners.push(listener);
        return () => {
            globalDebugListeners = globalDebugListeners.filter(l => l !== listener);
        };
    }, []);

    return logs;
};
