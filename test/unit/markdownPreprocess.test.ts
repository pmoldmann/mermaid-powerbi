import { describe, it, expect } from 'vitest';
import { preprocessDisplayMath, remarkMark } from '../../src/markdownPreprocess';

describe('preprocessDisplayMath', () => {
    it('converts multi-line display math into a math fence', () => {
        const result = preprocessDisplayMath('before\n$$\na^2 + b^2 = c^2\n$$\nafter');
        expect(result).toContain('```math\na^2 + b^2 = c^2\n```');
        expect(result).not.toContain('$$');
    });

    it('converts single-line display math into a math fence', () => {
        const result = preprocessDisplayMath('$$E = mc^2$$');
        expect(result).toContain('```math\nE = mc^2\n```');
    });

    it('converts inline math into a katex-inline code span', () => {
        expect(preprocessDisplayMath('value is $x + y$ here'))
            .toBe('value is `katex-inline:x + y` here');
    });

    it('leaves content inside existing code fences untouched', () => {
        const source = 'text\n\n```js\nconst price = "$100 and $200";\n```\n\ntail';
        expect(preprocessDisplayMath(source)).toBe(source);
    });

    it('leaves tilde fences untouched', () => {
        const source = '~~~\n$a$\n~~~';
        expect(preprocessDisplayMath(source)).toBe(source);
    });

    it('processes math outside a fence while preserving the fence', () => {
        const result = preprocessDisplayMath('$a$\n\n```\n$b$\n```\n\n$c$');
        expect(result).toContain('`katex-inline:a`');
        expect(result).toContain('```\n$b$\n```');
        expect(result).toContain('`katex-inline:c`');
    });

    it('leaves a lone dollar sign alone', () => {
        expect(preprocessDisplayMath('costs 100 $ total')).toBe('costs 100 $ total');
    });

    it('does not touch dollars inside an inline code span', () => {
        expect(preprocessDisplayMath('use `$var$` literally')).toBe('use `$var$` literally');
    });

    it('returns plain markdown unchanged', () => {
        const source = '# Title\n\nSome **bold** text.';
        expect(preprocessDisplayMath(source)).toBe(source);
    });
});

describe('remarkMark', () => {
    /** Minimal mdast tree with a single text node inside a paragraph. */
    function paragraph(text: string) {
        return {
            type: 'root',
            children: [{ type: 'paragraph', children: [{ type: 'text', value: text }] }],
        };
    }

    it('replaces ==text== with an html mark node', () => {
        const tree = paragraph('some ==highlighted== words');
        remarkMark()(tree as never);
        const children = (tree.children[0] as { children: { type: string; value: string }[] }).children;
        const html = children.find(c => c.type === 'html');
        expect(html?.value).toBe('<mark>highlighted</mark>');
    });

    it('leaves text without markers unchanged', () => {
        const tree = paragraph('nothing to highlight');
        remarkMark()(tree as never);
        const children = (tree.children[0] as { children: { type: string; value: string }[] }).children;
        expect(children).toHaveLength(1);
        expect(children[0].value).toBe('nothing to highlight');
    });

    it('handles several highlights in one paragraph', () => {
        const tree = paragraph('==a== and ==b==');
        remarkMark()(tree as never);
        const children = (tree.children[0] as { children: { type: string; value: string }[] }).children;
        const marks = children.filter(c => c.type === 'html').map(c => c.value);
        expect(marks).toEqual(['<mark>a</mark>', '<mark>b</mark>']);
    });
});
