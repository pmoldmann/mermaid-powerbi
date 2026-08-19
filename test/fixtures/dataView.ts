import type powerbiVisualsApi from 'powerbi-visuals-api';

type DataView = powerbiVisualsApi.DataView;
type DataViewMetadataColumn = powerbiVisualsApi.DataViewMetadataColumn;
type PrimitiveValue = powerbiVisualsApi.PrimitiveValue;

/**
 * Column description for the table builder. Keeps the noisy parts of a real
 * DataViewMetadataColumn (queryName, index, roles, per-column objects) out of
 * the individual tests.
 */
export interface ColumnSpec {
    displayName: string;
    /** Defaults to true — set false to make it a tooltip column. */
    markdown?: boolean;
    /** Per-column `measureFormat` settings, as set in the format pane. */
    formatFunction?: string;
    codeLanguage?: string;
    listDelimiter?: string;
    /** Power BI format string, used by definition-list value formatting. */
    format?: string;
    /** Marks the column as a measure rather than a grouping column. */
    isMeasure?: boolean;
}

function toMetadataColumn(spec: ColumnSpec, index: number): DataViewMetadataColumn {
    const roles = spec.markdown === false ? { tooltips: true } : { markdown: true };

    const measureFormat: Record<string, unknown> = {};
    if (spec.formatFunction !== undefined) measureFormat.formatFunction = spec.formatFunction;
    if (spec.codeLanguage !== undefined) measureFormat.codeLanguage = spec.codeLanguage;
    if (spec.listDelimiter !== undefined) measureFormat.listDelimiter = spec.listDelimiter;

    const column: DataViewMetadataColumn = {
        displayName: spec.displayName,
        queryName: `t.${spec.displayName}`,
        index,
        roles,
        isMeasure: spec.isMeasure ?? false,
    };
    if (spec.format) column.format = spec.format;
    if (Object.keys(measureFormat).length > 0) {
        column.objects = { measureFormat } as DataViewMetadataColumn['objects'];
    }
    return column;
}

/**
 * Builds a table-mapped DataView — the mapping the visual actually declares in
 * capabilities.json.
 */
export function tableDataView(
    columns: (ColumnSpec | string)[],
    rows: PrimitiveValue[][]
): DataView {
    const specs = columns.map(c => (typeof c === 'string' ? { displayName: c } : c));
    const metadataColumns = specs.map(toMetadataColumn);
    return {
        metadata: { columns: metadataColumns },
        table: {
            columns: metadataColumns,
            rows: rows as powerbiVisualsApi.DataViewTableRow[],
        },
    } as DataView;
}

/** Builds a DataView with columns that carry no `roles` metadata at all. */
export function tableDataViewWithoutRoles(
    displayNames: string[],
    rows: PrimitiveValue[][]
): DataView {
    const metadataColumns = displayNames.map((displayName, index) => ({
        displayName,
        queryName: `t.${displayName}`,
        index,
    })) as DataViewMetadataColumn[];
    return {
        metadata: { columns: metadataColumns },
        table: {
            columns: metadataColumns,
            rows: rows as powerbiVisualsApi.DataViewTableRow[],
        },
    } as DataView;
}

/** Builds a single-value DataView (measure dropped on the visual alone). */
export function singleDataView(value: PrimitiveValue): DataView {
    return {
        metadata: { columns: [] },
        single: { value },
    } as DataView;
}

/** Builds a categorical DataView — the legacy mapping still handled by utils.ts. */
export function categoricalDataView(
    categoryValues?: PrimitiveValue[],
    measureValues?: PrimitiveValue[]
): DataView {
    const categorical: Record<string, unknown> = {};
    if (categoryValues) {
        categorical.categories = [{
            source: { displayName: 'Category', queryName: 'c.Category', index: 0 },
            values: categoryValues,
            identity: [],
        }];
    }
    if (measureValues) {
        categorical.values = Object.assign(
            [{
                source: { displayName: 'Measure', queryName: 'm.Measure', index: 0, isMeasure: true },
                values: measureValues,
            }],
            { grouped: () => [] }
        );
    }
    return {
        metadata: { columns: [] },
        categorical,
    } as unknown as DataView;
}

/** A string of exactly `length` characters — for the truncation threshold tests. */
export function stringOfLength(length: number): string {
    return 'x'.repeat(length);
}
