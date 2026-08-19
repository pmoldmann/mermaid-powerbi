import { describe, it, expect } from 'vitest';
import reducer, {
    setDataView,
    setRowData,
    setSettings,
    setViewport,
    setHighContrast,
} from '../../src/redux/slice';
import { VisualSettings } from '../../src/settings';
import { singleDataView, stringOfLength, tableDataView } from '../fixtures/dataView';

function initialState() {
    return reducer(undefined, { type: '@@INIT' });
}

describe('options slice', () => {
    it('starts empty with default settings', () => {
        const state = initialState();
        expect(state.dataView).toBeNull();
        expect(state.markdownContent).toBe('');
        expect(state.markdownSections).toEqual([]);
        expect(state.contentTruncated).toBe(false);
        expect(state.settings.view.colorMode).toBe('light');
    });

    describe('setDataView', () => {
        it('derives content, sections and the truncation flag', () => {
            const dv = tableDataView([{ displayName: 'Doc' }], [['first'], ['second']]);
            const state = reducer(initialState(), setDataView(dv));

            expect(state.dataView).toBe(dv);
            expect(state.markdownSections).toEqual([
                { content: 'first', rowIndex: 0 },
                { content: 'second', rowIndex: 1 },
            ]);
            expect(state.markdownContent).toBe('first\n\n---\n\nsecond');
            expect(state.contentTruncated).toBe(false);
        });

        it('flags truncated content', () => {
            const dv = tableDataView(
                [{ displayName: 'Doc' }],
                [[stringOfLength(32700)]]
            );
            expect(reducer(initialState(), setDataView(dv)).contentTruncated).toBe(true);
        });

        it('clears the derived state when the dataView is null', () => {
            const filled = reducer(initialState(), setDataView(singleDataView('content')));
            expect(filled.markdownContent).toBe('content');

            const cleared = reducer(filled, setDataView(null));
            expect(cleared.dataView).toBeNull();
            expect(cleared.markdownContent).toBe('');
            expect(cleared.markdownSections).toEqual([]);
            expect(cleared.contentTruncated).toBe(false);
        });
    });

    describe('setRowData', () => {
        it('replaces sections, selection ids and tooltip columns', () => {
            const before = reducer(
                initialState(),
                setDataView(tableDataView([{ displayName: 'Doc' }], [['old']]))
            );
            const state = reducer(before, setRowData({
                sections: [{ content: 'new', rowIndex: 3 }],
                selectionIds: [{ key: 'row-3' } as never],
                tooltipColumns: [{ displayName: 'Sales', values: [1] }],
            }));

            expect(state.markdownSections).toEqual([{ content: 'new', rowIndex: 3 }]);
            expect(state.selectionIds).toHaveLength(1);
            expect(state.tooltipColumns).toEqual([{ displayName: 'Sales', values: [1] }]);
            // markdownContent is derived by setDataView only and stays untouched
            expect(state.markdownContent).toBe('old');
        });
    });

    it('setSettings replaces the settings object', () => {
        const settings = VisualSettings.getDefault() as VisualSettings;
        settings.view.colorMode = 'dark';
        expect(reducer(initialState(), setSettings(settings)).settings.view.colorMode).toBe('dark');
    });

    it('setViewport stores the viewport', () => {
        const state = reducer(initialState(), setViewport({ width: 640, height: 480 }));
        expect(state.viewport).toEqual({ width: 640, height: 480 });
    });

    it('setHighContrast toggles the flag', () => {
        expect(reducer(initialState(), setHighContrast(true)).isHighContrast).toBe(true);
    });
});
