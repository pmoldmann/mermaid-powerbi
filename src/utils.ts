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
 * Extracts markdown content from the dataView.
 * Supports both single value (measure) and categorical (column) data.
 * When a column is provided, all values are concatenated with separators.
 * @param dataView The Power BI dataView
 * @returns The markdown string or empty string if not available
 */
export function extractMarkdownContent(dataView: DataView): string {
    if (!dataView) {
        return '';
    }

    // Try single value first (measure) - via single mapping
    if (dataView.single && dataView.single.value != null) {
        return String(dataView.single.value);
    }

    // Try categorical mapping
    if (dataView.categorical) {
        // Check for column data in categories
        if (dataView.categorical.categories && dataView.categorical.categories.length > 0) {
            const category = dataView.categorical.categories[0];
            if (category && category.values && category.values.length > 0) {
                // Concatenate all values with a horizontal rule separator
                const markdownParts = category.values
                    .filter(value => value != null && String(value).trim() !== '')
                    .map(value => String(value));
                
                return markdownParts.join('\n\n---\n\n');
            }
        }
        
        // Check for measure data in values (measure appears in categorical.values)
        if (dataView.categorical.values && dataView.categorical.values.length > 0) {
            const valueColumn = dataView.categorical.values[0];
            if (valueColumn && valueColumn.values && valueColumn.values.length > 0) {
                // For measures, typically just one value
                const value = valueColumn.values[0];
                if (value != null) {
                    return String(value);
                }
            }
        }
    }

    return '';
}

export function deepClone(object: unknown) {
    return JSON.parse(JSON.stringify(object))
}