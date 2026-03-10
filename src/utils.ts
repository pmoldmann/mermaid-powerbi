import powerbiVisualsApi from "powerbi-visuals-api";
import DataView = powerbiVisualsApi.DataView;

import dompurify from "dompurify";
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
    listHeadingLevel?: string
): string {
    switch (formatFunction) {
        case 'heading_h1':
            return `# ${content}`;
        case 'heading_h2':
            return `## ${content}`;
        case 'heading_h3':
            return `### ${content}`;
        case 'code_block':
            return `\`\`\`${codeLanguage}\n${content}\n\`\`\``;
        case 'highlight':
            return `==${content}==`;
        case 'definition_list': {
            const prefix = headingPrefix(definitionHeadingLevel || 'none');
            if (prefix) {
                // Heading + paragraph: definition list syntax (: ) is incompatible with headings
                return `${prefix}${displayName || 'Term'}\n\n${content}`;
            }
            return `${displayName || 'Term'}\n: ${content}`;
        }
        case 'blockquote': {
            const quoted = content.split('\n').map(line => `> ${line}`).join('\n');
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
export function extractMarkdownSections(dataView: DataView, markdownFunctions?: MarkdownFunctionsSettings): MarkdownSection[] {
    if (!dataView) {
        return [];
    }

    const defHeading = markdownFunctions?.definitionHeadingLevel || 'none';
    const listHeading = markdownFunctions?.listHeadingLevel || 'h4';
    const blankText = markdownFunctions?.blankText || '(blank)';

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

        // For list columns with multiple rows, aggregate all row values into a single list
        // (each row becomes one list item, no delimiter splitting).
        // Collect which columns need aggregation so we can skip them in the per-row loop.
        const aggregatedCols = new Set<number>();

        if (isMultiRow) {
            markdownColIndices.forEach(colIdx => {
                const col = dataView.table.columns[colIdx];
                const { formatFunction } = getMeasureFormatFromColumn(col);

                if (formatFunction === 'list_unordered' || formatFunction === 'list_ordered') {
                    aggregatedCols.add(colIdx);

                    // Collect all non-empty row values for this column
                    const items: string[] = [];
                    rows.forEach(row => {
                        const value = row[colIdx];
                        if (value != null && String(value).trim() !== '') {
                            items.push(String(value).trim());
                        }
                    });

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

                // For definition_list format, render null/empty values with the blank text placeholder
                if (formatFunction === 'definition_list' && (value == null || String(value).trim() === '')) {
                    const content = applyMeasureFormat(blankText, formatFunction, codeLanguage, col.displayName, listDelimiter, defHeading, listHeading);
                    sections.push({ content, rowIndex });
                    return;
                }

                if (value != null && String(value).trim() !== '') {
                    let content = String(value);
                    // Apply per-column/measure formatting (works for both single and multiple columns)
                    content = applyMeasureFormat(content, formatFunction, codeLanguage, col.displayName, listDelimiter, defHeading, listHeading);
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

export function deepClone(object: unknown) {
    return JSON.parse(JSON.stringify(object))
}