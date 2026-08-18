# comments for certification process on partner.microsoft.com

Find the repo in github:
https://github.com/pmoldmann/mermaid-powerbi/tree/certification
no credentials required, it is a free repo. 

Remarks:
- This version is a performance release. The previous packages were built with webpack in development mode, which embedded an inline base64 source map into visual.js — the package was 10.4 MB compressed / ~40 MB of JavaScript, and reports took about two minutes to open in the service. The build now runs in production mode without source maps, and the Prism language set was reduced to the languages the visual actually offers. The package is now ~1.7 MB. No functional changes, no new privileges (`privileges` is still an empty array), no `eval`, and no obfuscation beyond webpack's standard terser minification.
- Build with `npm install && npm run package`. `npm run package:dev` produces an unminified build in `dist/dev/` for debugging.
- Cross Filtering needs to be activated using a setting, see "Interactivity" -> "Cross Filter" -> enable. Please use the report page "Cross Filter Example" of the supplied demo .pbix file for a demo of this feature.
- In the last submssion process I got the feedback "Anchor links from data fields rendered in the DOM with unsafe href values". This is now fixed with this version. 
- See the README.md in the repo for possible open questions, it shoud cover most questions.


