import React from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type powerbiVisualsApi from 'powerbi-visuals-api';

import optionsReducer, {
    setDataView,
    setHost,
    setRowData,
    setSelectionManager,
    setSettings,
    setHighContrast,
    setViewport,
} from '../../src/redux/slice';
import { Application } from '../../src/Application';
import { VisualSettings } from '../../src/settings';
import { extractMarkdownSections, extractTooltipColumns } from '../../src/utils';
import { createMockHost, createMockSelectionManager, type MockHost, type MockSelectionManager } from '../mocks/powerbi';

type DataView = powerbiVisualsApi.DataView;
type ISelectionId = powerbiVisualsApi.visuals.ISelectionId;

/**
 * A fresh store per test. src/redux/store.ts exports a module-level singleton
 * that the real visual reuses for its lifetime; sharing it across tests would
 * leak state between them.
 */
export function createTestStore() {
    return configureStore({
        reducer: { options: optionsReducer },
        middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
    });
}

export interface RenderAppOptions {
    dataView?: DataView | null;
    /** Mutated copy of the defaults — see VisualSettings.getDefault(). */
    settings?: (settings: VisualSettings) => void;
    host?: MockHost;
    selectionManager?: MockSelectionManager;
    isHighContrast?: boolean;
    viewport?: { width: number; height: number };
    /** Build selection ids for the extracted sections. Defaults to true in column mode. */
    withSelectionIds?: boolean;
}

export interface RenderAppResult extends RenderResult {
    store: ReturnType<typeof createTestStore>;
    host: MockHost;
    selectionManager: MockSelectionManager;
}

/**
 * Renders <Application/> through the same dispatch sequence that
 * src/visual.ts runs in update(), so component tests exercise the real path
 * from DataView to DOM.
 */
export function renderApp(options: RenderAppOptions = {}): RenderAppResult {
    const store = createTestStore();
    const selectionManager = options.selectionManager ?? createMockSelectionManager();
    const host = options.host ?? createMockHost({
        selectionManager,
        isHighContrast: options.isHighContrast,
    });

    const settings = VisualSettings.getDefault() as VisualSettings;
    options.settings?.(settings);

    store.dispatch(setHost(host));
    store.dispatch(setSelectionManager(selectionManager));
    store.dispatch(setSettings(settings));
    store.dispatch(setHighContrast(options.isHighContrast ?? false));
    store.dispatch(setDataView(options.dataView ?? null));
    store.dispatch(setViewport(options.viewport ?? { width: 800, height: 600 }));

    const dataView = options.dataView;
    if (dataView) {
        const sections = extractMarkdownSections(
            dataView,
            settings.markdownFunctions,
            settings.view.deduplicateValues
        );
        const tooltipColumns = dataView.table ? extractTooltipColumns(dataView) : [];
        const wantIds = options.withSelectionIds ?? true;
        const selectionIds: ISelectionId[] = wantIds
            ? sections.map(s => ({ key: `row-${s.rowIndex}`, __rowIndex: s.rowIndex } as unknown as ISelectionId))
            : [];
        store.dispatch(setRowData({ sections, selectionIds, tooltipColumns }));
    }

    const result = render(
        <Provider store={store}>
            <Application />
        </Provider>
    );

    return Object.assign(result, { store, host, selectionManager });
}
