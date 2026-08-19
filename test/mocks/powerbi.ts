import { vi } from 'vitest';
import type powerbiVisualsApi from 'powerbi-visuals-api';

type IVisualHost = powerbiVisualsApi.extensibility.visual.IVisualHost;
type ISelectionManager = powerbiVisualsApi.extensibility.ISelectionManager;
type ISelectionId = powerbiVisualsApi.visuals.ISelectionId;

export interface MockSelectionManager extends ISelectionManager {
    select: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    showContextMenu: ReturnType<typeof vi.fn>;
    getSelectionIds: ReturnType<typeof vi.fn>;
    registerOnSelectCallback: ReturnType<typeof vi.fn>;
    hasSelection: ReturnType<typeof vi.fn>;
}

export function createMockSelectionManager(): MockSelectionManager {
    return {
        // The real manager resolves with the ids that ended up selected;
        // Application.tsx uses that result to set its dim/select classes.
        select: vi.fn(async (id: ISelectionId) => [id]),
        clear: vi.fn().mockResolvedValue(undefined),
        showContextMenu: vi.fn().mockResolvedValue(undefined),
        getSelectionIds: vi.fn().mockReturnValue([]),
        registerOnSelectCallback: vi.fn(),
        hasSelection: vi.fn().mockReturnValue(false),
        applySelectionFilter: vi.fn(),
        toggleExpandCollapse: vi.fn(),
    } as unknown as MockSelectionManager;
}

/**
 * A selection id builder that records the (table, rowIndex) pairs it was given
 * so tests can assert that cross-filtering selected the right row.
 */
function createSelectionIdBuilder() {
    let rowIndex = -1;
    const builder = {
        withTable(_table: unknown, index: number) {
            rowIndex = index;
            return builder;
        },
        withCategory() { return builder; },
        withSeries() { return builder; },
        withMeasure() { return builder; },
        withMatrixNode() { return builder; },
        createSelectionId(): ISelectionId {
            return { __rowIndex: rowIndex, key: `row-${rowIndex}` } as unknown as ISelectionId;
        },
    };
    return builder;
}

export interface MockHost extends IVisualHost {
    launchUrl: ReturnType<typeof vi.fn>;
    tooltipService: {
        enabled: ReturnType<typeof vi.fn>;
        show: ReturnType<typeof vi.fn>;
        move: ReturnType<typeof vi.fn>;
        hide: ReturnType<typeof vi.fn>;
    };
    eventService: {
        renderingStarted: ReturnType<typeof vi.fn>;
        renderingFinished: ReturnType<typeof vi.fn>;
        renderingFailed: ReturnType<typeof vi.fn>;
    };
}

export interface MockHostOptions {
    isHighContrast?: boolean;
    selectionManager?: ISelectionManager;
    /** Make createLocalizationManager throw, as it does in developer visual mode. */
    localizationUnavailable?: boolean;
}

export function createMockHost(options: MockHostOptions = {}): MockHost {
    const selectionManager = options.selectionManager ?? createMockSelectionManager();

    return {
        createSelectionManager: vi.fn().mockReturnValue(selectionManager),
        createSelectionIdBuilder: vi.fn(createSelectionIdBuilder),
        createLocalizationManager: vi.fn(() => {
            if (options.localizationUnavailable) throw new Error('not available');
            return { getDisplayName: (key: string) => key };
        }),
        launchUrl: vi.fn(),
        colorPalette: {
            isHighContrast: options.isHighContrast ?? false,
            foreground: { value: '#000000' },
            background: { value: '#ffffff' },
        },
        tooltipService: {
            enabled: vi.fn().mockReturnValue(true),
            show: vi.fn(),
            move: vi.fn(),
            hide: vi.fn(),
        },
        eventService: {
            renderingStarted: vi.fn(),
            renderingFinished: vi.fn(),
            renderingFailed: vi.fn(),
        },
        locale: 'en-US',
        applyJsonFilter: vi.fn(),
        persistProperties: vi.fn(),
        refreshHostData: vi.fn(),
    } as unknown as MockHost;
}

/** Constructor options for `new Visual(...)`. */
export function createVisualConstructorOptions(host?: MockHost) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    return {
        element,
        host: host ?? createMockHost(),
    } as unknown as powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;
}

/** Update options for `visual.update(...)`. */
export function createVisualUpdateOptions(
    dataView: powerbiVisualsApi.DataView | null,
    overrides: { type?: number; width?: number; height?: number } = {}
) {
    return {
        dataViews: dataView ? [dataView] : [],
        type: overrides.type ?? 2 /* VisualUpdateType.Data */,
        viewport: { width: overrides.width ?? 800, height: overrides.height ?? 600 },
        jsonFilters: [],
        operationKind: 0,
    } as unknown as powerbiVisualsApi.extensibility.visual.VisualUpdateOptions;
}
