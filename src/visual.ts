"use strict";

import React from 'react';
import { Root, createRoot } from 'react-dom/client';
import { Application } from './Application';

import "../style/visual.scss";
import powerbiVisualsApi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbiVisualsApi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbiVisualsApi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbiVisualsApi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbiVisualsApi.VisualObjectInstance;
import DataView = powerbiVisualsApi.DataView;
import VisualObjectInstanceEnumerationObject = powerbiVisualsApi.VisualObjectInstanceEnumerationObject;
import IVisualHost = powerbiVisualsApi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbiVisualsApi.extensibility.ISelectionManager;
import IVisualEventService = powerbiVisualsApi.extensibility.IVisualEventService;

import { MermaidThemeVariablesSettings, VisualSettings } from "./settings";
import { buildFormattingModel } from "./FormattingModel";

import { Provider } from 'react-redux';
import { store } from "./redux/store";
import { setDataView, setHost, setRowData, setSelectionManager, setSettings, setViewport, setHighContrast } from './redux/slice';
import { deepClone, extractMarkdownSections, extractTooltipColumns, getMarkdownColumnIndices } from './utils';


export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private host: IVisualHost;
    private selectionManager: ISelectionManager;
    private events: IVisualEventService;
    private root: Root;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
        this.settings = VisualSettings.getDefault() as VisualSettings;
        this.events = options.host.eventService;

        // Create selection manager for cross-filtering and context menu
        this.selectionManager = this.host.createSelectionManager();

        window.open = (url?: string | URL) => {
            if (typeof url === "string") {
                this.host.launchUrl(url);
            }
            return window;
        };

        store.dispatch(setHost(options.host));
        store.dispatch(setSelectionManager(this.selectionManager));

        // Prevent the browser default context menu on the visual element.
        // The React-based handleContextMenu in Application.tsx decides whether
        // to show the custom copy-markdown menu or the native Power BI menu
        // based on the enableCopyMenu setting.
        this.target.addEventListener('contextmenu', (event: MouseEvent) => {
            event.preventDefault();
        });

        if (document) {
            const reactApplication = React.createElement(Application, {
                key: "root",
            });
            const provider = React.createElement(Provider, {
                store: store,
                key: 'provider',
                children: []
            }, [
                reactApplication
            ]);
            this.root = createRoot(this.target);
            this.root.render(provider);
        }
    }

    public update(options: VisualUpdateOptions) {
        this.events.renderingStarted(options);
        try {
        const dataView = options && options.dataViews && options.dataViews[0];
        // supportsEmptyDataView ensures Power BI always provides a dataView
        // (with metadata.objects) even when no data roles are filled.
        if (dataView) {
            this.settings = Visual.parseSettings(dataView);
        }
        store.dispatch(setSettings(this.settings));
        store.dispatch(setHighContrast((this.host.colorPalette as { isHighContrast?: boolean })?.isHighContrast ?? false));
        // Always dispatch dataView - null/undefined will clear the content and show welcome page
        store.dispatch(setDataView(dataView ? deepClone(dataView) : null));
        store.dispatch(setViewport(deepClone(options.viewport)));

        // Build selectionIds and row data for interactivity
        if (dataView?.table?.rows) {
            const sections = extractMarkdownSections(dataView, this.settings.markdownFunctions, this.settings.view.deduplicateValues);
            const tooltipColumns = extractTooltipColumns(dataView);

            // Only create selectionIds in column mode (single markdown column).
            // In measure mode (multiple markdown columns), row-based cross-filtering
            // is not meaningful — each measure value shares the same row.
            const markdownColCount = getMarkdownColumnIndices(dataView).length;
            if (markdownColCount <= 1) {
                const selectionIds = sections.map(section => {
                    return this.host.createSelectionIdBuilder()
                        .withTable(dataView.table, section.rowIndex)
                        .createSelectionId();
                });
                store.dispatch(setRowData({ sections, selectionIds, tooltipColumns }));
            } else {
                // Measure mode — no cross-filtering
                store.dispatch(setRowData({ sections, selectionIds: [], tooltipColumns }));
            }
        } else {
            // Single/measure mode or no data — extract sections but no selectionIds
            const sections = dataView ? extractMarkdownSections(dataView, this.settings.markdownFunctions, this.settings.view?.deduplicateValues) : [];
            store.dispatch(setRowData({ sections, selectionIds: [], tooltipColumns: [] }));
        }
        this.events.renderingFinished(options);
        } catch (error) {
            this.events.renderingFailed(options, String(error));
        }
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return VisualSettings.parse(dataView);
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        // Per-measure formatting: return one instance per markdown column
        if (options.objectName === 'measureFormat') {
            const dataView = store.getState().options.dataView;
            const instances: VisualObjectInstance[] = [];
            if (dataView?.table?.columns) {
                const mdCols = dataView.table.columns.filter(
                    (col: powerbiVisualsApi.DataViewMetadataColumn) => col.roles?.['markdown']
                );
                // Show formatting options for all markdown columns/measures
                mdCols.forEach((col: powerbiVisualsApi.DataViewMetadataColumn) => {
                    const formatFunction = (col.objects?.measureFormat?.formatFunction as string) || 'none';
                    const props: Record<string, unknown> = { formatFunction };
                    // Only show codeLanguage property when code_block is selected
                    if (formatFunction === 'code_block') {
                        props.codeLanguage = (col.objects?.measureFormat?.codeLanguage as string) || '';
                    }
                    // Only show listDelimiter property when a list format is selected
                    if (formatFunction === 'list_unordered' || formatFunction === 'list_ordered') {
                        props.listDelimiter = (col.objects?.measureFormat?.listDelimiter as string) || ',';
                    }
                    instances.push({
                        objectName: 'measureFormat',
                        displayName: col.displayName,
                        selector: { metadata: col.queryName },
                        properties: props
                    });
                });
            }
            return { instances };
        }
        // mermaidThemeVars: conditional properties — show colors only when custom colors are enabled
        if (options.objectName === 'mermaidThemeVars') {
            const themeVars: MermaidThemeVariablesSettings = this.settings?.mermaidThemeVars ?? new MermaidThemeVariablesSettings();
            const baseTheme = typeof themeVars.baseTheme === 'string' && themeVars.baseTheme.trim() !== ''
                ? themeVars.baseTheme
                : 'auto';
            const enableThemeColors = typeof themeVars.enableThemeColors === 'boolean'
                ? themeVars.enableThemeColors
                : false;
            const look = typeof themeVars.look === 'string' && themeVars.look.trim() !== ''
                ? themeVars.look
                : 'default';
            const props: Record<string, unknown> = {
                look,
                baseTheme,
                enableThemeColors,
            };
            if (enableThemeColors) {
                props.primaryColor = themeVars.primaryColor;
                props.background = themeVars.background;
                props.noteBkgColor = themeVars.noteBkgColor;
                props.noteTextColor = themeVars.noteTextColor;
            }
            return [{ objectName: 'mermaidThemeVars', selector: null, properties: props }];
        }
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }

    public getFormattingModel(): powerbiVisualsApi.visuals.FormattingModel {
        return buildFormattingModel(this.settings, store.getState().options.dataView);
    }
}

