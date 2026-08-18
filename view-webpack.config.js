const path = require('path');
const fs = require("fs");
const webpack = require("webpack");
const Visualizer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// werbpack plugin
const { PowerBICustomVisualsWebpackPlugin } = require('powerbi-visuals-webpack-plugin');

// api configuration
const powerbiApi = require("powerbi-visuals-api");

// visual configuration json path
const pbivizFile = require(path.join(__dirname, "./pbiviz.json"));

// the visual capabilities content
const capabilitiesFile = require(path.join(__dirname, "./capabilities.json"));

// string resources
const resourcesFolder = path.join(".", "stringResources");
const localizationFolders = fs.existsSync(resourcesFolder) && fs.readdirSync(resourcesFolder);

const { merge } = require('webpack-merge');
const base = require('./base-webpack.config.js');

const GUID = pbivizFile.visual.guid;
const NAME = pbivizFile.visual.name;
const DISPLAY_NAME = pbivizFile.visual.displayName;

const pluginLocation = './src/visualPluginView.ts';
const statsLocation = "../../view.webpack.statistics.html";

// Set by view-webpack.dev.config.js before it requires this file, so a debug build
// never overwrites the release package in dist/.
const isDev = process.env.PBIVIZ_DEV === 'true';

module.exports = merge(base, {
    // Production build: enables tree shaking and sets NODE_ENV=production, which makes
    // React, micromark and mdast resolve their production entry points instead of the
    // much larger (and slower) development ones.
    mode: 'production',
    // No source maps in the packaged visual. An inline source map is embedded as base64
    // *inside* visual.js and shipped to every report viewer - that alone grew the bundle
    // to ~38 MB. Use `npm run start` or `npm run package:dev` when you need to debug.
    devtool: false,
    entry: {
        "visual": pluginLocation
    },
    output: {
        publicPath: '/assets',
        path: path.join(__dirname, "/.tmp", "drop"),
        library: GUID,
        libraryTarget: 'var',
    },
    plugins: [
        // visual plugin regenerates with the visual source, but it does not require relaunching dev server
        new webpack.WatchIgnorePlugin({
            paths: [
                path.join(__dirname, pluginLocation),
                "./.tmp/**/*.*"
            ]
        }),
        new Visualizer({
            reportFilename: statsLocation,
            openAnalyzer: false,
            analyzerMode: `static`
        }),
        // custom visuals plugin instance with options
        new PowerBICustomVisualsWebpackPlugin({
            ...pbivizFile,
            visual: {
                ...pbivizFile.visual,
                guid: GUID,
                displayName: DISPLAY_NAME,
                name: NAME
            },
            assets: {
                icon: "assets/icon.svg"
            },
            compression: 9,
            capabilities: capabilitiesFile,
            stringResources: localizationFolders && localizationFolders.map(localization => path.join(
                resourcesFolder,
                localization,
                "resources.resjson"
            )),
            apiVersion: powerbiApi.version,
            capabilitiesSchema: powerbiApi.schemas.capabilities,
            pbivizSchema: powerbiApi.schemas.pbiviz,
            stringResourcesSchema: powerbiApi.schemas.stringResources,
            dependenciesSchema: powerbiApi.schemas.dependencies,
            devMode: false,
            generatePbiviz: true,
            generateResources: false,
            modules: true,
            visualSourceLocation: "../src/visual",
            pluginLocation: pluginLocation,
            packageOutPath: path.join(__dirname, isDev ? "dist/dev" : "dist"),
            dropPath: path.join(__dirname, "/.tmp", "drop")
        })
    ]
});