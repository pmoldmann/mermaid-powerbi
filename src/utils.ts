import powerbiVisualsApi from "powerbi-visuals-api";
import DataView = powerbiVisualsApi.DataView;
import DataViewMetadataColumn = powerbiVisualsApi.DataViewMetadataColumn;
import PrimitiveValue = powerbiVisualsApi.PrimitiveValue;

import dompurify from "dompurify";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { MarkdownFunctionsSettings } from "./settings";

export const defaultDompurifyConfig = <dompurify.Config>{
    RETURN_DOM: false,
    SANITIZE_DOM: true,
    ALLOW_ARIA_ATTR: true,
    ALLOWED_ATTR: [
        'data-*'
    ],
    ALLOW_UNKNOWN_PROTOCOLS: false,
    USE_PROFILES: {svg: true, svgFilters: true, html: true, mathMl: false},
    FORBID_ATTR: [
        'href',
        'url',
        'onafterprint',
        'onbeforeprint',
        'onbeforeunload',
        'onerror',
        'onhashchange',
        'onload',
        'onmessage',
        'onoffline',
        'ononline',
        'onpagehide',
        'onpageshow',
        'onpopstate',
        'onresize',
        'onstorage',
        'onunload',
        'onblur',
        'onchange',
        'onfocus',
        'oninput',
        'oninvalid',
        'onreset',
        'onsearch',
        'onselect',
        'onsubmit',
        'onkeydown',
        'onkeypress',
        'onkeyup',
        'onclick',
        'ondblclick',
        'onmousedown',
        'onmousemove',
        'onmouseout',
        'onmouseover',
        'onmouseup',
        'onmousewheel',
        'onwheel',
        'oncopy',
        'oncut',
        'onpaste',
        'onabort',
        'oncanplay',
        'oncanplaythrough',
        'oncuechange',
        'ondurationchange',
        'onemptied',
        'onended',
        'onerror',
        'onloadeddata',
        'onloadedmetadata',
        'onloadstart',
        'onpause',
        'onplay',
        'onplaying',
        'onprogress',
        'onratechange',
        'onseeked',
        'onseeking',
        'onstalled',
        'onsuspend',
        'ontimeupdate',
        'onvolumechange',
        'onwaiting',
    ],
    FORBID_TAGS: ['script', 'iframe', 'object', 'param', 'source', 'video'],
};

export function sanitizeHTML(dirty: string) {
    return dompurify.sanitize(dirty, defaultDompurifyConfig) as string;
}

/**
 * A single markdown section with its original row index for interactivity.
 */
export interface MarkdownSection {
    /** The markdown content for this section */
    content: string;
    /** The original row index in the dataView table (used for selection/tooltip) */
    rowIndex: number;
}

/**
 * Tooltip column data extracted from the dataView.
 */
export interface TooltipColumnData {
    /** The display name of the column */
    displayName: string;
    /** The values for each row (indexed by row position, not rowIndex) */
    values: unknown[];
}

/**
 * Formats a raw Power BI primitive value using the column's Power BI format string.
 * Falls back to String() if no format string is defined or formatting fails.
 */
function formatColumnValue(value: PrimitiveValue, col: DataViewMetadataColumn): string {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (col.format) {
        try {
            return valueFormatter.create({ format: col.format }).format(value);
        } catch {
            // fall through to String()
        }
    }
    return String(value);
}

/**
 * Returns the markdown heading prefix for a given heading level string.
 * @param level The heading level ('h1' through 'h6', or 'none')
 * @returns The markdown heading prefix (e.g. '# ') or empty string for 'none'
 */
function headingPrefix(level: string): string {
    switch (level) {
        case 'h1': return '# ';
        case 'h2': return '## ';
        case 'h3': return '### ';
        case 'h4': return '#### ';
        case 'h5': return '##### ';
        case 'h6': return '###### ';
        default: return '';
    }
}

/**
 * Applies a markdown formatting function to content.
 * @param content The raw measure value
 * @param formatFunction The formatting function to apply
 * @param codeLanguage The language for code blocks (only used when formatFunction is 'code_block')
 * @param displayName The display name of the column/measure (used as heading for lists and definition lists)
 * @param listDelimiter The delimiter used to split content into list items (only used for list_ordered / list_unordered)
 * @param definitionHeadingLevel The heading level for definition list terms ('none', 'h1'–'h6')
 * @param listHeadingLevel The heading level for list titles ('none', 'h1'–'h6')
 * @returns The formatted markdown string
 */
export function applyMeasureFormat(
    content: string,
    formatFunction: string,
    codeLanguage: string,
    displayName?: string,
    listDelimiter?: string,
    definitionHeadingLevel?: string,
    listHeadingLevel?: string,
    blockquoteAddHeader?: boolean,
    blockquoteHeaderFormat?: string,
    codeBlockAddHeader?: boolean,
    codeBlockHeaderFormat?: string
): string {
    switch (formatFunction) {
        case 'heading_h1':
            return `# ${content}`;
        case 'heading_h2':
            return `## ${content}`;
        case 'heading_h3':
            return `### ${content}`;
        case 'code_block': {
            const codeBlock = `\`\`\`${codeLanguage}\n${content}\n\`\`\``;
            if (codeBlockAddHeader !== false && displayName) {
                const cbPrefix = headingPrefix(codeBlockHeaderFormat || 'h3');
                return cbPrefix ? `${cbPrefix}${displayName}\n\n${codeBlock}` : codeBlock;
            }
            return codeBlock;
        }
        case 'highlight':
            return `==${content}==`;
        case 'definition_list':
        case 'definition_list_value': {
            const termText = displayName || 'Term';
            // Always use DL syntax (term\n: value) — sizing is handled via
            // data-dl-heading CSS attribute on .markdown-content, which scales
            // dt font-size using the same multipliers as the real h1–h6 rules.
            return `${termText}\n: ${content}`;
        }
        case 'definition_list_header':
            // Returns the raw value; only used when a definition_list_header column exists
            // without a paired definition_list_value column (treated as plain text).
            return content;
        case 'blockquote': {
            const quoted = content.split('\n').map(line => `> ${line}`).join('\n');
            if (blockquoteAddHeader !== false && displayName) {
                const bqPrefix = headingPrefix(blockquoteHeaderFormat || 'h3');
                return bqPrefix ? `${bqPrefix}${displayName}\n\n${quoted}\n` : `\n${quoted}\n`;
            }
            return `\n${quoted}\n`;
        }
        case 'list_unordered': {
            const delimiter = listDelimiter || ',';
            const items = content.split(delimiter).map(item => `- ${item.trim()}`).filter(item => item !== '- ').join('\n');
            const lPrefix = headingPrefix(listHeadingLevel || 'h4');
            const heading = lPrefix ? `${lPrefix}${displayName || 'List'}\n` : '';
            return `${heading}${items}`;
        }
        case 'list_ordered': {
            const delimiter = listDelimiter || ',';
            const items = content.split(delimiter)
                .map(item => item.trim())
                .filter(item => item !== '')
                .map((item, idx) => `${idx + 1}. ${item}`)
                .join('\n');
            const lPrefix = headingPrefix(listHeadingLevel || 'h4');
            const heading = lPrefix ? `${lPrefix}${displayName || 'List'}\n` : '';
            return `${heading}${items}`;
        }
        case 'none':
        default:
            return content;
    }
}

/**
 * Reads the measure format settings from a dataView column's per-column objects.
 * @param column The dataView metadata column
 * @returns Object with formatFunction and codeLanguage
 */
export function getMeasureFormatFromColumn(column: powerbiVisualsApi.DataViewMetadataColumn): { formatFunction: string; codeLanguage: string; listDelimiter: string } {
    const objects = column.objects;
    const formatFunction = (objects?.measureFormat?.formatFunction as string) || 'none';
    const codeLanguage = (objects?.measureFormat?.codeLanguage as string) || '';
    const listDelimiter = (objects?.measureFormat?.listDelimiter as string) || ',';
    return { formatFunction, codeLanguage, listDelimiter };
}

/**
 * Returns the column indices in the dataView table that have the 'markdown' role.
 * Falls back to [0] if no role metadata is available (backward compatibility).
 * @param dataView The Power BI dataView
 * @returns Array of column indices with the markdown role
 */
export function getMarkdownColumnIndices(dataView: DataView): number[] {
    if (!dataView?.table?.columns) return [];
    const indices: number[] = [];
    dataView.table.columns.forEach((col, idx) => {
        if (col.roles && col.roles['markdown']) {
            indices.push(idx);
        }
    });
    // Fallback: if no role info available, assume column 0 is markdown
    return indices.length > 0 ? indices : [0];
}

/**
 * Extracts markdown sections from the dataView, preserving row indices.
 * - Single markdown column: each row becomes a section (column mode).
 * - Multiple markdown columns: each column value becomes a section (measure mode).
 * @param dataView The Power BI dataView
 * @param markdownFunctions Visual-level settings for definition lists and list headings
 * @returns Array of MarkdownSection with content and rowIndex
 */
export function extractMarkdownSections(dataView: DataView, markdownFunctions?: MarkdownFunctionsSettings, deduplicateValues?: boolean): MarkdownSection[] {
    if (!dataView) {
        return [];
    }

    const defHeading = markdownFunctions?.definitionHeadingLevel || 'none';
    const listHeading = markdownFunctions?.listHeadingLevel || 'h4';
    const blankText = markdownFunctions?.blankText || '(blank)';
    const bqAddHeader = markdownFunctions?.blockquoteAddHeader !== false;
    const bqHeaderFormat = markdownFunctions?.blockquoteHeaderFormat || 'h3';
    const cbAddHeader = markdownFunctions?.codeBlockAddHeader !== false;
    const cbHeaderFormat = markdownFunctions?.codeBlockHeaderFormat || 'h3';

    // Try single value first (measure) - via single mapping
    if (dataView.single && dataView.single.value != null) {
        return [{ content: String(dataView.single.value), rowIndex: 0 }];
    }

    // Try table mapping (primary mapping)
    if (dataView.table && dataView.table.rows && dataView.table.rows.length > 0) {
        const markdownColIndices = getMarkdownColumnIndices(dataView);
        const sections: MarkdownSection[] = [];
        const rows = dataView.table.rows;
        const isMultiRow = rows.length > 1;

        // When deduplication is enabled, compute distinct values per column.
        // Each column is treated independently — only unique string representations are kept.
        // This avoids duplicate measure values when measures and columns are mixed.
        const distinctValueSets: Map<number, Set<string>> | null = deduplicateValues
            ? new Map(markdownColIndices.map(colIdx => [colIdx, new Set<string>()]))
            : null;

        // For list columns with multiple rows, aggregate all row values into a single list
        // (each row becomes one list item, no delimiter splitting).
        // Collect which columns need aggregation so we can skip them in the per-row loop.
        const aggregatedCols = new Set<number>();

        if (isMultiRow) {
            // --- Paired Definition List: definition_list_header + definition_list_value ---
            // When both a header column and a value column are present, aggregate all rows
            // into a single <dl> block. Max one of each; first found is used.
            const dlHeaderColIdx = markdownColIndices.find(idx => {
                const ff = getMeasureFormatFromColumn(dataView.table.columns[idx]).formatFunction;
                return ff === 'definition_list_header';
            }) ?? -1;
            const dlValueColIdx = markdownColIndices.find(idx => {
                const ff = getMeasureFormatFromColumn(dataView.table.columns[idx]).formatFunction;
                return ff === 'definition_list_value' || ff === 'definition_list';
            }) ?? -1;

            if (dlHeaderColIdx !== -1 && dlValueColIdx !== -1) {
                aggregatedCols.add(dlHeaderColIdx);
                aggregatedCols.add(dlValueColIdx);

                const dlEntries: string[] = [];
                const seenPairs = deduplicateValues ? new Set<string>() : null;

                const dlHeaderCol = dataView.table.columns[dlHeaderColIdx];
                const dlValueCol = dataView.table.columns[dlValueColIdx];

                rows.forEach(row => {
                    const rawTerm = row[dlHeaderColIdx];
                    const rawDef = row[dlValueColIdx];
                    const termFormatted = formatColumnValue(rawTerm, dlHeaderCol).trim();
                    const defFormatted = formatColumnValue(rawDef, dlValueCol).trim();
                    const termStr = termFormatted === '' ? blankText : termFormatted;
                    const defStr = defFormatted === '' ? blankText : defFormatted;

                    if (seenPairs) {
                        const pairKey = `${termStr}\x00${defStr}`;
                        if (seenPairs.has(pairKey)) return;
                        seenPairs.add(pairKey);
                    }

                    // Always DL syntax — dt sizing controlled via CSS data-dl-heading attribute
                    dlEntries.push(`${termStr}\n: ${defStr}`);
                });

                if (dlEntries.length > 0) {
                    sections.push({ content: dlEntries.join('\n\n'), rowIndex: 0 });
                }
            }

            markdownColIndices.forEach(colIdx => {
                const col = dataView.table.columns[colIdx];
                const { formatFunction, listDelimiter } = getMeasureFormatFromColumn(col);

                if (formatFunction === 'list_unordered' || formatFunction === 'list_ordered') {
                    aggregatedCols.add(colIdx);
                    const delimiter = listDelimiter || ',';

                    // Step 1: Collect all non-empty row values, deduplicate if enabled
                    const rawValues: string[] = [];
                    const seenRawValues = deduplicateValues ? new Set<string>() : null;
                    rows.forEach(row => {
                        const value = row[colIdx];
                        if (value != null && String(value).trim() !== '') {
                            const trimmed = String(value).trim();
                            if (seenRawValues && seenRawValues.has(trimmed)) return;
                            seenRawValues?.add(trimmed);
                            rawValues.push(trimmed);
                        }
                    });

                    // Step 2: When deduplicating, split each distinct value by delimiter
                    // and deduplicate the resulting items. This ensures that measure values
                    // like "A;B" are properly expanded into individual list items after
                    // duplicate rows have been removed.
                    let items: string[];
                    if (deduplicateValues) {
                        const seenItems = new Set<string>();
                        items = [];
                        rawValues.forEach(raw => {
                            const splitItems = raw.split(delimiter).map(item => item.trim()).filter(item => item !== '');
                            splitItems.forEach(item => {
                                if (!seenItems.has(item)) {
                                    seenItems.add(item);
                                    items.push(item);
                                }
                            });
                        });
                    } else {
                        // Standard behavior: each row value = one list item (no delimiter splitting)
                        items = rawValues;
                    }

                    if (items.length > 0) {
                        const lPrefix = headingPrefix(listHeading || 'h4');
                        const heading = lPrefix ? `${lPrefix}${col.displayName || 'List'}\n` : '';
                        let itemsStr: string;
                        if (formatFunction === 'list_unordered') {
                            itemsStr = items.map(item => `- ${item}`).join('\n');
                        } else {
                            itemsStr = items.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
                        }
                        // Use rowIndex 0 for the aggregated list section
                        sections.push({ content: `${heading}${itemsStr}`, rowIndex: 0 });
                    }
                }
            });
        }

        rows.forEach((row, rowIndex) => {
            markdownColIndices.forEach(colIdx => {
                // Skip columns that were aggregated into a single list section
                if (aggregatedCols.has(colIdx)) return;

                const value = row[colIdx];
                const col = dataView.table.columns[colIdx];
                const { formatFunction, codeLanguage, listDelimiter } = getMeasureFormatFromColumn(col);

                // For definition list value formats, render null/empty values with the blank text placeholder
                if ((formatFunction === 'definition_list' || formatFunction === 'definition_list_value') && (value == null || String(value).trim() === '')) {
                    const content = applyMeasureFormat(blankText, formatFunction, codeLanguage, col.displayName, listDelimiter, defHeading, listHeading, bqAddHeader, bqHeaderFormat, cbAddHeader, cbHeaderFormat);
                    sections.push({ content, rowIndex });
                    return;
                }

                if (value != null && String(value).trim() !== '') {
                    // Deduplicate: skip if this column value was already seen
                    if (distinctValueSets) {
                        const key = String(value).trim();
                        const colSet = distinctValueSets.get(colIdx)!;
                        if (colSet.has(key)) return;
                        colSet.add(key);
                    }
                    // Use Power BI column format string for definition list value columns
                    const rawContent = (formatFunction === 'definition_list' || formatFunction === 'definition_list_value')
                        ? formatColumnValue(value, col)
                        : String(value);
                    let content = applyMeasureFormat(rawContent, formatFunction, codeLanguage, col.displayName, listDelimiter, defHeading, listHeading, bqAddHeader, bqHeaderFormat, cbAddHeader, cbHeaderFormat);
                    sections.push({ content, rowIndex });
                }
            });
        });
        return sections;
    }

    // Try categorical mapping (backwards compatibility)
    if (dataView.categorical) {
        if (dataView.categorical.categories && dataView.categorical.categories.length > 0) {
            const category = dataView.categorical.categories[0];
            if (category && category.values && category.values.length > 0) {
                const sections: MarkdownSection[] = [];
                category.values.forEach((value, index) => {
                    if (value != null && String(value).trim() !== '') {
                        sections.push({ content: String(value), rowIndex: index });
                    }
                });
                return sections;
            }
        }
        
        if (dataView.categorical.values && dataView.categorical.values.length > 0) {
            const valueColumn = dataView.categorical.values[0];
            if (valueColumn && valueColumn.values && valueColumn.values.length > 0) {
                const value = valueColumn.values[0];
                if (value != null) {
                    return [{ content: String(value), rowIndex: 0 }];
                }
            }
        }
    }

    return [];
}

/**
 * Extracts tooltip column data from the dataView table.
 * Tooltip columns are all non-markdown columns (identified by role).
 * @param dataView The Power BI dataView
 * @returns Array of TooltipColumnData
 */
export function extractTooltipColumns(dataView: DataView): TooltipColumnData[] {
    if (!dataView?.table?.columns || !dataView?.table?.rows) {
        return [];
    }

    const markdownColIndices = new Set(getMarkdownColumnIndices(dataView));
    const tooltipColumns: TooltipColumnData[] = [];
    for (let colIdx = 0; colIdx < dataView.table.columns.length; colIdx++) {
        if (markdownColIndices.has(colIdx)) continue; // skip markdown columns
        const col = dataView.table.columns[colIdx];
        tooltipColumns.push({
            displayName: col.displayName,
            values: dataView.table.rows.map(row => row[colIdx])
        });
    }
    return tooltipColumns;
}

/**
 * Extracts markdown content from the dataView (concatenated string).
 * Kept for backward compatibility. Internally uses extractMarkdownSections.
 * @param dataView The Power BI dataView
 * @returns The markdown string or empty string if not available
 */
export function extractMarkdownContent(dataView: DataView): string {
    const sections = extractMarkdownSections(dataView);
    if (sections.length === 0) return '';
    return sections.map(s => s.content).join('\n\n---\n\n');
}

/**
 * Power BI's documented maximum length for a single string value passed to a
 * custom visual (2^15 - 1). This is the theoretical ceiling.
 */
export const POWERBI_VALUE_CHAR_LIMIT = 32767;

/**
 * Effective threshold used to detect truncation. In practice Power BI cuts
 * oversized values off a few characters below the theoretical ceiling, so a
 * truncated value never quite reaches POWERBI_VALUE_CHAR_LIMIT. We warn a little
 * under it: any single markdown value this long is either already truncated or
 * right at the danger zone. Raise/lower this if the observed cutoff differs.
 */
export const TRUNCATION_WARN_THRESHOLD = 32700;

/**
 * Detects whether any single markdown value reached Power BI's per-value
 * character limit — a strong indicator that the content was truncated by the
 * Power BI engine before it reached the visual. Checks the raw values (not the
 * formatted output) across the single, table and categorical mappings.
 * @param dataView The Power BI dataView
 * @returns true if at least one raw markdown value is at/above the threshold
 */
export function detectTruncatedContent(dataView: DataView): boolean {
    if (!dataView) return false;

    const reachesLimit = (value: unknown): boolean =>
        value != null && String(value).length >= TRUNCATION_WARN_THRESHOLD;

    // Single value (measure via single mapping)
    if (dataView.single && reachesLimit(dataView.single.value)) {
        return true;
    }

    // Table mapping — check only markdown-role columns
    if (dataView.table?.rows?.length) {
        const markdownColIndices = getMarkdownColumnIndices(dataView);
        for (const row of dataView.table.rows) {
            for (const colIdx of markdownColIndices) {
                if (reachesLimit(row[colIdx])) return true;
            }
        }
    }

    // Categorical mapping — check category and value columns
    if (dataView.categorical) {
        for (const cat of dataView.categorical.categories ?? []) {
            if (cat.values?.some(reachesLimit)) return true;
        }
        for (const val of dataView.categorical.values ?? []) {
            if (val.values?.some(reachesLimit)) return true;
        }
    }

    return false;
}

export function deepClone(object: unknown) {
    return JSON.parse(JSON.stringify(object))
}