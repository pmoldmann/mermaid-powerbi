import { Visual } from "../src/visual";
import powerbiVisualsApi from "powerbi-visuals-api";
import IVisualPlugin = powerbiVisualsApi.visuals.plugins.IVisualPlugin;
import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;
import DialogConstructorOptions = powerbiVisualsApi.extensibility.visual.DialogConstructorOptions;
var powerbiKey: string = "powerbi";
var powerbi: Record<string, unknown> = (window as unknown as Record<string, Record<string, unknown>>)[powerbiKey];
var markdownMermaidRenderer: IVisualPlugin = {
    name: 'markdownMermaidRenderer',
    displayName: 'Markdown / Mermaid Renderer',
    class: 'Visual',
    apiVersion: '5.11.0',
    create: (options?: VisualConstructorOptions) => {
        if (Visual) {
            return new Visual(options);
        }
        throw 'Visual instance not found';
    },
    createModalDialog: (dialogId: string, options: DialogConstructorOptions, initialState: object) => {
        const dialogRegistry = (globalThis as unknown as { dialogRegistry: Record<string, new (options: DialogConstructorOptions, initialState: object) => void> }).dialogRegistry;
        if (dialogId in dialogRegistry) {
            new dialogRegistry[dialogId](options, initialState);
        }
    },
    custom: true
};
if (typeof powerbi !== "undefined") {
    powerbi.visuals = powerbi.visuals || {};
    powerbi.visuals.plugins = powerbi.visuals.plugins || {};
    powerbi.visuals.plugins["markdownMermaidRenderer"] = markdownMermaidRenderer;
}
export default markdownMermaidRenderer;