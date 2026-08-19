import { vi } from 'vitest';

/**
 * Mermaid cannot lay out a diagram in jsdom — it measures rendered SVG text,
 * which jsdom does not implement. Tests therefore assert the *contract* with
 * mermaid instead of its output: which config it is initialised with and which
 * preprocessed source it is handed.
 *
 * A diagram whose source contains INVALID makes render() reject, which is how
 * the error fallback path is exercised.
 */
export function createMermaidMock() {
    return {
        default: {
            initialize: vi.fn(),
            registerLayoutLoaders: vi.fn(),
            render: vi.fn(async (id: string, code: string) => {
                if (code.includes('INVALID')) {
                    throw new Error('Parse error on line 1');
                }
                return {
                    svg: `<svg id="${id}" width="100" height="50">`
                        + '<g class="nodes"><g id="flowchart-A-0"><text>Node A</text></g></g>'
                        + '</svg>',
                };
            }),
        },
    };
}
