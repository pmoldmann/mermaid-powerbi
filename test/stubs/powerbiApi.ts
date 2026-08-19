/**
 * Runtime stub for `powerbi-visuals-api`.
 *
 * In the packaged visual this module is a webpack external mapped to the global
 * `powerbi` object that the Power BI host provides. Under Vitest there is no
 * host, and the npm package's own entry point only exports `version`/`schemas`.
 *
 * Almost everything the source imports from it (`DataView`,
 * `VisualConstructorOptions`, …) is type-only and erased at compile time. The
 * exception is `VisualUpdateType`, a TypeScript `const enum`: ts-loader inlines
 * its numeric literals in the real build, esbuild cannot, so the values must
 * exist at runtime here. See src/visual.ts:122.
 */

export const VisualUpdateType = {
    Data: 1 << 1,          // 2
    Resize: 1 << 2,        // 4
    ViewMode: 1 << 3,      // 8
    Style: 1 << 4,         // 16
    ResizeEnd: 1 << 5,     // 32
    FormattingSubSelectionChange: 1 << 6,
    FormatModeChange: 1 << 7,
    FilterOptionsChange: 1 << 8,
    All: (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4) | (1 << 5) | (1 << 6) | (1 << 7) | (1 << 8),
} as const;

export const ViewMode = { View: 0, Edit: 1, InFocusEdit: 2 } as const;
export const EditMode = { Default: 0, Advanced: 1 } as const;
export const VisualDataRoleKind = { Grouping: 0, Measure: 1, GroupingOrMeasure: 2 } as const;

const known: Record<string, unknown> = {
    VisualUpdateType,
    ViewMode,
    EditMode,
    VisualDataRoleKind,
    version: '5.11.0',
};

/**
 * Any other member access (`powerbiVisualsApi.extensibility.visual.…`) resolves
 * to a further proxy instead of throwing. esbuild keeps `import X = ns.Y`
 * statements it cannot prove to be type-only, so those chains are evaluated at
 * module load even though the values are never used.
 */
const deepStub: unknown = new Proxy(function () { /* callable stub */ }, {
    get(_target, prop: string | symbol) {
        if (prop in known) return known[prop as string];
        if (prop === Symbol.toPrimitive || prop === 'toString') return () => 'powerbi-visuals-api-stub';
        if (prop === '__esModule') return true;
        if (prop === 'default') return deepStub;
        return deepStub;
    },
    apply() {
        return deepStub;
    },
});

export default deepStub as never;
