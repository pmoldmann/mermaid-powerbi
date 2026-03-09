import powerbiVisualsApi from "powerbi-visuals-api";
import DataView = powerbiVisualsApi.DataView;

import dompurify from "dompurify";

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
 * Extracts markdown sections from the dataView, preserving row indices.
 * Each section corresponds to one row in the data source.
 * @param dataView The Power BI dataView
 * @returns Array of MarkdownSection with content and rowIndex
 */
export function extractMarkdownSections(dataView: DataView): MarkdownSection[] {
    if (!dataView) {
        return [];
    }

    // Try single value first (measure) - via single mapping
    if (dataView.single && dataView.single.value != null) {
        return [{ content: String(dataView.single.value), rowIndex: 0 }];
    }

    // Try table mapping (primary mapping)
    if (dataView.table && dataView.table.rows && dataView.table.rows.length > 0) {
        const sections: MarkdownSection[] = [];
        dataView.table.rows.forEach((row, index) => {
            const value = row[0];
            if (value != null && String(value).trim() !== '') {
                sections.push({ content: String(value), rowIndex: index });
            }
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
 * Tooltip columns are any columns beyond the first (markdown) column.
 * @param dataView The Power BI dataView
 * @returns Array of TooltipColumnData
 */
export function extractTooltipColumns(dataView: DataView): TooltipColumnData[] {
    if (!dataView?.table?.columns || !dataView?.table?.rows) {
        return [];
    }

    const tooltipColumns: TooltipColumnData[] = [];
    // Columns beyond index 0 (the markdown column) are tooltip columns
    for (let colIdx = 1; colIdx < dataView.table.columns.length; colIdx++) {
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