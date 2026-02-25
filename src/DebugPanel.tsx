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
let lastLogContent: string | null = null;

export const setDebugEnabled = (enabled: boolean) => {
    isDebugEnabled = enabled;
    if (enabled) {
        // Clear logs when enabling debug
        globalDebugLogs = [];
        lastLogContent = null;
    }
};

export const debugLog = (type: DebugLog['type'], label: string, content: string) => {
    // Only log when debug is enabled to prevent performance issues
    if (!isDebugEnabled) return;
    
    // Deduplicate: skip if same content as last log
    const contentKey = `${label}:${content}`;
    if (contentKey === lastLogContent) return;
    lastLogContent = contentKey;
    
    const log: DebugLog = {
        timestamp: new Date().toLocaleTimeString(),
        type,
        label,
        content: content.length > 2000 ? content.substring(0, 2000) + '\n... (truncated)' : content
    };
    globalDebugLogs = [...globalDebugLogs, log].slice(-50); // Keep last 50 logs
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
