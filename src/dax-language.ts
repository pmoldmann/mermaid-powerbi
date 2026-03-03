/**
 * Registers DAX and Power Query (M) language definitions for syntax highlighting.
 * 
 * Refractor (Prism) ships with built-in definitions for both languages,
 * but they are not included in the "common" bundle. This module explicitly
 * registers them so that ```dax and ```powerquery / ```pq / ```mscript
 * code blocks in Markdown are syntax-highlighted.
 * 
 * This module must be imported before any Markdown rendering occurs.
 */

// refractor is an ESM-only module; use require for compatibility with
// the project's "moduleResolution": "node" tsconfig setting.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { refractor } = require('refractor');

// Built-in language definitions from refractor
// Using the package exports pattern: refractor/<name> maps to refractor/lang/<name>.js
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dax = require('refractor/dax');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const powerquery = require('refractor/powerquery');

interface RefractorInstance {
    register: (syntax: LanguageSyntax) => void;
}

interface LanguageSyntax {
    (Prism: RefractorInstance): void;
    displayName: string;
    aliases?: string[];
}

// Register DAX: enables ```dax code fences
// Highlights functions, keywords (VAR, RETURN, DEFINE, EVALUATE),
// table/column references ('Table'[Column]), strings, comments, operators
(refractor as RefractorInstance).register((dax.default || dax) as LanguageSyntax);

// Register Power Query (M): enables ```powerquery, ```pq, ```mscript code fences
// Highlights keywords (let, in, each, if, then, else, etc.),
// data types, quoted identifiers (#"..."), constants, functions
(refractor as RefractorInstance).register((powerquery.default || powerquery) as LanguageSyntax);
