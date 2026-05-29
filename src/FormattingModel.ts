"use strict";

import powerbiVisualsApi from "powerbi-visuals-api";
import DataView = powerbiVisualsApi.DataView;
import FormattingModel = powerbiVisualsApi.visuals.FormattingModel;
import FormattingCard = powerbiVisualsApi.visuals.FormattingCard;
import FormattingGroup = powerbiVisualsApi.visuals.FormattingGroup;
import SimpleVisualFormattingSlice = powerbiVisualsApi.visuals.SimpleVisualFormattingSlice;
import FormattingDescriptor = powerbiVisualsApi.visuals.FormattingDescriptor;
import EnumMemberValue = powerbiVisualsApi.EnumMemberValue;

import { IVisualSettings } from "./settings";

import ILocalizationManager = powerbiVisualsApi.extensibility.ILocalizationManager;

function loc(mgr: ILocalizationManager | undefined, key: string, fallback: string): string {
    try {
        if (!mgr || typeof mgr.getDisplayName !== 'function') return fallback;
        return mgr.getDisplayName(key) || fallback;
    } catch {
        return fallback;
    }
}

// ---------------------------------------------------------------------------
// Descriptor helpers
// ---------------------------------------------------------------------------

function desc(
    objectName: string,
    propertyName: string,
    selector?: { metadata: string }
): FormattingDescriptor {
    return selector ? { objectName, propertyName, selector } : { objectName, propertyName };
}

// ---------------------------------------------------------------------------
// Slice helpers — each returns a SimpleVisualFormattingSlice
// ---------------------------------------------------------------------------

function toggle(objectName: string, propertyName: string, value: boolean, uidOverride?: string): SimpleVisualFormattingSlice {
    return {
        uid: uidOverride || `${objectName}-${propertyName}`,
        control: {
            type: 'ToggleSwitch',
            properties: { descriptor: desc(objectName, propertyName), value }
        }
    };
}

function dropdown(objectName: string, propertyName: string, value: EnumMemberValue, uidOverride?: string): SimpleVisualFormattingSlice {
    return {
        uid: uidOverride || `${objectName}-${propertyName}`,
        control: {
            type: 'Dropdown',
            properties: { descriptor: desc(objectName, propertyName), value }
        }
    };
}

function numUpDown(objectName: string, propertyName: string, value: number, uidOverride?: string): SimpleVisualFormattingSlice {
    return {
        uid: uidOverride || `${objectName}-${propertyName}`,
        control: {
            type: 'NumUpDown',
            properties: { descriptor: desc(objectName, propertyName), value }
        }
    };
}

function textInput(objectName: string, propertyName: string, value: string, placeholder: string, uidOverride?: string): SimpleVisualFormattingSlice {
    return {
        uid: uidOverride || `${objectName}-${propertyName}`,
        control: {
            type: 'TextInput',
            properties: { descriptor: desc(objectName, propertyName), value, placeholder }
        }
    };
}

function colorPicker(objectName: string, propertyName: string, colorValue: string, uidOverride?: string): SimpleVisualFormattingSlice {
    return {
        uid: uidOverride || `${objectName}-${propertyName}`,
        control: {
            type: 'ColorPicker',
            properties: { descriptor: desc(objectName, propertyName), value: { value: colorValue } }
        }
    };
}

function fontPicker(objectName: string, propertyName: string, value: string, uidOverride?: string): SimpleVisualFormattingSlice {
    return {
        uid: uidOverride || `${objectName}-${propertyName}`,
        control: {
            type: 'FontPicker',
            properties: { descriptor: desc(objectName, propertyName), value }
        }
    };
}

// ---------------------------------------------------------------------------
// Group helper — single unnamed group for a card's slices
// ---------------------------------------------------------------------------

function singleGroup(uid: string, slices: SimpleVisualFormattingSlice[]): FormattingGroup {
    return { uid, displayName: '', suppressDisplayName: true, slices };
}

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------

export function buildFormattingModel(settings: IVisualSettings, dataView: DataView | null, localizationManager?: ILocalizationManager): FormattingModel {
    const cards: FormattingCard[] = [];
    const l = (key: string, fallback: string) => loc(localizationManager, key, fallback);

    // ---- 1. View settings ------------------------------------------------
    cards.push({
        uid: 'view',
        displayName: l('view_DisplayName', 'View settings'),
        revertToDefaultDescriptors: [
            desc('view', 'colorMode'),
            desc('view', 'enableCopyMenu'),
            desc('view', 'deduplicateValues'),
            desc('view', 'useSearchBar'),
            desc('view', 'allowCustomStyles'),
        ],
        groups: [singleGroup('view-group', [
            dropdown('view', 'colorMode', settings.view.colorMode),
            toggle('view', 'enableCopyMenu', settings.view.enableCopyMenu),
            toggle('view', 'deduplicateValues', settings.view.deduplicateValues),
            toggle('view', 'useSearchBar', settings.view.useSearchBar),
            toggle('view', 'allowCustomStyles', settings.view.allowCustomStyles),
        ])]
    });

    // ---- 2. Mermaid settings ---------------------------------------------
    cards.push({
        uid: 'mermaid',
        displayName: l('mermaid_DisplayName', 'Mermaid settings'),
        revertToDefaultDescriptors: [
            desc('mermaid', 'layout'),
            desc('mermaid', 'elkNodePlacement'),
            desc('mermaid', 'elkMergeEdges'),
            desc('mermaid', 'flowchartOrientation'),
            desc('mermaid', 'maxEdges'),
            desc('mermaid', 'securityLevel'),
        ],
        groups: [singleGroup('mermaid-group', [
            dropdown('mermaid', 'layout', settings.mermaid.layout),
            dropdown('mermaid', 'elkNodePlacement', settings.mermaid.elkNodePlacement),
            dropdown('mermaid', 'elkMergeEdges', settings.mermaid.elkMergeEdges),
            dropdown('mermaid', 'flowchartOrientation', settings.mermaid.flowchartOrientation),
            numUpDown('mermaid', 'maxEdges', settings.mermaid.maxEdges),
            dropdown('mermaid', 'securityLevel', settings.mermaid.securityLevel),
        ])]
    });

    // ---- 3. Mermaid theme vars (color pickers only when enableThemeColors) -
    const themeVars = settings.mermaidThemeVars;
    const themeSlices: SimpleVisualFormattingSlice[] = [
        dropdown('mermaidThemeVars', 'look', themeVars.look),
        dropdown('mermaidThemeVars', 'baseTheme', themeVars.baseTheme),
        toggle('mermaidThemeVars', 'enableThemeColors', themeVars.enableThemeColors),
    ];
    if (themeVars.enableThemeColors) {
        themeSlices.push(
            colorPicker('mermaidThemeVars', 'primaryColor', themeVars.primaryColor?.solid?.color || ''),
            colorPicker('mermaidThemeVars', 'background', themeVars.background?.solid?.color || ''),
            colorPicker('mermaidThemeVars', 'noteBkgColor', themeVars.noteBkgColor?.solid?.color || ''),
            colorPicker('mermaidThemeVars', 'noteTextColor', themeVars.noteTextColor?.solid?.color || ''),
        );
    }
    cards.push({
        uid: 'mermaidThemeVars',
        displayName: l('mermaidThemeVars_DisplayName', 'Mermaid theme settings'),
        revertToDefaultDescriptors: [
            desc('mermaidThemeVars', 'look'),
            desc('mermaidThemeVars', 'baseTheme'),
            desc('mermaidThemeVars', 'enableThemeColors'),
            desc('mermaidThemeVars', 'primaryColor'),
            desc('mermaidThemeVars', 'background'),
            desc('mermaidThemeVars', 'noteBkgColor'),
            desc('mermaidThemeVars', 'noteTextColor'),
        ],
        groups: [singleGroup('mermaidThemeVars-group', themeSlices)]
    });

    // ---- 4. Mermaid debug ------------------------------------------------
    cards.push({
        uid: 'mermaidDebug',
        displayName: l('mermaidDebug_DisplayName', 'Mermaid debug settings'),
        revertToDefaultDescriptors: [
            desc('mermaidDebug', 'showDebugPanel'),
            desc('mermaidDebug', 'markdownAutoWrap'),
            desc('mermaidDebug', 'convertBrToNewline'),
            desc('mermaidDebug', 'autoBacktickLabels'),
            desc('mermaidDebug', 'preserveLineBreaksCSS'),
        ],
        groups: [singleGroup('mermaidDebug-group', [
            toggle('mermaidDebug', 'showDebugPanel', settings.mermaidDebug.showDebugPanel),
            toggle('mermaidDebug', 'markdownAutoWrap', settings.mermaidDebug.markdownAutoWrap),
            toggle('mermaidDebug', 'convertBrToNewline', settings.mermaidDebug.convertBrToNewline),
            toggle('mermaidDebug', 'autoBacktickLabels', settings.mermaidDebug.autoBacktickLabels),
            toggle('mermaidDebug', 'preserveLineBreaksCSS', settings.mermaidDebug.preserveLineBreaksCSS),
        ])]
    });

    // ---- 5. Markdown settings --------------------------------------------
    cards.push({
        uid: 'markdown',
        displayName: l('markdown_DisplayName', 'Markdown settings'),
        revertToDefaultDescriptors: [
            desc('markdown', 'enableLineBreaks'),
            desc('markdown', 'codeBlockWordWrap'),
        ],
        groups: [singleGroup('markdown-group', [
            toggle('markdown', 'enableLineBreaks', settings.markdown.enableLineBreaks),
            toggle('markdown', 'codeBlockWordWrap', settings.markdown.codeBlockWordWrap),
        ])]
    });

    // ---- 6. Interactivity ------------------------------------------------
    cards.push({
        uid: 'interactivity',
        displayName: l('interactivity_DisplayName', 'Interactivity'),
        revertToDefaultDescriptors: [
            desc('interactivity', 'enableCrossFilter'),
        ],
        groups: [singleGroup('interactivity-group', [
            toggle('interactivity', 'enableCrossFilter', settings.interactivity.enableCrossFilter),
        ])]
    });

    // ---- 7. Markdown functions -------------------------------------------
    cards.push({
        uid: 'markdownFunctions',
        displayName: l('markdownFunctions_DisplayName', 'Markdown functions'),
        revertToDefaultDescriptors: [
            desc('markdownFunctions', 'definitionHeadingLevel'),
            desc('markdownFunctions', 'blankText'),
            desc('markdownFunctions', 'listHeadingLevel'),
            desc('markdownFunctions', 'blockquoteAddHeader'),
            desc('markdownFunctions', 'blockquoteHeaderFormat'),
            desc('markdownFunctions', 'codeBlockAddHeader'),
            desc('markdownFunctions', 'codeBlockHeaderFormat'),
        ],
        groups: [singleGroup('markdownFunctions-group', [
            dropdown('markdownFunctions', 'definitionHeadingLevel', settings.markdownFunctions.definitionHeadingLevel),
            textInput('markdownFunctions', 'blankText', settings.markdownFunctions.blankText, '(blank)'),
            dropdown('markdownFunctions', 'listHeadingLevel', settings.markdownFunctions.listHeadingLevel),
            toggle('markdownFunctions', 'blockquoteAddHeader', settings.markdownFunctions.blockquoteAddHeader),
            dropdown('markdownFunctions', 'blockquoteHeaderFormat', settings.markdownFunctions.blockquoteHeaderFormat),
            toggle('markdownFunctions', 'codeBlockAddHeader', settings.markdownFunctions.codeBlockAddHeader),
            dropdown('markdownFunctions', 'codeBlockHeaderFormat', settings.markdownFunctions.codeBlockHeaderFormat),
        ])]
    });

    // ---- 8. Font settings ------------------------------------------------
    cards.push({
        uid: 'font',
        displayName: l('font_DisplayName', 'Font settings'),
        revertToDefaultDescriptors: [
            desc('font', 'fontFamily'),
            desc('font', 'headingFontSize'),
            desc('font', 'bodyFontSize'),
            desc('font', 'mermaidFontSize'),
        ],
        groups: [singleGroup('font-group', [
            fontPicker('font', 'fontFamily', settings.font.fontFamily),
            numUpDown('font', 'headingFontSize', settings.font.headingFontSize),
            numUpDown('font', 'bodyFontSize', settings.font.bodyFontSize),
            numUpDown('font', 'mermaidFontSize', settings.font.mermaidFontSize),
        ])]
    });

    // ---- 9. Content formatting (per-measure, one group per column) -------
    if (dataView?.table?.columns) {
        const mdCols = dataView.table.columns.filter(
            col => col.roles?.['markdown']
        );
        if (mdCols.length > 0) {
            const measureGroups: FormattingGroup[] = mdCols.map(col => {
                const selector = { metadata: col.queryName };
                const formatFunction = (col.objects?.measureFormat?.formatFunction as string) || 'none';
                const slices: SimpleVisualFormattingSlice[] = [
                    {
                        uid: `measureFormat-formatFunction-${col.queryName}`,
                        control: {
                            type: 'Dropdown',
                            properties: {
                                descriptor: desc('measureFormat', 'formatFunction', selector),
                                value: formatFunction as EnumMemberValue
                            }
                        }
                    }
                ];
                if (formatFunction === 'code_block') {
                    slices.push({
                        uid: `measureFormat-codeLanguage-${col.queryName}`,
                        control: {
                            type: 'TextInput',
                            properties: {
                                descriptor: desc('measureFormat', 'codeLanguage', selector),
                                value: (col.objects?.measureFormat?.codeLanguage as string) || '',
                                placeholder: 'e.g. json, sql, mermaid'
                            }
                        }
                    });
                }
                if (formatFunction === 'list_unordered' || formatFunction === 'list_ordered') {
                    slices.push({
                        uid: `measureFormat-listDelimiter-${col.queryName}`,
                        control: {
                            type: 'TextInput',
                            properties: {
                                descriptor: desc('measureFormat', 'listDelimiter', selector),
                                value: (col.objects?.measureFormat?.listDelimiter as string) || ',',
                                placeholder: 'e.g. , or ;'
                            }
                        }
                    });
                }
                return {
                    uid: `measureFormat-group-${col.queryName}`,
                    displayName: col.displayName,
                    slices
                };
            });
            const measureRevertDescriptors: FormattingDescriptor[] = mdCols.reduce<FormattingDescriptor[]>((acc, col) => {
                const selector = { metadata: col.queryName };
                acc.push(
                    desc('measureFormat', 'formatFunction', selector),
                    desc('measureFormat', 'codeLanguage', selector),
                    desc('measureFormat', 'listDelimiter', selector),
                );
                return acc;
            }, []);
            cards.push({
                uid: 'measureFormat',
                displayName: l('measureFormat_DisplayName', 'Content formatting'),
                revertToDefaultDescriptors: measureRevertDescriptors,
                groups: measureGroups
            });
        }
    }

    return { cards };
}
