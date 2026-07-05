import React from "react";
import { useAppSelector } from './redux/hooks';
import { openExternalLink } from './Code';

/**
 * Safe replacement for markdown-rendered anchors.
 *
 * react-markdown invokes `components.a` for every anchor node in the hast tree
 * (markdown links, GFM autolinks, bare URLs, and any raw-HTML anchor). Rendering
 * a non-anchor element here guarantees that NO `<a>` element is ever produced from
 * data-field content, which is required by the Power BI certification check
 * (1200.1.3): relative hrefs would otherwise resolve against https://app.powerbi.com/...,
 * and http/https anchors would navigate directly, bypassing host.launchUrl()'s
 * confirmation dialog.
 *
 * Link policy:
 * - http/https/mailto  -> clickable, opened externally via host.launchUrl()
 *   (native confirmation dialog), reusing openExternalLink() from Code.tsx.
 * - everything else (relative paths, protocol-relative, tel:, data:, etc.)
 *   -> rendered as inert, non-navigable text.
 */

// Only these are treated as safe, launchable external links.
const SAFE_PROTOCOL = /^(https?:|mailto:)/i;

interface SafeLinkProps {
    href?: string;
    children?: React.ReactNode;
}

export const SafeLink: React.FC<SafeLinkProps> = ({ href, children }) => {
    const host = useAppSelector((state) => state.options.host);
    const url = (href || '').trim();
    const isSafe = SAFE_PROTOCOL.test(url);

    const launch = React.useCallback(() => {
        openExternalLink(url, host);
    }, [url, host]);

    const onKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLSpanElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            launch();
        }
    }, [launch]);

    if (!isSafe) {
        // Relative / unknown-protocol links are the exact vector flagged by the
        // certification review — render them as plain, non-navigable text.
        return <span className="md-link-inert">{children}</span>;
    }

    return (
        <span
            role="link"
            tabIndex={0}
            className="md-link"
            title={url}
            onClick={launch}
            onKeyDown={onKeyDown}
        >
            {children}
        </span>
    );
};

export default SafeLink;
