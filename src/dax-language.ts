/**
 * DAX (Data Analysis Expressions) language definition for refractor/Prism.
 * 
 * Registers a custom 'dax' language so that ```dax code blocks in Markdown
 * are syntax-highlighted with proper tokenization of functions, keywords,
 * table/column references, strings, comments, operators, etc.
 * 
 * This module must be imported before any Markdown rendering occurs.
 */

// refractor is an ESM-only module; use require for compatibility with
// the project's "moduleResolution": "node" tsconfig setting.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { refractor } = require('refractor');

interface RefractorInstance {
    languages: Record<string, unknown>;
    register: (syntax: DaxSyntax) => void;
}

interface DaxSyntax {
    (Prism: RefractorInstance): void;
    displayName: string;
    aliases?: string[];
}

const dax: DaxSyntax = function dax(Prism: RefractorInstance) {
    Prism.languages['dax'] = {
        'comment': [
            {
                // Single-line comments: // ...
                pattern: /\/\/.*/,
                greedy: true
            },
            {
                // Multi-line comments: /* ... */
                pattern: /\/\*[\s\S]*?\*\//,
                greedy: true
            },
            {
                // Double-dash single-line comments: -- ...
                pattern: /--.*/,
                greedy: true
            }
        ],
        'string': {
            // DAX strings use double quotes: "Hello World"
            pattern: /"(?:[^"\\]|\\.)*"/,
            greedy: true
        },
        'table-reference': {
            // Table references in single quotes: 'Sales', 'Date Table'
            pattern: /'(?:[^']|'')*'/,
            alias: 'symbol',
            greedy: true
        },
        'column-reference': {
            // Column/measure references in square brackets: [Amount], [Sales YTD]
            pattern: /\[[^\]]*\]/,
            alias: 'attr-name'
        },
        'keyword': {
            pattern: /\b(?:DEFINE|MEASURE|VAR|RETURN|EVALUATE|ORDER\s+BY|ASC|DESC|TABLE|COLUMN|START\s+AT)\b/i
        },
        'function': {
            // Comprehensive list of DAX functions
            pattern: /\b(?:ABS|ACOS|ACOSH|ACOT|ACOTH|ADDCOLUMNS|ADDMISSINGITEMS|ALL|ALLCROSSFILTERED|ALLEXCEPT|ALLNOBLANKROW|ALLSELECTED|AMORDEGRC|AMORLINC|AND|APPROXIMATEDISTINCTCOUNT|ASIN|ASINH|ATAN|ATANH|AVERAGE|AVERAGEA|AVERAGEX|BETA\.DIST|BETA\.INV|BITAND|BITLSHIFT|BITOR|BITRSHIFT|BITXOR|BLANK|CALCULATE|CALCULATETABLE|CALENDAR|CALENDARAUTO|CEILING|CHISQ\.DIST|CHISQ\.DIST\.RT|CHISQ\.INV|CHISQ\.INV\.RT|CLOSINGBALANCEMONTH|CLOSINGBALANCEQUARTER|CLOSINGBALANCEYEAR|COALESCE|COLUMNSTATISTICS|COMBIN|COMBINA|COMBINEVALUES|CONCATENATE|CONCATENATEX|CONFIDENCE\.NORM|CONFIDENCE\.T|CONTAINS|CONTAINSROW|CONTAINSSTRING|CONTAINSSTRINGEXACT|CONVERT|COS|COSH|COT|COTH|COUNT|COUNTA|COUNTAX|COUNTBLANK|COUNTROWS|COUNTX|CROSSFILTER|CROSSJOIN|CURRENCY|CURRENTGROUP|CUSTOMDATA|DATATABLE|DATE|DATEADD|DATEDIFF|DATESBETWEEN|DATESINPERIOD|DATESMTD|DATESQTD|DATESYTD|DATEVALUE|DAY|DEGREES|DETAILROWS|DISTINCT|DISTINCTCOUNT|DISTINCTCOUNTNOBLANK|DIVIDE|EARLIER|EARLIEST|EDATE|ENDOFMONTH|ENDOFQUARTER|ENDOFYEAR|EOMONTH|ERROR|EVEN|EXACT|EXCEPT|EXP|EXPON\.DIST|FACT|FALSE|FILTER|FILTERS|FIND|FIRSTDATE|FIRSTNONBLANK|FIRSTNONBLANKVALUE|FIXED|FLOOR|FORMAT|GCD|GENERATE|GENERATEALL|GENERATESERIES|GEOMEAN|GEOMEANX|GROUPBY|HASONEFILTER|HASONEVALUE|HOUR|IF|IF\.EAGER|IGNORE|INDEX|INFO\.ACCESSDENIED|INFO\.TABLES|INFO\.COLUMNS|INFO\.MEASURES|INT|INTERSECT|ISAFTER|ISBLANK|ISCROSSFILTERED|ISEMPTY|ISERROR|ISEVEN|ISFILTERED|ISINSCOPE|ISLOGICAL|ISNONTEXT|ISNUMBER|ISO\.CEILING|ISODD|ISONORAFTER|ISSELECTEDMEASURE|ISSUBTOTAL|ISTEXT|KEEPFILTERS|KEYWORDMATCH|LASTDATE|LASTNONBLANK|LASTNONBLANKVALUE|LCM|LEFT|LEN|LN|LOG|LOG10|LOOKUPVALUE|LOWER|MAX|MAXA|MAXX|MEDIAN|MEDIANX|MID|MIN|MINA|MINUTE|MINX|MOD|MONTH|MROUND|NATURALINNERJOIN|NATURALLEFTOUTERJOIN|NEXTDAY|NEXTMONTH|NEXTQUARTER|NEXTYEAR|NONVISUAL|NORM\.DIST|NORM\.INV|NORM\.S\.DIST|NORM\.S\.INV|NOT|NOW|ODD|OFFSET|OPENINGBALANCEMONTH|OPENINGBALANCEQUARTER|OPENINGBALANCEYEAR|OR|ORDERBY|PARALLELPERIOD|PARTITIONBY|PATH|PATHCONTAINS|PATHITEM|PATHITEMREVERSE|PATHLENGTH|PERCENTILE\.EXC|PERCENTILE\.INC|PERCENTILEX\.EXC|PERCENTILEX\.INC|PERMUT|PI|POISSON\.DIST|POWER|PREVIOUSDAY|PREVIOUSMONTH|PREVIOUSQUARTER|PREVIOUSYEAR|PRODUCT|PRODUCTX|QUARTER|QUOTIENT|RADIANS|RAND|RANDBETWEEN|RANK|RANK\.EQ|RANKX|RELATED|RELATEDTABLE|REMOVEFILTERS|REPLACE|REPT|RIGHT|ROLLUP|ROLLUPADDISSUBTOTAL|ROLLUPGROUP|ROLLUPISSUBTOTAL|ROUND|ROUNDDOWN|ROUNDUP|ROW|ROWNUMBER|SAMPLE|SAMEPERIODLASTYEAR|SEARCH|SECOND|SELECTCOLUMNS|SELECTEDMEASURE|SELECTEDMEASUREFORMATSTRING|SELECTEDMEASURENAME|SELECTEDVALUE|SIGN|SIN|SINH|SQRT|SQRTPI|STARTOFMONTH|STARTOFQUARTER|STARTOFYEAR|STDEV\.P|STDEV\.S|STDEVX\.P|STDEVX\.S|SUBSTITUTE|SUBSTITUTEWITHINDEX|SUM|SUMMARIZE|SUMMARIZECOLUMNS|SUMX|SWITCH|T\.DIST|T\.DIST\.2T|T\.DIST\.RT|T\.INV|T\.INV\.2T|TAN|TANH|TIME|TIMEVALUE|TODAY|TOPN|TOPNPERLEVEL|TOPNSKIP|TOTALQTD|TOTALMTD|TOTALYTD|TREATAS|TRIM|TRUE|TRUNC|UNICHAR|UNICODE|UNION|UPPER|USERELATIONSHIP|USERCULTURE|USEROBJECTID|USERNAME|USERPRINCIPALNAME|UTCNOW|UTCTODAY|VALUE|VALUES|VAR\.P|VAR\.S|VARX\.P|VARX\.S|WEEKDAY|WEEKNUM|WINDOW|XIRR|XNPV|YEAR|YEARFRAC)\b/i,
            greedy: true
        },
        'boolean': /\b(?:TRUE|FALSE)\b/i,
        'number': {
            pattern: /\b\d+(?:\.\d+)?(?:E[+-]?\d+)?\b/i,
            greedy: true
        },
        // eslint-disable-next-line no-useless-escape
        'operator': /&&|\|\||<>|[<>!=]=?|[-+*\/&]/,
        'punctuation': /[()[\]{},;]/
    };
} as DaxSyntax;

dax.displayName = 'dax';
dax.aliases = ['DAX'];

(refractor as RefractorInstance).register(dax);
