/**
 * Syntax highlighting for Markdown code fences.
 *
 * `@uiw/react-md-editor`'s default entry point pulls in `rehype-prism-plus` backed by
 * `refractor/all` — every one of Prism's ~290 language definitions, roughly 9 MB of
 * JavaScript that Power BI has to download and parse on every report load. The visual
 * only ever needs a handful of languages.
 *
 * So the editor is imported from `@uiw/react-md-editor/nohighlight` instead, and this
 * module builds a dedicated Refractor instance from the language-less core with only
 * the languages listed below. The resulting rehype plugin is passed explicitly to
 * every `MDEditor.Markdown` (see Application.tsx and DemoSection.tsx).
 *
 * Language modules register their own dependencies (e.g. `typescript` pulls in
 * `javascript`, `csharp` pulls in `clike`), so only the languages meant to be usable
 * as a fence info string need to be listed.
 *
 * refractor and rehype-prism-plus are ESM-only; `require` is used so the project's
 * "moduleResolution": "node" tsconfig setting does not have to resolve their
 * `exports` maps (webpack does that at build time).
 */

import type { Pluggable, Plugin } from 'unified';

const { refractor } = require('refractor/core') as { refractor: RefractorInstance };

interface RefractorInstance {
    register: (syntax: LanguageSyntax) => void;
}

interface LanguageSyntax {
    (Prism: RefractorInstance): void;
    displayName: string;
    aliases?: string[];
}

type LanguageModule = { default?: LanguageSyntax } & LanguageSyntax;

// Languages available in ```<language> code fences. DAX and Power Query (M) are the
// reason this list is hand-picked rather than refractor's "common" bundle: both are
// central to Power BI documentation but are not part of that bundle.
const languages: unknown[] = [
    require('refractor/markup'),      // html, xml, svg
    require('refractor/css'),
    require('refractor/javascript'),  // aliases: js
    require('refractor/typescript'),  // aliases: ts
    require('refractor/jsx'),
    require('refractor/tsx'),
    require('refractor/json'),
    require('refractor/yaml'),
    require('refractor/markdown'),    // aliases: md
    require('refractor/python'),      // aliases: py
    require('refractor/sql'),
    require('refractor/bash'),        // aliases: sh, shell
    require('refractor/powershell'),
    require('refractor/csharp'),      // aliases: cs, dotnet
    require('refractor/dax'),
    require('refractor/powerquery'),  // aliases: pq, mscript
];

for (const language of languages) {
    const mod = language as LanguageModule;
    refractor.register((mod.default || mod) as LanguageSyntax);
}

const rehypePrismGenerator = (() => {
    const mod = require('rehype-prism-plus/generator') as {
        default?: (instance: RefractorInstance) => unknown;
    } & ((instance: RefractorInstance) => unknown);
    return mod.default || mod;
})();

const createPlugin = rehypePrismGenerator(refractor) as Plugin<[PrismOptions?]>;

interface PrismOptions {
    ignoreMissing?: boolean;
    showLineNumbers?: boolean;
}

/**
 * rehype plugin for the Markdown pipeline.
 *
 * `ignoreMissing` is required: without it, a fence tagged with a language that is not
 * in the list above throws and aborts rendering of the whole Markdown document.
 * With it, the block is rendered unhighlighted.
 */
export const rehypePrism: Pluggable = [createPlugin, { ignoreMissing: true }];
