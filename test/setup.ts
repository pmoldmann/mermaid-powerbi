import '@testing-library/jest-dom/vitest';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// ---------------------------------------------------------------------------
// jsdom gaps. None of these exist in jsdom but all are touched by the visual:
// mermaid measures SVG text, SearchBar scrolls matches into view, the
// ContextMenu copies via the clipboard API with an execCommand fallback.
// ---------------------------------------------------------------------------

if (!(globalThis as { SVGElement?: unknown }).SVGElement) {
    // jsdom always provides SVGElement, but guard so the file stays importable
    // outside a DOM environment.
} else {
    Object.defineProperty(SVGElement.prototype, 'getBBox', {
        writable: true,
        configurable: true,
        value: () => ({ x: 0, y: 0, width: 100, height: 20 }),
    });
    Object.defineProperty(SVGElement.prototype, 'getComputedTextLength', {
        writable: true,
        configurable: true,
        value: () => 100,
    });
}

Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || function () { /* noop */ };

if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
        observe() { /* noop */ }
        unobserve() { /* noop */ }
        disconnect() { /* noop */ }
    } as unknown as typeof ResizeObserver;
}

if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => { /* deprecated */ },
            removeListener: () => { /* deprecated */ },
            addEventListener: () => { /* noop */ },
            removeEventListener: () => { /* noop */ },
            dispatchEvent: () => false,
        }),
    });
}

Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
});

Object.defineProperty(document, 'execCommand', {
    configurable: true,
    writable: true,
    value: vi.fn().mockReturnValue(true),
});

// Range.getBoundingClientRect / getClientRects are used by the search highlight
// logic; jsdom returns undefined for both.
Range.prototype.getBoundingClientRect = () => ({
    x: 0, y: 0, top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0,
    toJSON: () => ({}),
}) as DOMRect;
Range.prototype.getClientRects = (() => {
    const list: DOMRect[] = [];
    return Object.assign(list, { item: () => null }) as unknown as DOMRectList;
}) as unknown as typeof Range.prototype.getClientRects;

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});
