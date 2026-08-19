import { defineConfig } from 'vitest/config';
import * as path from 'path';

/**
 * Stubs the non-JS imports that webpack resolves through loaders
 * (see base-webpack.config.js): styles, inlined SVG/images and the
 * README.md that DemoSection.tsx pulls in as `asset/source`.
 *
 * Compiling style/visual.scss for every test run would cost seconds and
 * buys nothing — no test asserts on CSS.
 */
function assetStubs() {
    const STYLE = '\0stub:style';
    const SVG = '\0stub:svg';
    const MD = '\0stub:md';

    return {
        name: 'asset-stubs',
        enforce: 'pre' as const,
        resolveId(source: string) {
            if (/\.(scss|sass|css)(\?.*)?$/.test(source)) return STYLE;
            if (/\.(svg|png|jpe?g|gif)(\?.*)?$/.test(source)) return SVG;
            if (/\.md(\?.*)?$/.test(source)) return MD;
            return null;
        },
        load(id: string) {
            if (id === STYLE) return 'export default {};';
            if (id === SVG) return 'export default "data:image/svg+xml;base64,STUB";';
            if (id === MD) return 'export default "# Stub\\n\\nStub readme content.";';
            return null;
        },
    };
}

export default defineConfig({
    plugins: [assetStubs()],
    resolve: {
        alias: {
            // Mirrors the aliases in base-webpack.config.js
            visual: path.resolve(__dirname, 'src'),
            assets: path.resolve(__dirname, 'assets'),
            // powerbi-visuals-api is a webpack *external* in the real build (mapped
            // to the global `powerbi`) and its npm entry point only exposes
            // version/schemas. Its const enums (VisualUpdateType) are inlined by
            // ts-loader but not by esbuild, so tests need a real runtime module.
            'powerbi-visuals-api': path.resolve(__dirname, 'test/stubs/powerbiApi.ts'),
            // The powerbi-visuals-utils-* packages ship ESM with extensionless
            // relative imports, which Node's ESM resolver rejects. Pointing at
            // the entry file directly keeps them inside Vite's resolver, which
            // does try extensions.
            'powerbi-visuals-utils-typeutils': path.resolve(__dirname, 'node_modules/powerbi-visuals-utils-typeutils/lib/index.js'),
            'powerbi-visuals-utils-formattingutils': path.resolve(__dirname, 'node_modules/powerbi-visuals-utils-formattingutils/lib/index.js'),
            'powerbi-visuals-utils-dataviewutils': path.resolve(__dirname, 'node_modules/powerbi-visuals-utils-dataviewutils/lib/index.js'),
        },
    },
    esbuild: {
        jsx: 'automatic',
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./test/setup.ts'],
        include: ['test/**/*.test.{ts,tsx}'],
        css: false,
        server: {
            deps: {
                // powerbi-visuals-utils-* ship ESM with extensionless relative
                // imports, which Node's ESM resolver rejects. Inlining routes
                // them through Vite's resolver instead.
                inline: [/powerbi-visuals-utils/],
            },
        },
        deps: {
            optimizer: {
                // Vitest 4 renamed the `web` environment key to `client`.
                client: {
                    enabled: true,
                    include: [
                        'powerbi-visuals-utils-formattingutils',
                        'powerbi-visuals-utils-dataviewutils',
                        'powerbi-visuals-utils-typeutils',
                    ],
                },
            },
        },
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/global.d.ts', 'src/visualPluginView.ts'],
            reporter: ['text', 'html'],
        },
    },
});
