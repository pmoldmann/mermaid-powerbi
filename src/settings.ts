
"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export interface IVisualSettings {
    view: ViewSettings;
}

export class VisualSettings extends DataViewObjectsParser implements IVisualSettings {
    public view: ViewSettings = new ViewSettings();
}

export class ViewSettings {
    public showEmptyMessage: boolean = true;
    public showDebugPanel: boolean = false;
}
