import React from 'react';

export interface SearchBarProps {
    onSearch: (query: string) => void;
    onNavigate: (direction: 'prev' | 'next') => void;
    onClear: () => void;
    matchCount: number;
    currentMatch: number;
}

/**
 * Magnifying glass icon component (no external resources)
 */
const SearchIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
    </svg>
);

/**
 * Chevron icon for navigation
 */
const ChevronIcon: React.FC<{ direction: 'up' | 'down'; size?: number }> = ({ direction, size = 14 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: direction === 'up' ? 'rotate(180deg)' : 'none' }}
    >
        <path d="M6 9l6 6 6-6" />
    </svg>
);

/**
 * Search bar component for searching within markdown content
 */
export const SearchBar: React.FC<SearchBarProps> = ({
    onSearch,
    onNavigate,
    onClear,
    matchCount,
    currentMatch
}) => {
    const [query, setQuery] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        onSearch(value);
    }, [onSearch]);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onNavigate(e.shiftKey ? 'prev' : 'next');
        } else if (e.key === 'Escape') {
            setQuery('');
            onSearch('');
            onClear();
        }
    }, [onNavigate, onSearch, onClear]);

    return (
        <div className="search-bar">
            <div className="search-bar-icon">
                <SearchIcon />
            </div>
            <input
                ref={inputRef}
                type="text"
                className="search-bar-input"
                placeholder="Search..."
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
            />
            {query && (
                <>
                    <span className="search-bar-count">
                        {matchCount > 0 ? `${currentMatch}/${matchCount}` : '0 results'}
                    </span>
                    <button
                        className="search-bar-nav"
                        onClick={() => onNavigate('prev')}
                        disabled={matchCount === 0}
                        title="Previous (Shift+Enter)"
                    >
                        <ChevronIcon direction="up" />
                    </button>
                    <button
                        className="search-bar-nav"
                        onClick={() => onNavigate('next')}
                        disabled={matchCount === 0}
                        title="Next (Enter)"
                    >
                        <ChevronIcon direction="down" />
                    </button>
                </>
            )}
        </div>
    );
};
