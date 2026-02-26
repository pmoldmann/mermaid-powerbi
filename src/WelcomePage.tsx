import React from 'react';

// Visual version - update this for App Store releases
export const VISUAL_VERSION = '1.0.0.0';

// Library versions used in this visual
export const LIBRARY_VERSIONS = {
    mermaid: '11.12.3',
    react: '18.2.0',
    'react-md-editor': '4.0.4 (Markdown rendering)',
    handlebars: '4.7.8',
    dompurify: '3.2.6',
};

/**
 * Icon component for the Markdown/Mermaid visual
 */
export const VisualIcon: React.FC<{ size?: number }> = ({ size = 80 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="https://www.w3.org/2000/svg"
    >
        {/* Background rounded rectangle */}
        <rect x="5" y="5" width="90" height="90" rx="12" fill="#2D3748" />
        
        {/* Markdown "M" symbol */}
        <path
            d="M20 70V30H28L38 50L48 30H56V70H48V45L38 65L28 45V70H20Z"
            fill="#E2E8F0"
        />
        
        {/* Mermaid flow arrow/diagram representation */}
        <rect x="62" y="30" width="18" height="12" rx="2" fill="#4FD1C5" />
        <rect x="62" y="58" width="18" height="12" rx="2" fill="#4FD1C5" />
        
        {/* Connecting arrow */}
        <path
            d="M71 42V52M71 52L66 47M71 52L76 47"
            stroke="#4FD1C5"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

/**
 * Welcome page component displayed when no markdown content is provided
 */
export const WelcomePage: React.FC = () => {
    return (
        <div className="welcome-page">
            <div className="welcome-header">
                <VisualIcon size={64} />
                <h1>Markdown / Mermaid Renderer</h1>
                <span className="version-badge">v{VISUAL_VERSION}</span>
            </div>

            <div className="welcome-content">
                <section className="welcome-section">
                    <h2>📄 What is this Visual?</h2>
                    <p>
                        This visual allows you to embed rich documentation and diagrams in your 
                        Power BI reports using standard Markdown syntax and Mermaid diagram notation. 
                        It's perfect for:
                    </p>
                    <ul>
                        <li>Embedding <strong>documentation</strong> directly in Power BI reports</li>
                        <li>Visualising <strong>flowcharts</strong> and <strong>process diagrams</strong></li>
                        <li>Visualizing <strong>data relationships</strong> with ER diagrams</li>
                        <li>Documenting <strong>architecture</strong> and system designs</li>
                    </ul>
                </section>

                <section className="welcome-section">
                    <h2>📋 Prerequisites</h2>
                    <ul>
                        <li>You need a column in your data model that contains markdown text.</li>
                    </ul>
                </section>

                <section className="welcome-section">
                    <h2>🚀 How to Use</h2>
                    <ol>
                        <li>Add a <strong>column or measure</strong> containing Markdown text to the <em>"Markdown Content"</em> field</li>
                        <li>Use the <strong>zoom controls</strong> (+/−) for detailed diagram viewing</li>
                        <li>Use <strong>Ctrl+F</strong> to search within the document</li>
                    </ol>
                    <p style={{ marginTop: '8px', fontSize: '13px', color: '#718096' }}>
                        <em>💡 Tip: When using a column, multiple rows are automatically concatenated and displayed together.</em>
                    </p>
                </section>

                <section className="welcome-section libraries">
                    <h2>📦 Libraries & Versions</h2>
                    <div className="library-grid">
                        {Object.entries(LIBRARY_VERSIONS).map(([name, version]) => (
                            <div key={name} className="library-item">
                                <span className="library-name">{name}</span>
                                <span className="library-version">{version}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <footer className="welcome-footer">
                    <p className="author-credit">
                        Created by <strong>Paul Moldmann</strong>
                    </p>
                    <p>
                        <em>Special thanks to <strong>Ilfat Galiev</strong> who originally 
                        created this visual, which has been adapted and enhanced.</em>
                    </p>
                </footer>
            </div>
        </div>
    );
};
