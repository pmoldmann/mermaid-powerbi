import powerbiVisualsApi from "powerbi-visuals-api";
import DataView = powerbiVisualsApi.DataView;
import IVisualHost = powerbiVisualsApi.extensibility.visual.IVisualHost;
import IViewport = powerbiVisualsApi.IViewport;

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { IVisualSettings, VisualSettings } from "../settings";
import { extractMarkdownContent } from "../utils";

export interface VisualState {
    host: IVisualHost;
    settings: IVisualSettings;
    dataView: DataView;
    viewport: IViewport;
    markdownContent: string;
}

const initialState: VisualState = {
    host: undefined,
    settings: VisualSettings.getDefault() as VisualSettings,
    dataView: null,
    viewport: {
        height: 0,
        width: 0
    },
    markdownContent: ''
}

export const slice = createSlice({
    name: 'options',
    initialState,
    reducers: {
        setHost: (state, action: PayloadAction<IVisualHost>) => {
            state.host = action.payload
        },
        setViewport: (state, action: PayloadAction<IViewport>) => {
            state.viewport = action.payload
        },
        setDataView: (state, action: PayloadAction<DataView | null>) => {
            state.dataView = action.payload;
            // Extract content or clear if dataView is null/undefined
            state.markdownContent = action.payload ? extractMarkdownContent(action.payload) : '';
        },
        setSettings: (state, action: PayloadAction<IVisualSettings>) => {
            state.settings = action.payload;
        }
    },
})

// Action creators are generated for each case reducer function
export const { setHost, setDataView, setSettings, setViewport } = slice.actions

export default slice.reducer