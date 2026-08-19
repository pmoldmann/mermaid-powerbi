import { describe, it, expect } from 'vitest';
import { buildFormattingModel } from '../../src/FormattingModel';
import { VisualSettings } from '../../src/settings';
import { tableDataView } from '../fixtures/dataView';
import capabilities from '../../capabilities.json';
import type powerbiVisualsApi from 'powerbi-visuals-api';

type FormattingModel = powerbiVisualsApi.visuals.FormattingModel;
type FormattingCard = powerbiVisualsApi.visuals.FormattingCard;
type FormattingGroup = powerbiVisualsApi.visuals.FormattingGroup;
type SimpleVisualFormattingSlice = powerbiVisualsApi.visuals.SimpleVisualFormattingSlice;

function defaults() {
    return VisualSettings.getDefault() as VisualSettings;
}

/** The model never contains placeholders, so narrow the union once here. */
function cardsOf(model: FormattingModel): FormattingCard[] {
    return model.cards as FormattingCard[];
}

function cardByUid(cards: FormattingCard[], uid: string): FormattingCard | undefined {
    return cards.find(c => c.uid === uid);
}

function slicesOf(card: FormattingCard): SimpleVisualFormattingSlice[] {
    return (card.groups as FormattingGroup[]).flatMap(g => g.slices as SimpleVisualFormattingSlice[]);
}

describe('buildFormattingModel', () => {
    it('builds the eight visual-level cards in order', () => {
        const model = buildFormattingModel(defaults(), null);
        expect(cardsOf(model).map(c => c.uid)).toEqual([
            'view',
            'mermaid',
            'mermaidThemeVars',
            'mermaidDebug',
            'markdown',
            'interactivity',
            'markdownFunctions',
            'font',
        ]);
    });

    it('gives every card a display name, a group and at least one slice', () => {
        const model = buildFormattingModel(defaults(), null);
        for (const card of cardsOf(model)) {
            expect(card.displayName, `card ${card.uid}`).toBeTruthy();
            expect(card.groups.length, `card ${card.uid}`).toBeGreaterThan(0);
            expect(slicesOf(card).length, `card ${card.uid}`).toBeGreaterThan(0);
        }
    });

    it('gives every slice a unique uid', () => {
        const model = buildFormattingModel(
            defaults(),
            tableDataView([{ displayName: 'Doc' }, { displayName: 'Note' }], [['a', 'b']])
        );
        const uids = cardsOf(model).flatMap(c => slicesOf(c).map(s => s.uid));
        expect(new Set(uids).size).toBe(uids.length);
    });

    it('reflects the current setting values in the slices', () => {
        const settings = defaults();
        settings.view.colorMode = 'dark';
        settings.font.bodyFontSize = 21;

        const model = buildFormattingModel(settings, null);
        const viewSlices = slicesOf(cardByUid(cardsOf(model), 'view')!);
        const colorMode = viewSlices.find(s => s.uid === 'view-colorMode');
        expect(colorMode?.control.properties.value).toBe('dark');

        const fontSlices = slicesOf(cardByUid(cardsOf(model), 'font')!);
        expect(fontSlices.find(s => s.uid === 'font-bodyFontSize')?.control.properties.value).toBe(21);
    });

    describe('mermaidThemeVars colour pickers', () => {
        it('are hidden while enableThemeColors is off', () => {
            const model = buildFormattingModel(defaults(), null);
            const uids = slicesOf(cardByUid(cardsOf(model), 'mermaidThemeVars')!).map(s => s.uid);
            expect(uids).toEqual([
                'mermaidThemeVars-look',
                'mermaidThemeVars-baseTheme',
                'mermaidThemeVars-enableThemeColors',
            ]);
        });

        it('appear once enableThemeColors is on', () => {
            const settings = defaults();
            settings.mermaidThemeVars.enableThemeColors = true;
            settings.mermaidThemeVars.primaryColor = { solid: { color: '#ff0000' } };

            const slices = slicesOf(cardByUid(cardsOf(buildFormattingModel(settings, null)), 'mermaidThemeVars')!);
            expect(slices.map(s => s.uid)).toContain('mermaidThemeVars-primaryColor');
            expect(slices.find(s => s.uid === 'mermaidThemeVars-primaryColor')?.control.properties.value)
                .toEqual({ value: '#ff0000' });
        });

        it('accepts a plain colour string, as DataViewObjectsParser produces it', () => {
            const settings = defaults();
            settings.mermaidThemeVars.enableThemeColors = true;
            settings.mermaidThemeVars.background = '#123456' as never;

            const slices = slicesOf(cardByUid(cardsOf(buildFormattingModel(settings, null)), 'mermaidThemeVars')!);
            expect(slices.find(s => s.uid === 'mermaidThemeVars-background')?.control.properties.value)
                .toEqual({ value: '#123456' });
        });
    });

    describe('per-column "Content formatting" card', () => {
        it('is absent without a dataView', () => {
            expect(cardByUid(cardsOf(buildFormattingModel(defaults(), null)), 'measureFormat')).toBeUndefined();
        });

        it('is absent when no column carries the markdown role', () => {
            const dv = tableDataView([{ displayName: 'Sales', markdown: false }], [[1]]);
            expect(cardByUid(cardsOf(buildFormattingModel(defaults(), dv)), 'measureFormat')).toBeUndefined();
        });

        it('adds one group per markdown column and skips tooltip columns', () => {
            const dv = tableDataView(
                [{ displayName: 'Doc' }, { displayName: 'Note' }, { displayName: 'Sales', markdown: false }],
                [['a', 'b', 1]]
            );
            const card = cardByUid(cardsOf(buildFormattingModel(defaults(), dv)), 'measureFormat')!;
            expect((card.groups as FormattingGroup[]).map(g => g.displayName)).toEqual(['Doc', 'Note']);
        });

        it('shows only the format dropdown for the default "none" format', () => {
            const dv = tableDataView([{ displayName: 'Doc' }], [['a']]);
            const card = cardByUid(cardsOf(buildFormattingModel(defaults(), dv)), 'measureFormat')!;
            expect(slicesOf(card)).toHaveLength(1);
            expect(slicesOf(card)[0].control.properties.value).toBe('none');
        });

        it('adds the code language input for code_block columns', () => {
            const dv = tableDataView(
                [{ displayName: 'Doc', formatFunction: 'code_block', codeLanguage: 'dax' }],
                [['a']]
            );
            const card = cardByUid(cardsOf(buildFormattingModel(defaults(), dv)), 'measureFormat')!;
            const codeSlice = slicesOf(card).find(s => s.uid.startsWith('measureFormat-codeLanguage'));
            expect(codeSlice?.control.properties.value).toBe('dax');
        });

        it('adds the delimiter input for list columns', () => {
            const dv = tableDataView(
                [{ displayName: 'Doc', formatFunction: 'list_ordered', listDelimiter: ';' }],
                [['a']]
            );
            const card = cardByUid(cardsOf(buildFormattingModel(defaults(), dv)), 'measureFormat')!;
            const delimSlice = slicesOf(card).find(s => s.uid.startsWith('measureFormat-listDelimiter'));
            expect(delimSlice?.control.properties.value).toBe(';');
        });
    });

    it('uses the localization manager when one is available', () => {
        const model = buildFormattingModel(defaults(), null, {
            getDisplayName: (key: string) => `LOC:${key}`,
        } as never);
        expect(cardByUid(cardsOf(model), 'view')?.displayName).toBe('LOC:view_DisplayName');
    });

    it('falls back to English when the localization manager throws', () => {
        const model = buildFormattingModel(defaults(), null, {
            getDisplayName: () => { throw new Error('unavailable'); },
        } as never);
        expect(cardByUid(cardsOf(model), 'view')?.displayName).toBe('View settings');
    });
});

/**
 * A descriptor that names an object or property missing from capabilities.json
 * is silently ignored by the Power BI service — the format pane control simply
 * stops working. That failure never surfaces locally, so it is asserted here.
 */
describe('formatting model matches capabilities.json', () => {
    const dv = tableDataView(
        [{ displayName: 'Doc', formatFunction: 'code_block' }, { displayName: 'Steps', formatFunction: 'list_ordered' }],
        [['a', 'b']]
    );
    const settings = defaults();
    settings.mermaidThemeVars.enableThemeColors = true;
    const model = buildFormattingModel(settings, dv);

    const declaredObjects = capabilities.objects as Record<string, { properties: Record<string, unknown> }>;

    function allDescriptors() {
        const out: { objectName: string; propertyName: string }[] = [];
        for (const card of cardsOf(model)) {
            for (const d of card.revertToDefaultDescriptors ?? []) {
                out.push({ objectName: d.objectName, propertyName: d.propertyName });
            }
            for (const slice of slicesOf(card)) {
                const d = slice.control.properties.descriptor;
                out.push({ objectName: d.objectName, propertyName: d.propertyName });
            }
        }
        return out;
    }

    it('references only objects declared in capabilities.json', () => {
        const unknownObjects = [...new Set(allDescriptors().map(d => d.objectName))]
            .filter(name => !(name in declaredObjects));
        expect(unknownObjects).toEqual([]);
    });

    it('references only properties declared in capabilities.json', () => {
        const unknownProperties = allDescriptors()
            .filter(d => declaredObjects[d.objectName] && !(d.propertyName in declaredObjects[d.objectName].properties))
            .map(d => `${d.objectName}.${d.propertyName}`);
        expect([...new Set(unknownProperties)]).toEqual([]);
    });

    it('surfaces every property of the visual-level objects in the format pane', () => {
        // measureFormat is per-column and only partially shown (conditional slices),
        // so it is exempt from the completeness check.
        const shown = new Set(allDescriptors().map(d => `${d.objectName}.${d.propertyName}`));
        const missing: string[] = [];
        for (const [objectName, object] of Object.entries(declaredObjects)) {
            if (objectName === 'measureFormat') continue;
            for (const propertyName of Object.keys(object.properties)) {
                if (!shown.has(`${objectName}.${propertyName}`)) missing.push(`${objectName}.${propertyName}`);
            }
        }
        expect(missing).toEqual([]);
    });
});
