
"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export interface IVisualSettings {
    view: ViewSettings;
    mermaid: MermaidSettings;
    mermaidDebug: MermaidDebugSettings;
    font: FontSettings;
    markdown: MarkdownSettings;
}

export class VisualSettings extends DataViewObjectsParser implements IVisualSettings {
    public view: ViewSettings = new ViewSettings();
    public mermaid: MermaidSettings = new MermaidSettings();
    public mermaidDebug: MermaidDebugSettings = new MermaidDebugSettings();
    public font: FontSettings = new FontSettings();
    public markdown: MarkdownSettings = new MarkdownSettings();
}

export class ViewSettings {
    public showDebugPanel: boolean = false;
    public colorMode: string = "light";
}

export class MermaidSettings {
    public flowchartOrientation: string = "default";
    public maxEdges: number = 30000;
    public securityLevel: string = "loose";
}

export class MermaidDebugSettings {
    public htmlLabels: boolean = true;
    public markdownAutoWrap: boolean = true;
    public convertBrToNewline: boolean = true;
    public autoBacktickLabels: boolean = true;
    public preserveLineBreaksCSS: boolean = true;
}

export class FontSettings {
    public fontFamily: string = "DIN";
    public headingFontSize: number = 14;
    public bodyFontSize: number = 9;
    public mermaidFontSize: number = 14;
}

export class MarkdownSettings {
    public enableLineBreaks: boolean = true;
    public codeBlockWordWrap: boolean = true;
}
