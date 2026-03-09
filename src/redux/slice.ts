import powerbiVisualsApi from "powerbi-visuals-api";
import DataView = powerbiVisualsApi.DataView;
import IVisualHost = powerbiVisualsApi.extensibility.visual.IVisualHost;
import IViewport = powerbiVisualsApi.IViewport;
import ISelectionManager = powerbiVisualsApi.extensibility.ISelectionManager;
import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { IVisualSettings, VisualSettings } from "../settings";
import { extractMarkdownContent, extractMarkdownSections, MarkdownSection, TooltipColumnData } from "../utils";

export interface VisualState {
    host: IVisualHost;
    settings: IVisualSettings;
    dataView: DataView;
    viewport: IViewport;
    markdownContent: string;
    markdownSections: MarkdownSection[];
    selectionManager: ISelectionManager;
    selectionIds: ISelectionId[];
    tooltipColumns: TooltipColumnData[];
}

export interface RowDataPayload {
    sections: MarkdownSection[];
    selectionIds: ISelectionId[];
    tooltipColumns: TooltipColumnData[];
}

const initialState: VisualState = {
    host: undefined,
    settings: VisualSettings.getDefault() as VisualSettings,
    dataView: null,
    viewport: {
        height: 0,
        width: 0
    },
    markdownContent: '',
    markdownSections: [],
    selectionManager: undefined,
    selectionIds: [],
    tooltipColumns: []
}

export const slice = createSlice({
    name: 'options',
    initialState,
    reducers: {
        setHost: (state, action: PayloadAction<IVisualHost>) => {
            state.host = action.payload
        },
        setSelectionManager: (state, action: PayloadAction<ISelectionManager>) => {
            state.selectionManager = action.payload
        },
        setViewport: (state, action: PayloadAction<IViewport>) => {
            state.viewport = action.payload
        },
        setDataView: (state, action: PayloadAction<DataView | null>) => {
            state.dataView = action.payload;
            // Extract content or clear if dataView is null/undefined
            state.markdownContent = action.payload ? extractMarkdownContent(action.payload) : '';
            state.markdownSections = action.payload ? extractMarkdownSections(action.payload) : [];
        },
        setRowData: (state, action: PayloadAction<RowDataPayload>) => {
            state.markdownSections = action.payload.sections;
            state.selectionIds = action.payload.selectionIds;
            state.tooltipColumns = action.payload.tooltipColumns;
        },
        setSettings: (state, action: PayloadAction<IVisualSettings>) => {
            state.settings = action.payload;
        }
    },
})

// Action creators are generated for each case reducer function
export const { setHost, setSelectionManager, setDataView, setRowData, setSettings, setViewport } = slice.actions

export default slice.reducer