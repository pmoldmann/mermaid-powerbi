import { describe, it, expect } from 'vitest';
import { VisualSettings } from '../../src/settings';
import { tableDataView } from '../fixtures/dataView';
import type powerbiVisualsApi from 'powerbi-visuals-api';

/**
 * These defaults are what every existing report renders with. Changing one
 * silently changes how already-published reports look, so they are pinned
 * explicitly rather than snapshotted.
 */
describe('VisualSettings.getDefault', () => {
    const defaults = VisualSettings.getDefault() as VisualSettings;

    it('exposes all eight settings objects', () => {
        expect(Object.keys(defaults).sort()).toEqual([
            'font',
            'interactivity',
            'markdown',
            'markdownFunctions',
            'mermaid',
            'mermaidDebug',
            'mermaidThemeVars',
            'view',
        ]);
    });

    it('pins the view defaults', () => {
        expect(defaults.view).toEqual({
            colorMode: 'light',
            enableCopyMenu: false,
            deduplicateValues: false,
            useSearchBar: false,
            allowCustomStyles: false,
        });
    });

    it('pins the mermaid defaults', () => {
        expect(defaults.mermaid).toEqual({
            layout: 'default',
            elkNodePlacement: 'default',
            elkMergeEdges: 'default',
            flowchartOrientation: 'default',
            maxEdges: 30000,
            securityLevel: 'strict',
        });
    });

    it('keeps securityLevel at "strict" — relaxing it would break certification', () => {
        expect(defaults.mermaid.securityLevel).toBe('strict');
    });

    it('pins the markdown, font and interactivity defaults', () => {
        expect(defaults.markdown).toEqual({ enableLineBreaks: true, codeBlockWordWrap: true });
        expect(defaults.font).toEqual({
            fontFamily: 'DIN',
            headingFontSize: 14,
            bodyFontSize: 9,
            mermaidFontSize: 10,
        });
        expect(defaults.interactivity).toEqual({ enableCrossFilter: false });
    });

    it('pins the markdownFunctions defaults', () => {
        expect(defaults.markdownFunctions).toEqual({
            definitionHeadingLevel: 'h3',
            blankText: '(blank)',
            listHeadingLevel: 'h3',
            blockquoteAddHeader: true,
            blockquoteHeaderFormat: 'h3',
            codeBlockAddHeader: true,
            codeBlockHeaderFormat: 'h3',
        });
    });

    it('pins the mermaid theme variable defaults with empty colors', () => {
        expect(defaults.mermaidThemeVars.look).toBe('default');
        expect(defaults.mermaidThemeVars.baseTheme).toBe('auto');
        expect(defaults.mermaidThemeVars.enableThemeColors).toBe(false);
        expect(defaults.mermaidThemeVars.primaryColor).toEqual({ solid: { color: '' } });
    });

    it('returns a fresh object on every call', () => {
        const a = VisualSettings.getDefault() as VisualSettings;
        const b = VisualSettings.getDefault() as VisualSettings;
        a.view.colorMode = 'dark';
        expect(b.view.colorMode).toBe('light');
    });
});

describe('VisualSettings.parse', () => {
    function dataViewWithObjects(objects: Record<string, Record<string, unknown>>) {
        const dv = tableDataView([{ displayName: 'Doc' }], [['x']]);
        dv.metadata.objects = objects as powerbiVisualsApi.DataViewObjects;
        return dv;
    }

    it('takes over values set in the format pane', () => {
        const settings = VisualSettings.parse(dataViewWithObjects({
            view: { colorMode: 'dark', useSearchBar: true },
            mermaid: { maxEdges: 500 },
        })) as VisualSettings;

        expect(settings.view.colorMode).toBe('dark');
        expect(settings.view.useSearchBar).toBe(true);
        expect(settings.mermaid.maxEdges).toBe(500);
    });

    it('keeps defaults for properties that were never set', () => {
        const settings = VisualSettings.parse(dataViewWithObjects({
            view: { colorMode: 'dark' },
        })) as VisualSettings;

        expect(settings.view.enableCopyMenu).toBe(false);
        expect(settings.mermaid.securityLevel).toBe('strict');
        expect(settings.markdownFunctions.blankText).toBe('(blank)');
    });

    it('returns pure defaults for a dataView without objects', () => {
        const settings = VisualSettings.parse(
            tableDataView([{ displayName: 'Doc' }], [['x']])
        ) as VisualSettings;
        expect(settings.view.colorMode).toBe('light');
        expect(settings.font.bodyFontSize).toBe(9);
    });
});
