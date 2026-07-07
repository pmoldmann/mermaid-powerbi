import { findAndReplace } from 'mdast-util-find-and-replace';

/**
 * Converts display math ($$...$$) to fenced code blocks with language "math".
 * This allows Code.tsx to render them with KaTeX, bypassing the unreliable
 * remark-math / rehype-katex plugin chain inside react-markdown-preview.
 *
 * Handles:
 *   - Single-line:  $$formula$$
 *   - Multi-line:   $$\nformula\n$$
 *
 * Content inside existing code fences is left untouched.
 */
export function preprocessDisplayMath(markdown: string): string {
    const segments: string[] = [];
    // Split on fenced code blocks to avoid processing math inside them
    const fence = /(`{3,}|~{3,})[\s\S]*?\1/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = fence.exec(markdown)) !== null) {
        segments.push(markdown.slice(last, m.index), '\x00FENCE\x00', m[0], '\x00/FENCE\x00');
        last = fence.lastIndex;
    }
    segments.push(markdown.slice(last));

    return segments.map(seg => {
        // Preserve code fences and their markers
        if (seg === '\x00FENCE\x00' || seg === '\x00/FENCE\x00') return '';
        if (seg.startsWith('```') || seg.startsWith('~~~')) return seg;

        // Multi-line display math: $$\ncontent\n$$
        seg = seg.replace(/\$\$\n([\s\S]*?)\n\$\$/g, (_, math) =>
            '\n\n```math\n' + math + '\n```\n\n'
        );
        // Single-line display math: $$content$$ (no inner newlines)
        seg = seg.replace(/\$\$([^\n]+?)\$\$/g, (_, math) =>
            '\n\n```math\n' + math.trim() + '\n```\n\n'
        );
        // Inline math: $formula$ (single $, no newlines inside, not preceded/followed by another $)
        // Also skip inline code spans (`...`) to avoid double-processing
        seg = seg.replace(/(?<![`$])\$([^$\n`]+?)\$(?![`$])/g, (_, math) =>
            '`katex-inline:' + math.trim() + '`'
        );
        return seg;
    }).join('');
}

// Remark plugin that converts ==text== into <mark> elements
export function remarkMark() {
    return function (tree: Parameters<typeof findAndReplace>[0]) {
        findAndReplace(tree, [
            [
                /==([^=\n]+)==/g,
                (_match: string, $1: string) => ({
                    type: 'html' as const,
                    value: `<mark>${$1}</mark>`,
                }),
            ],
        ]);
    };
}
