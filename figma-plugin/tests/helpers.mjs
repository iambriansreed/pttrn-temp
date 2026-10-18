/** Helpers shared by the plugin tests: reading declarations out of a stylesheet and tokens out of a DTCG document. */

/** The declarations of every `selector { ... }` block of a stylesheet, as `{ selector: { '--name': 'value' } }`. */
export function declarations(css) {
    const blocks = {};
    for (const match of css.matchAll(/^([^\s/][^{\n]*) \{\n([\s\S]*?)\n\}/gm)) {
        const [, selector, body] = match;
        const block = (blocks[selector] ??= {});
        for (const line of body.split('\n')) {
            const declaration = line.trim().match(/^(--[^:]+): (.*);$/);
            if (declaration) block[declaration[1]] = declaration[2];
        }
    }
    return blocks;
}

/** Every token of a DTCG document, keyed by its dotted path. */
export function tokensOf(document) {
    const tokens = {};
    const walk = (node, trail) => {
        for (const [key, value] of Object.entries(node)) {
            if (key.startsWith('$')) continue;
            if (value && typeof value === 'object' && '$value' in value) tokens[[...trail, key].join('.')] = value;
            else walk(value, [...trail, key]);
        }
    };
    walk(document, []);
    return tokens;
}
