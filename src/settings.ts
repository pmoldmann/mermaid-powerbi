
"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export interface IVisualSettings {
    view: ViewSettings;
    mermaid: MermaidSettings;
    mermaidDebug: MermaidDebugSettings;
    font: FontSettings;
    markdown: MarkdownSettings;
    markdownFunctions: MarkdownFunctionsSettings;
    interactivity: InteractivitySettings;
}

export class VisualSettings extends DataViewObjectsParser implements IVisualSettings {
    public view: ViewSettings = new ViewSettings();
    public mermaid: MermaidSettings = new MermaidSettings();
    public mermaidDebug: MermaidDebugSettings = new MermaidDebugSettings();
    public font: FontSettings = new FontSettings();
    public markdown: MarkdownSettings = new MarkdownSettings();
    public markdownFunctions: MarkdownFunctionsSettings = new MarkdownFunctionsSettings();
    public interactivity: InteractivitySettings = new InteractivitySettings();
}

export class ViewSettings {
    public colorMode: string = "light";
    public enableCopyMenu: boolean = false;
}

export class MermaidSettings {
    public flowchartOrientation: string = "default";
    public maxEdges: number = 30000;
    public securityLevel: string = "loose";
}

export class MermaidDebugSettings {
    public showDebugPanel: boolean = false;
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

export class MarkdownFunctionsSettings {
    public definitionHeadingLevel: string = "none";
    public blankText: string = "(blank)";
    public listHeadingLevel: string = "h4";
}

export class InteractivitySettings {
    public enableCrossFilter: boolean = false;
}
