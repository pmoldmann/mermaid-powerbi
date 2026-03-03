
"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export interface IVisualSettings {
    view: ViewSettings;
    mermaid: MermaidSettings;
    font: FontSettings;
}

export class VisualSettings extends DataViewObjectsParser implements IVisualSettings {
    public view: ViewSettings = new ViewSettings();
    public mermaid: MermaidSettings = new MermaidSettings();
    public font: FontSettings = new FontSettings();
}

export class ViewSettings {
    public showDebugPanel: boolean = false;
    public colorMode: string = "light";
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

export class FontSettings {
    public fontFamily: string = "Segoe UI";
    public headingFontSize: number = 20;
    public bodyFontSize: number = 11;
    public mermaidFontSize: number = 14;
}
