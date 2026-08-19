import { describe, it, expect } from 'vitest';
import {
    applyMeasureFormat,
    detectTruncatedContent,
    extractMarkdownContent,
    extractMarkdownSections,
    extractTooltipColumns,
    getMarkdownColumnIndices,
    getMeasureFormatFromColumn,
    sanitizeHTML,
    TRUNCATION_WARN_THRESHOLD,
    POWERBI_VALUE_CHAR_LIMIT,
    deepClone,
} from '../../src/utils';
import { MarkdownFunctionsSettings } from '../../src/settings';
import {
    categoricalDataView,
    singleDataView,
    stringOfLength,
    tableDataView,
    tableDataViewWithoutRoles,
} from '../fixtures/dataView';

describe('getMarkdownColumnIndices', () => {
    it('returns the indices of columns carrying the markdown role', () => {
        const dv = tableDataView(
            [{ displayName: 'A' }, { displayName: 'T', markdown: false }, { displayName: 'B' }],
            [['a', 1, 'b']]
        );
        expect(getMarkdownColumnIndices(dv)).toEqual([0, 2]);
    });

    it('falls back to column 0 when no role metadata is present', () => {
        const dv = tableDataViewWithoutRoles(['A', 'B'], [['a', 'b']]);
        expect(getMarkdownColumnIndices(dv)).toEqual([0]);
    });

    it('returns an empty array when there is no table', () => {
        expect(getMarkdownColumnIndices(singleDataView('x'))).toEqual([]);
    });
});

describe('getMeasureFormatFromColumn', () => {
    it('reads the per-column measureFormat object', () => {
        const dv = tableDataView(
            [{ displayName: 'A', formatFunction: 'code_block', codeLanguage: 'dax', listDelimiter: ';' }],
            [['x']]
        );
        expect(getMeasureFormatFromColumn(dv.table.columns[0])).toEqual({
            formatFunction: 'code_block',
            codeLanguage: 'dax',
            listDelimiter: ';',
        });
    });

    it('applies defaults when the column has no objects', () => {
        const dv = tableDataView([{ displayName: 'A' }], [['x']]);
        expect(getMeasureFormatFromColumn(dv.table.columns[0])).toEqual({
            formatFunction: 'none',
            codeLanguage: '',
            listDelimiter: ',',
        });
    });
});

describe('applyMeasureFormat', () => {
    it('renders heading levels h1–h3', () => {
        expect(applyMeasureFormat('Title', 'heading_h1', '')).toBe('# Title');
        expect(applyMeasureFormat('Title', 'heading_h2', '')).toBe('## Title');
        expect(applyMeasureFormat('Title', 'heading_h3', '')).toBe('### Title');
    });

    it('returns the content unchanged for "none" and for unknown functions', () => {
        expect(applyMeasureFormat('plain', 'none', '')).toBe('plain');
        expect(applyMeasureFormat('plain', 'does_not_exist', '')).toBe('plain');
    });

    it('wraps code blocks in a fence with the configured language', () => {
        expect(applyMeasureFormat('SUM(x)', 'code_block', 'dax')).toBe('```dax\nSUM(x)\n```');
    });

    it('prepends a code block header when a display name is given', () => {
        const result = applyMeasureFormat('SUM(x)', 'code_block', 'dax', 'Formula', undefined, undefined, undefined, undefined, undefined, true, 'h2');
        expect(result).toBe('## Formula\n\n```dax\nSUM(x)\n```');
    });

    it('omits the code block header when disabled', () => {
        const result = applyMeasureFormat('SUM(x)', 'code_block', 'dax', 'Formula', undefined, undefined, undefined, undefined, undefined, false, 'h2');
        expect(result).toBe('```dax\nSUM(x)\n```');
    });

    it('wraps highlights in == markers', () => {
        expect(applyMeasureFormat('important', 'highlight', '')).toBe('==important==');
    });

    it('builds definition list syntax from the display name and value', () => {
        expect(applyMeasureFormat('42', 'definition_list', '', 'Answer')).toBe('Answer\n: 42');
        expect(applyMeasureFormat('42', 'definition_list_value', '', 'Answer')).toBe('Answer\n: 42');
    });

    it('falls back to "Term" when no display name is available', () => {
        expect(applyMeasureFormat('42', 'definition_list', '')).toBe('Term\n: 42');
    });

    it('prefixes every line of a multi-line blockquote', () => {
        const result = applyMeasureFormat('line one\nline two', 'blockquote', '', 'Note', undefined, undefined, undefined, true, 'h3');
        expect(result).toBe('### Note\n\n> line one\n> line two\n');
    });

    it('omits the blockquote header when disabled', () => {
        const result = applyMeasureFormat('quote', 'blockquote', '', 'Note', undefined, undefined, undefined, false);
        expect(result).toBe('\n> quote\n');
    });

    it('splits unordered lists on the delimiter and trims the items', () => {
        const result = applyMeasureFormat('a ; b ; c', 'list_unordered', '', 'Items', ';', undefined, 'h4');
        expect(result).toBe('#### Items\n- a\n- b\n- c');
    });

    it('numbers ordered list items and drops empty ones', () => {
        const result = applyMeasureFormat('a,,b', 'list_ordered', '', 'Items', ',', undefined, 'none');
        expect(result).toBe('1. a\n2. b');
    });
});

describe('extractMarkdownSections', () => {
    it('returns one section for a single-value dataView', () => {
        expect(extractMarkdownSections(singleDataView('# Hello'))).toEqual([
            { content: '# Hello', rowIndex: 0 },
        ]);
    });

    it('returns an empty array for a null dataView', () => {
        expect(extractMarkdownSections(null as never)).toEqual([]);
    });

    it('column mode: one section per row with the correct rowIndex', () => {
        const dv = tableDataView([{ displayName: 'Doc' }], [['first'], ['second'], ['third']]);
        expect(extractMarkdownSections(dv)).toEqual([
            { content: 'first', rowIndex: 0 },
            { content: 'second', rowIndex: 1 },
            { content: 'third', rowIndex: 2 },
        ]);
    });

    it('skips null and whitespace-only values', () => {
        const dv = tableDataView([{ displayName: 'Doc' }], [['a'], [null], ['   '], ['b']]);
        expect(extractMarkdownSections(dv).map(s => s.content)).toEqual(['a', 'b']);
    });

    it('measure mode: one section per markdown column value', () => {
        const dv = tableDataView(
            [{ displayName: 'A', formatFunction: 'heading_h1' }, { displayName: 'B' }],
            [['Title', 'Body']]
        );
        expect(extractMarkdownSections(dv)).toEqual([
            { content: '# Title', rowIndex: 0 },
            { content: 'Body', rowIndex: 0 },
        ]);
    });

    it('ignores non-markdown (tooltip) columns', () => {
        const dv = tableDataView(
            [{ displayName: 'Doc' }, { displayName: 'Sales', markdown: false }],
            [['text', 999]]
        );
        expect(extractMarkdownSections(dv).map(s => s.content)).toEqual(['text']);
    });

    it('aggregates a multi-row list column into a single section', () => {
        const dv = tableDataView(
            [{ displayName: 'Tags', formatFunction: 'list_unordered' }],
            [['alpha'], ['beta'], ['gamma']]
        );
        const sections = extractMarkdownSections(dv);
        expect(sections).toHaveLength(1);
        expect(sections[0].rowIndex).toBe(0);
        expect(sections[0].content).toBe('#### Tags\n- alpha\n- beta\n- gamma');
    });

    it('aggregates a multi-row ordered list with running numbers', () => {
        const dv = tableDataView(
            [{ displayName: 'Steps', formatFunction: 'list_ordered' }],
            [['one'], ['two']]
        );
        expect(extractMarkdownSections(dv)[0].content).toBe('#### Steps\n1. one\n2. two');
    });

    it('merges a paired definition_list_header/value pair into one block', () => {
        const dv = tableDataView(
            [
                { displayName: 'Term', formatFunction: 'definition_list_header' },
                { displayName: 'Definition', formatFunction: 'definition_list_value' },
            ],
            [['Alpha', 'First letter'], ['Beta', 'Second letter']]
        );
        const sections = extractMarkdownSections(dv);
        expect(sections).toHaveLength(1);
        expect(sections[0].content).toBe('Alpha\n: First letter\n\nBeta\n: Second letter');
    });

    it('substitutes blankText for empty values in a paired definition list', () => {
        const settings = new MarkdownFunctionsSettings();
        settings.blankText = '(leer)';
        const dv = tableDataView(
            [
                { displayName: 'Term', formatFunction: 'definition_list_header' },
                { displayName: 'Definition', formatFunction: 'definition_list_value' },
            ],
            [['Alpha', ''], ['Beta', 'x']]
        );
        expect(extractMarkdownSections(dv, settings)[0].content)
            .toBe('Alpha\n: (leer)\n\nBeta\n: x');
    });

    it('renders blank definition list values with blankText in single-column mode', () => {
        const settings = new MarkdownFunctionsSettings();
        settings.blankText = '(blank)';
        const dv = tableDataView(
            [{ displayName: 'Answer', formatFunction: 'definition_list' }],
            [[null]]
        );
        expect(extractMarkdownSections(dv, settings)[0].content).toBe('Answer\n: (blank)');
    });

    it('deduplicates repeated values per column when enabled', () => {
        const dv = tableDataView([{ displayName: 'Doc' }], [['a'], ['a'], ['b'], ['a']]);
        expect(extractMarkdownSections(dv, undefined, false).map(s => s.content))
            .toEqual(['a', 'a', 'b', 'a']);
        expect(extractMarkdownSections(dv, undefined, true).map(s => s.content))
            .toEqual(['a', 'b']);
    });

    it('deduplicates list items across rows after splitting on the delimiter', () => {
        const dv = tableDataView(
            [{ displayName: 'Tags', formatFunction: 'list_unordered', listDelimiter: ';' }],
            [['a;b'], ['a;b'], ['b;c']]
        );
        expect(extractMarkdownSections(dv, undefined, true)[0].content)
            .toBe('#### Tags\n- a\n- b\n- c');
    });

    // Documents a real divergence: MarkdownFunctionsSettings defaults
    // listHeadingLevel to 'h3', but extractMarkdownSections falls back to 'h4'
    // when called without a settings object. The visual always passes settings,
    // so users see h3; only direct calls see h4.
    it('falls back to h4 for list headings when called without settings', () => {
        const dv = tableDataView(
            [{ displayName: 'Tags', formatFunction: 'list_unordered' }],
            [['a'], ['b']]
        );
        expect(extractMarkdownSections(dv)[0].content.startsWith('#### ')).toBe(true);
        expect(extractMarkdownSections(dv, new MarkdownFunctionsSettings())[0].content.startsWith('### ')).toBe(true);
    });

    it('applies the configured list heading level', () => {
        const settings = new MarkdownFunctionsSettings();
        settings.listHeadingLevel = 'none';
        const dv = tableDataView(
            [{ displayName: 'Tags', formatFunction: 'list_unordered' }],
            [['a'], ['b']]
        );
        expect(extractMarkdownSections(dv, settings)[0].content).toBe('- a\n- b');
    });

    it('falls back to categorical categories', () => {
        const dv = categoricalDataView(['one', null, 'two']);
        expect(extractMarkdownSections(dv)).toEqual([
            { content: 'one', rowIndex: 0 },
            { content: 'two', rowIndex: 2 },
        ]);
    });

    it('falls back to the first categorical measure value', () => {
        const dv = categoricalDataView(undefined, [42]);
        expect(extractMarkdownSections(dv)).toEqual([{ content: '42', rowIndex: 0 }]);
    });
});

describe('extractTooltipColumns', () => {
    it('returns only the non-markdown columns with their row values', () => {
        const dv = tableDataView(
            [
                { displayName: 'Doc' },
                { displayName: 'Sales', markdown: false },
                { displayName: 'Region', markdown: false },
            ],
            [['a', 10, 'North'], ['b', 20, 'South']]
        );
        expect(extractTooltipColumns(dv)).toEqual([
            { displayName: 'Sales', values: [10, 20] },
            { displayName: 'Region', values: ['North', 'South'] },
        ]);
    });

    it('returns an empty array when there is no table', () => {
        expect(extractTooltipColumns(singleDataView('x'))).toEqual([]);
    });
});

describe('extractMarkdownContent', () => {
    it('joins sections with a horizontal rule', () => {
        const dv = tableDataView([{ displayName: 'Doc' }], [['a'], ['b']]);
        expect(extractMarkdownContent(dv)).toBe('a\n\n---\n\nb');
    });

    it('returns an empty string when there are no sections', () => {
        expect(extractMarkdownContent(tableDataView([{ displayName: 'Doc' }], []))).toBe('');
    });
});

describe('detectTruncatedContent', () => {
    // Deliberately literal, not derived from the constants: asserting against
    // the constant itself would pass no matter how it is changed.
    it('exposes the documented Power BI ceiling and warning threshold', () => {
        expect(POWERBI_VALUE_CHAR_LIMIT).toBe(32767);
        expect(TRUNCATION_WARN_THRESHOLD).toBe(32700);
    });

    it('does not fire one character below the threshold', () => {
        const dv = tableDataView([{ displayName: 'Doc' }], [[stringOfLength(32699)]]);
        expect(detectTruncatedContent(dv)).toBe(false);
    });

    it('fires exactly at the threshold', () => {
        const dv = tableDataView([{ displayName: 'Doc' }], [[stringOfLength(32700)]]);
        expect(detectTruncatedContent(dv)).toBe(true);
    });

    it('ignores oversized values in tooltip columns', () => {
        const dv = tableDataView(
            [{ displayName: 'Doc' }, { displayName: 'Other', markdown: false }],
            [['short', stringOfLength(32700)]]
        );
        expect(detectTruncatedContent(dv)).toBe(false);
    });

    it('detects truncation in the single mapping', () => {
        expect(detectTruncatedContent(singleDataView(stringOfLength(32700)))).toBe(true);
        expect(detectTruncatedContent(singleDataView('short'))).toBe(false);
    });

    it('detects truncation in the categorical mapping', () => {
        expect(detectTruncatedContent(categoricalDataView([stringOfLength(32700)]))).toBe(true);
        expect(detectTruncatedContent(categoricalDataView(undefined, [stringOfLength(32700)]))).toBe(true);
    });

    it('returns false for a null dataView', () => {
        expect(detectTruncatedContent(null as never)).toBe(false);
    });
});

describe('sanitizeHTML', () => {
    it('strips script tags', () => {
        expect(sanitizeHTML('<p>ok</p><script>alert(1)</script>')).not.toContain('script');
    });

    it('strips inline event handlers', () => {
        const result = sanitizeHTML('<div onclick="steal()">text</div>');
        expect(result).not.toContain('onclick');
        expect(result).toContain('text');
    });

    it('strips iframes and href attributes', () => {
        expect(sanitizeHTML('<iframe src="https://evil.test"></iframe>')).not.toContain('iframe');
        expect(sanitizeHTML('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
    });

    it('keeps harmless markup and data attributes', () => {
        const result = sanitizeHTML('<span data-section-index="2"><strong>bold</strong></span>');
        expect(result).toContain('data-section-index="2"');
        expect(result).toContain('<strong>bold</strong>');
    });
});

describe('deepClone', () => {
    it('produces an independent copy', () => {
        const source = { a: 1, nested: { b: [1, 2] } };
        const clone = deepClone(source) as typeof source;
        clone.nested.b.push(3);
        expect(source.nested.b).toEqual([1, 2]);
        expect(clone.nested.b).toEqual([1, 2, 3]);
    });
});
