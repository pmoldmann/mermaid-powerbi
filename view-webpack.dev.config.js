const path = require('path');
const { merge } = require('webpack-merge');

// Must be set before requiring the packaging config: it makes the debug package land
// in dist/dev/ so it can never be mistaken for, or overwrite, the release package.
process.env.PBIVIZ_DEV = 'true';

// The packaging configuration is the source of truth for entry, output and the
// Power BI plugin. This config only relaxes it for local development.
const packageConfig = require('./view-webpack.config.js');

module.exports = merge(packageConfig, {
    mode: 'development',
    // A separate visual.js.map file - readable in devtools, and not shipped inside
    // the visual. Never switch this to an eval-based devtool: certified custom
    // visuals must not contain eval().
    devtool: 'source-map',
    optimization: {
        minimize: false
    },
    performance: {
        hints: false
    },
    devServer: {
        static: {
            directory: path.join(__dirname, '.tmp', 'drop'),
            publicPath: '/assets'
        },
        devMiddleware: {
            writeToDisk: true
        },
        hot: false
    }
});
