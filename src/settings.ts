
"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export interface IVisualSettings {
    view: ViewSettings;
    mermaid: MermaidSettings;
    mermaidDebug: MermaidDebugSettings;
    mermaidThemeVars: MermaidThemeVariablesSettings;
    font: FontSettings;
    markdown: MarkdownSettings;
    markdownFunctions: MarkdownFunctionsSettings;
    interactivity: InteractivitySettings;
}

export class VisualSettings extends DataViewObjectsParser implements IVisualSettings {
    public view: ViewSettings = new ViewSettings();
    public mermaid: MermaidSettings = new MermaidSettings();
    public mermaidDebug: MermaidDebugSettings = new MermaidDebugSettings();
    public mermaidThemeVars: MermaidThemeVariablesSettings = new MermaidThemeVariablesSettings();
    public font: FontSettings = new FontSettings();
    public markdown: MarkdownSettings = new MarkdownSettings();
    public markdownFunctions: MarkdownFunctionsSettings = new MarkdownFunctionsSettings();
    public interactivity: InteractivitySettings = new InteractivitySettings();
}

export class ViewSettings {
    public colorMode: string = "light";
    public enableCopyMenu: boolean = false;
    public deduplicateValues: boolean = false;
    public useSearchBar: boolean = false;
    public allowCustomStyles: boolean = false;
}

export class MermaidSettings {
    public layout: string = "default";
    public elkNodePlacement: string = "default";
    public elkMergeEdges: string = "default";
    public flowchartOrientation: string = "default";
    public maxEdges: number = 30000;
    public securityLevel: string = "strict";
}

export class MermaidDebugSettings {
    public showDebugPanel: boolean = false;
    public markdownAutoWrap: boolean = true;
    public convertBrToNewline: boolean = true;
    public autoBacktickLabels: boolean = true;
    public preserveLineBreaksCSS: boolean = true;
}

export class FontSettings {
    public fontFamily: string = "DIN";
    public headingFontSize: number = 14;
    public bodyFontSize: number = 9;
    public mermaidFontSize: number = 10;
}

export class MarkdownSettings {
    public enableLineBreaks: boolean = true;
    public codeBlockWordWrap: boolean = true;
}

export class MarkdownFunctionsSettings {
    public definitionHeadingLevel: string = "h3";
    public blankText: string = "(blank)";
    public listHeadingLevel: string = "h3";
    public blockquoteAddHeader: boolean = true;
    public blockquoteHeaderFormat: string = "h3";
    public codeBlockAddHeader: boolean = true;
    public codeBlockHeaderFormat: string = "h3";
}

export class InteractivitySettings {
    public enableCrossFilter: boolean = false;
}

export class MermaidThemeVariablesSettings {
    public look: string = "default";
    public baseTheme: string = "auto";
    public enableThemeColors: boolean = false;
    public primaryColor: { solid: { color: string } } = { solid: { color: "" } };
    public background: { solid: { color: string } } = { solid: { color: "" } };
    public noteBkgColor: { solid: { color: string } } = { solid: { color: "" } };
    public noteTextColor: { solid: { color: string } } = { solid: { color: "" } };
}
