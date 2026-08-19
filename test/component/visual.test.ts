import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { createMermaidMock } from '../mocks/mermaid';
import { singleDataView, tableDataView } from '../fixtures/dataView';
import {
    createMockHost,
    createVisualConstructorOptions,
    createVisualUpdateOptions,
    type MockHost,
} from '../mocks/powerbi';
import type powerbiVisualsApi from 'powerbi-visuals-api';

vi.mock('mermaid', () => createMermaidMock());
vi.mock('@mermaid-js/layout-elk', () => ({ default: {} }));

/** Matches src/stubs — VisualUpdateType is a const enum, inlined in the real build. */
const UPDATE_TYPE = { Data: 2, Resize: 4, ResizeEnd: 32 };

let Visual: typeof import('../../src/visual').Visual;

type FormattingCard = powerbiVisualsApi.visuals.FormattingCard;
type FormattingGroup = powerbiVisualsApi.visuals.FormattingGroup;
type SimpleVisualFormattingSlice = powerbiVisualsApi.visuals.SimpleVisualFormattingSlice;

/** The model never contains placeholders, so narrow the union once here. */
function cardsOf(model: powerbiVisualsApi.visuals.FormattingModel): FormattingCard[] {
    return model.cards as FormattingCard[];
}

/**
 * src/visual.ts dispatches into the module-level store from src/redux/store.ts,
 * which the real visual keeps for its lifetime. Resetting the registry gives
 * each test a clean store.
 */
beforeEach(async () => {
    vi.resetModules();
    // This file drives the real Visual class, which owns its own React root via
    // createRoot() — it is not mounted through Testing Library, so React's
    // act() environment does not apply. Assertions wait via waitFor instead.
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
    ({ Visual } = await import('../../src/visual'));
});

afterEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

function newVisual(host: MockHost = createMockHost()) {
    const options = createVisualConstructorOptions(host);
    return { visual: new Visual(options), host, element: options.element };
}

describe('Visual — construction', () => {
    it('mounts into the target element', async () => {
        const { element } = newVisual();
        // React 19 renders the root asynchronously
        await waitFor(() => expect(element.childElementCount).toBeGreaterThan(0));
    });

    it('creates a selection manager and routes window.open through the host', () => {
        const { host } = newVisual();
        expect(host.createSelectionManager).toHaveBeenCalled();

        window.open('https://example.test');
        expect(host.launchUrl).toHaveBeenCalledWith('https://example.test');
    });

    it('survives a host without localization support', () => {
        expect(() => newVisual(createMockHost({ localizationUnavailable: true }))).not.toThrow();
    });

    it('suppresses the browser context menu on the target element', () => {
        const { element } = newVisual();
        const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
        element.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
    });
});

describe('Visual — update', () => {
    it('reports rendering started and finished for a table dataView', () => {
        const { visual, host } = newVisual();
        const dv = tableDataView([{ displayName: 'Doc' }], [['# One'], ['# Two']]);

        visual.update(createVisualUpdateOptions(dv));

        expect(host.eventService.renderingStarted).toHaveBeenCalledTimes(1);
        expect(host.eventService.renderingFinished).toHaveBeenCalledTimes(1);
        expect(host.eventService.renderingFailed).not.toHaveBeenCalled();
    });

    it('builds one selection id per section in column mode', () => {
        const { visual, host } = newVisual();
        const dv = tableDataView([{ displayName: 'Doc' }], [['# One'], ['# Two'], ['# Three']]);

        visual.update(createVisualUpdateOptions(dv));

        expect(host.createSelectionIdBuilder).toHaveBeenCalledTimes(3);
    });

    it('builds no selection ids in measure mode (several markdown columns)', () => {
        const { visual, host } = newVisual();
        const dv = tableDataView([{ displayName: 'A' }, { displayName: 'B' }], [['# One', '# Two']]);

        visual.update(createVisualUpdateOptions(dv));

        expect(host.createSelectionIdBuilder).not.toHaveBeenCalled();
        expect(host.eventService.renderingFinished).toHaveBeenCalled();
    });

    it('handles an update without any dataView', () => {
        const { visual, host } = newVisual();

        visual.update(createVisualUpdateOptions(null));

        expect(host.eventService.renderingFinished).toHaveBeenCalledTimes(1);
        expect(host.eventService.renderingFailed).not.toHaveBeenCalled();
    });

    it('handles the single-value mapping', () => {
        const { visual, host } = newVisual();

        visual.update(createVisualUpdateOptions(singleDataView('# Hello')));

        expect(host.eventService.renderingFinished).toHaveBeenCalledTimes(1);
    });

    it('tolerates a table dataView without column metadata', () => {
        const { visual, host } = newVisual();
        const partial = { table: { rows: [['x']] } } as never;

        expect(() => visual.update(createVisualUpdateOptions(partial))).not.toThrow();
        expect(host.eventService.renderingFinished).toHaveBeenCalledTimes(1);
    });

    it('reports renderingFailed instead of throwing when the update blows up', () => {
        const { visual, host } = newVisual();
        const options = createVisualUpdateOptions(tableDataView([{ displayName: 'Doc' }], [['x']]));
        // deepClone() is JSON-based, so a cyclic viewport makes update() throw
        const cyclic: Record<string, unknown> = { width: 800, height: 600 };
        cyclic.self = cyclic;
        (options as unknown as { viewport: unknown }).viewport = cyclic;

        expect(() => visual.update(options)).not.toThrow();
        expect(host.eventService.renderingFailed).toHaveBeenCalledTimes(1);
        expect(host.eventService.renderingFinished).not.toHaveBeenCalled();
    });

    it('skips the expensive re-extraction on a pure resize', () => {
        const { visual, host } = newVisual();
        const dv = tableDataView([{ displayName: 'Doc' }], [['# One'], ['# Two']]);

        visual.update(createVisualUpdateOptions(dv, { type: UPDATE_TYPE.Data }));
        expect(host.createSelectionIdBuilder).toHaveBeenCalledTimes(2);

        (host.createSelectionIdBuilder as unknown as { mockClear: () => void }).mockClear();
        visual.update(createVisualUpdateOptions(dv, { type: UPDATE_TYPE.ResizeEnd, width: 400 }));

        expect(host.createSelectionIdBuilder).not.toHaveBeenCalled();
        expect(host.eventService.renderingFinished).toHaveBeenCalledTimes(2);
    });

    it('does not skip the first update even when it is flagged as a resize', () => {
        const { visual, host } = newVisual();
        const dv = tableDataView([{ displayName: 'Doc' }], [['# One']]);

        visual.update(createVisualUpdateOptions(dv, { type: UPDATE_TYPE.Resize }));

        expect(host.createSelectionIdBuilder).toHaveBeenCalledTimes(1);
    });

    it('picks up settings from the dataView metadata', () => {
        const { visual } = newVisual();
        const dv = tableDataView([{ displayName: 'Doc' }], [['# One']]);
        dv.metadata.objects = { view: { colorMode: 'dark' } } as never;

        visual.update(createVisualUpdateOptions(dv));

        const viewCard = cardsOf(visual.getFormattingModel()).find(c => c.uid === 'view')!;
        const slices = (viewCard.groups as FormattingGroup[])[0].slices as SimpleVisualFormattingSlice[];
        const colorMode = slices.find(s => s.uid === 'view-colorMode');
        expect(colorMode!.control.properties.value).toBe('dark');
    });
});

describe('Visual — formatting model', () => {
    it('returns the visual-level cards before any update', () => {
        const { visual } = newVisual();
        expect(cardsOf(visual.getFormattingModel()).map(c => c.uid)).toContain('view');
    });

    it('adds the per-column card once data is bound', () => {
        const { visual } = newVisual();
        visual.update(createVisualUpdateOptions(tableDataView([{ displayName: 'Doc' }], [['x']])));
        expect(cardsOf(visual.getFormattingModel()).map(c => c.uid)).toContain('measureFormat');
    });
});

describe('Visual — enumerateObjectInstances', () => {
    it('returns one measureFormat instance per markdown column', () => {
        const { visual } = newVisual();
        visual.update(createVisualUpdateOptions(tableDataView(
            [{ displayName: 'Doc', formatFunction: 'code_block', codeLanguage: 'dax' }, { displayName: 'Sales', markdown: false }],
            [['x', 1]]
        )));

        const result = visual.enumerateObjectInstances({ objectName: 'measureFormat' } as never);
        const instances = (result as { instances: { displayName: string; properties: Record<string, unknown> }[] }).instances;

        expect(instances).toHaveLength(1);
        expect(instances[0].displayName).toBe('Doc');
        expect(instances[0].properties).toMatchObject({ formatFunction: 'code_block', codeLanguage: 'dax' });
    });

    it('omits the code language property for non-code formats', () => {
        const { visual } = newVisual();
        visual.update(createVisualUpdateOptions(tableDataView(
            [{ displayName: 'Doc', formatFunction: 'heading_h1' }], [['x']]
        )));

        const result = visual.enumerateObjectInstances({ objectName: 'measureFormat' } as never);
        const instances = (result as { instances: { properties: Record<string, unknown> }[] }).instances;
        expect(instances[0].properties).not.toHaveProperty('codeLanguage');
        expect(instances[0].properties).not.toHaveProperty('listDelimiter');
    });

    it('hides the theme colours until they are enabled', () => {
        const { visual } = newVisual();
        visual.update(createVisualUpdateOptions(tableDataView([{ displayName: 'Doc' }], [['x']])));

        const off = visual.enumerateObjectInstances({ objectName: 'mermaidThemeVars' } as never);
        expect((off as { properties: Record<string, unknown> }[])[0].properties).not.toHaveProperty('primaryColor');

        const dv = tableDataView([{ displayName: 'Doc' }], [['x']]);
        dv.metadata.objects = { mermaidThemeVars: { enableThemeColors: true } } as never;
        visual.update(createVisualUpdateOptions(dv));

        const on = visual.enumerateObjectInstances({ objectName: 'mermaidThemeVars' } as never);
        expect((on as { properties: Record<string, unknown> }[])[0].properties).toHaveProperty('primaryColor');
    });
});

describe('Visual — destroy', () => {
    it('unmounts without throwing', () => {
        const { visual } = newVisual();
        visual.update(createVisualUpdateOptions(singleDataView('# One')));
        expect(() => visual.destroy()).not.toThrow();
    });
});
