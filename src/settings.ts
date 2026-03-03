
"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export interface IVisualSettings {
    view: ViewSettings;
    mermaid: MermaidSettings;
}

export class VisualSettings extends DataViewObjectsParser implements IVisualSettings {
    public view: ViewSettings = new ViewSettings();
    public mermaid: MermaidSettings = new MermaidSettings();
}

export class ViewSettings {
    public showEmptyMessage: boolean = true;
    public showDebugPanel: boolean = false;
    public colorMode: string = "light";
    public paddingTop: number = 8;
    public paddingRight: number = 8;
    public paddingBottom: number = 8;
    public paddingLeft: number = 8;
}

export class MermaidSettings {
    public htmlLabels: boolean = true;
    public markdownAutoWrap: boolean = true;
    public securityLevel: string = "loose";
    public maxEdges: number = 30000;
    public convertBrToNewline: boolean = true;
    public autoBacktickLabels: boolean = true;
    public preserveLineBreaksCSS: boolean = true;
}
