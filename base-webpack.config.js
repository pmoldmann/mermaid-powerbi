const path = require('path');

// werbpack plugin
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// visual configuration json path
const pbivizPath = "./pbiviz.json";
const pbivizFile = require(path.join(__dirname, pbivizPath));

// the visual capabilities content
const capabilitiesPath = "./capabilities.json";

// babel options to support IE11
let babelOptions = {
    "presets": [
        [
            require.resolve('@babel/preset-env'),
            {
                useBuiltIns: "entry",
                corejs: 3,
                modules: false
            }
        ],
        [
            require.resolve('@babel/preset-react')
        ],
    ],
    plugins: [
        [
            require.resolve('babel-plugin-module-resolver'),
            {
                root: ['./'],
            },
        ],
    ],
    sourceType: "unambiguous", // tell to babel that the project can contains different module types, not only es2015 modules
    cacheDirectory: path.join(".tmp", "babelCache") // path for chace files
};

const resolve = {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.css','.json'],
    alias: {
        visual: path.resolve(__dirname, './src'),
        assets: path.resolve(__dirname, './assets'),
    },
};

const moduleRules = {
    rules: [
        {
            parser: {
                amd: false
            }
        },
        {
            test: /\.pegjs$/,
            loader: require.resolve('pegjs-loader'),
            options: {
              allowedStartRules: ["start", "start_text"],
              cache: true,
              optimize: "size"
            }
        },
        {
            test: /\.tmplt$/,
            type: 'asset/source',
        },
        {
            test: /\.md$/,
            // Only the project's own README is imported (see src/DemoSection.tsx).
            // Without this exclude, READMEs reached through node_modules end up in the bundle.
            exclude: /node_modules/,
            type: 'asset/source',
        },
        {
            test: /(\.ts)x|\.ts$/,
            use: [
                {
                    loader: require.resolve('babel-loader'),
                    options: {
                        // presets: ['@babel/react', '@babel/env'],
                        plugins: [
                            [
                                require.resolve('babel-plugin-module-resolver'),
                                {
                                    root: ['./'],
                                    alias: {
                                    },
                                },
                            ],
                        ],
                    },
                },
                {
                    loader: require.resolve('ts-loader'),
                    options: {
                        transpileOnly: false,
                        experimentalWatchApi: false,
                    }
                }
            ],
            exclude: [/node_modules/],
            include: /powerbi-visuals-|src|precompile\\visualPlugin.ts/,
        },
        {
            test: /(\.js)x|\.js$/,
            use: [
                {
                    loader: require.resolve('babel-loader'),
                    options: babelOptions
                }
            ],
            exclude: [/node_modules/]
        },
        {
            test: /\.json$/,
            loader: require.resolve('json-loader'),
            type: "javascript/auto"
        },
        {
            test: /\.(css|scss|less)?$/,
            use: [
                require.resolve('style-loader'),
                require.resolve('css-loader'),
                require.resolve('sass-loader')
            ],
        },
        {
            test: /\.(ico|woff2|jpg|jpeg|png|webp|svg)$/i,
            use: [
                {
                    loader: 'base64-inline-loader'
                }
            ]
        },
        {
            // Legacy font formats are referenced by KaTeX's @font-face rules only as
            // fallbacks *after* woff2. Every browser Power BI supports picks the woff2,
            // so inlining these as base64 would add ~2 MB to the bundle for nothing.
            // Resolve the URL but do not emit or inline the bytes.
            test: /\.(woff|ttf|eot)$/i,
            type: 'asset/resource',
            generator: {
                emit: false
            }
        }
    ]
};

const externals = {
    "powerbi-visuals-api": 'null',
    "fakeDefine": 'false',
    "corePowerbiObject": "Function('return this.powerbi')()",
    "realWindow": "Function('return this')()",
};
// Power BI downloads and evaluates visual.js on every report load, so bundle size
// is the dominant factor in how long a report takes to open. Warn instead of staying
// silent, so a regression shows up at build time rather than in the service.
const performance = {
    hints: 'warning',
    maxEntrypointSize: 3000000,
    maxAssetSize: 3000000
};

const plugins = [
    new webpack.ProvidePlugin({
        window: 'realWindow',
        define: 'fakeDefine',
        powerbi: 'corePowerbiObject'
    }),
    new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1
    })
];

const devServer = {
    static: false,
    compress: true,
    port: 8080, // dev server port
    hot: false,
    liveReload: false,
    webSocketServer: false,
    server: 'https',
    headers: {
        "access-control-allow-origin": "*",
        "cache-control": "public, max-age=0"
    },
    devMiddleware: {
        writeToDisk: true
    },
    watchFiles: [pbivizPath, capabilitiesPath],
};

const optimization = {
    concatenateModules: true,
    minimize: true // enable minimization for create *.pbiviz file less than 2 Mb, can be disabled for dev mode
};

module.exports = {
    optimization,
    // mode and devtool are set per config: view-webpack.config.js packages for
    // production (no source maps, NODE_ENV=production), view-webpack.dev.config.js
    // serves the dev server. Never use an eval-based devtool - certified visuals
    // must not contain eval().
    mode: "production",
    module: moduleRules,
    resolve,
    externals,
    performance,
    devServer,
    output: {
        publicPath: '/assets',
        path: path.join(__dirname, "/.tmp", "drop"),
        library: pbivizFile.visual.guid,
        libraryTarget: 'var',
    },
    plugins: [
        ...plugins,
    ]
};