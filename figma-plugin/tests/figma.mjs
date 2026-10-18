/**
 * A fake Figma document for the plugin's tests: enough of the plugin API (`figma.variables`, the local style getters,
 * `figma.ui`, `figma.root` plugin data) for the compiled `code.js` to run in a Node VM, plus the fixture file the tests
 * export. `loadPlugin()` evaluates `code.js` against that fake and returns a function that runs an export.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export const root = path.resolve(import.meta.dirname, '..');

/** `#rrggbb` or `#rrggbbaa` to Figma's 0..1 channels. */
export const hex = (text) => {
    const n = parseInt(text.slice(1), 16);
    const alpha = text.length === 9;
    const [r, g, b, a] = alpha
        ? [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
        : [(n >>> 16) & 255, (n >>> 8) & 255, n & 255, 255];
    return { r: r / 255, g: g / 255, b: b / 255, a: a / 255 };
};

/** A translucent black, as Figma stores it (0..1 channels). */
const transparentBlack = (alpha) => ({ r: 0, g: 0, b: 0, a: alpha });

/** An alias to another variable, resolved by `Collection name/variable name` once every variable exists. */
export const alias = (target) => ({ alias: target });

/**
 * The fixture: USWDS-shaped primitives in several collections (two of them named alike, as in the kit), a three-mode
 * theme collection whose values alias primitives, a second multi-mode collection, a collection that aliases both, and
 * paint, effect and text styles.
 */
export const fixture = {
    name: 'Fixture Kit',
    collections: [
        {
            name: 'Color',
            modes: ['Mode 1'],
            variables: [
                { name: '!-usa/color/red/50', type: 'COLOR', value: hex('#d83933') },
                { name: '!-usa/color/gray/90', type: 'COLOR', value: hex('#1b1b1b') },
                { name: '!-usa/color/white', type: 'COLOR', value: hex('#ffffff') },
                { name: '!-usa/color/blue/60v', type: 'COLOR', value: hex('#005ea2') },
                { name: '!-usa/color/black-transparent/10', type: 'COLOR', value: transparentBlack(0.1) },
            ],
        },
        {
            name: 'Spacing',
            modes: ['Mode 1'],
            variables: [
                { name: '!-usa/spacing/1', type: 'FLOAT', value: 8 },
                { name: '!-usa/spacing/05', type: 'FLOAT', value: 4 },
            ],
        },
        {
            // The kit has two collections named Spacing; the second one's names clash with the first.
            name: 'Spacing',
            modes: ['Mode 1'],
            variables: [{ name: '!-usa/spacing/1', type: 'FLOAT', value: 8 }],
        },
        {
            name: 'Font',
            modes: ['Mode 1'],
            variables: [
                { name: '!-usa/font-weight/bold', type: 'FLOAT', value: 700, scopes: ['FONT_WEIGHT'] },
                { name: '!-usa/font-family/sans', type: 'STRING', value: 'Public Sans' },
            ],
        },
        {
            name: 'USWDS Theme',
            modes: ['Default', 'Project theme', 'Project theme dark'],
            variables: [
                {
                    name: '#-theme/color/ink',
                    type: 'COLOR',
                    values: [
                        alias('Color/!-usa/color/gray/90'),
                        alias('Color/!-usa/color/gray/90'),
                        alias('Color/!-usa/color/white'),
                    ],
                },
                { name: '#-theme/color/primary', type: 'COLOR', value: alias('Color/!-usa/color/blue/60v') },
                {
                    name: '#-theme/spacing/gap',
                    type: 'FLOAT',
                    values: [
                        alias('Spacing/!-usa/spacing/1'),
                        alias('Spacing/!-usa/spacing/1'),
                        alias('Spacing/!-usa/spacing/05'),
                    ],
                },
                { name: '#-theme/focus/style', type: 'STRING', value: 'outline' },
            ],
        },
        {
            name: 'Density',
            modes: ['Comfortable', 'Compact'],
            variables: [{ name: 'density/gap', type: 'FLOAT', values: [16, 8] }],
        },
        {
            name: 'General',
            modes: ['Mode 1'],
            variables: [
                { name: 'general/border/color', type: 'COLOR', value: alias('USWDS Theme/#-theme/color/ink') },
                { name: 'general/row/gap', type: 'FLOAT', value: alias('Density/density/gap') },
            ],
        },
    ],
    paintStyles: [
        {
            name: 'Brand / Primary',
            paints: [{ type: 'SOLID', color: hex('#005ea2'), bound: 'Color/!-usa/color/blue/60v' }],
        },
        {
            name: 'Brand / Gradient',
            paints: [
                {
                    type: 'GRADIENT_LINEAR',
                    gradientTransform: [
                        [1, 0, 0],
                        [0, 1, 0],
                    ],
                    gradientStops: [
                        { color: hex('#d83933'), position: 0 },
                        { color: hex('#005ea2'), position: 1 },
                    ],
                },
            ],
        },
    ],
    effectStyles: [
        {
            name: 'Shadow / 1',
            effects: [
                {
                    type: 'DROP_SHADOW',
                    visible: true,
                    color: transparentBlack(0.1),
                    offset: { x: 0, y: 1 },
                    radius: 2,
                    spread: 0,
                },
            ],
        },
    ],
    textStyles: [
        {
            name: 'Heading / XL',
            fontName: { family: 'Public Sans', style: 'Bold' },
            fontSize: 32,
            lineHeight: { unit: 'PIXELS', value: 40 },
            letterSpacing: { unit: 'PERCENT', value: 0 },
        },
        {
            name: 'Body',
            fontName: { family: 'Public Sans', style: 'Regular' },
            fontSize: 16,
            lineHeight: { unit: 'AUTO' },
            letterSpacing: { unit: 'PIXELS', value: 0 },
        },
    ],
};

/** A copy of a document with one collection renamed, alias targets included. */
export function renameCollection(doc, from, to) {
    const copy = structuredClone(doc);
    const retarget = (value) =>
        value && typeof value === 'object' && 'alias' in value && value.alias.startsWith(`${from}/`)
            ? { alias: `${to}/${value.alias.slice(from.length + 1)}` }
            : value;
    for (const collection of copy.collections) {
        if (collection.name === from) collection.name = to;
        for (const variable of collection.variables) {
            if ('value' in variable) variable.value = retarget(variable.value);
            if ('values' in variable) variable.values = variable.values.map(retarget);
        }
    }
    return copy;
}

/** Builds the fake `figma` global for a document described like `fixture`. */
export function createFigma(doc = fixture) {
    let nextId = 1;
    const id = (prefix) => `${prefix}:${nextId++}`;

    const collections = [];
    const variables = [];
    const variableByPath = new Map();
    const pendingAliases = [];

    for (const spec of doc.collections) {
        const modes = spec.modes.map((name) => ({ modeId: id('mode'), name }));
        const collection = {
            id: id('collection'),
            name: spec.name,
            modes,
            defaultModeId: modes[0].modeId,
            variableIds: [],
        };
        collections.push(collection);
        for (const v of spec.variables) {
            const variable = {
                id: id('variable'),
                name: v.name,
                variableCollectionId: collection.id,
                resolvedType: v.type,
                scopes: v.scopes ?? [],
                valuesByMode: {},
            };
            const values = v.values ?? modes.map(() => v.value);
            modes.forEach((mode, i) => {
                const value = values[i];
                if (value && typeof value === 'object' && 'alias' in value) {
                    pendingAliases.push({ variable, modeId: mode.modeId, target: value.alias });
                } else {
                    variable.valuesByMode[mode.modeId] = value;
                }
            });
            variables.push(variable);
            collection.variableIds.push(variable.id);
            // The first collection with a given name owns the path; the clash case in the fixture is deliberate.
            const key = `${spec.name}/${v.name}`;
            if (!variableByPath.has(key)) variableByPath.set(key, variable);
        }
    }
    const resolve = (target) => {
        const variable = variableByPath.get(target);
        if (!variable) throw new Error(`fixture: no variable ${target}`);
        return { type: 'VARIABLE_ALIAS', id: variable.id };
    };
    for (const { variable, modeId, target } of pendingAliases) variable.valuesByMode[modeId] = resolve(target);

    const paintStyles = (doc.paintStyles ?? []).map((style) => ({
        id: id('style'),
        name: style.name,
        paints: style.paints.map(({ bound, ...paint }) => ({
            opacity: 1,
            ...paint,
            ...(bound ? { boundVariables: { color: resolve(bound) } } : {}),
        })),
    }));
    const effectStyles = (doc.effectStyles ?? []).map((style) => ({
        id: id('style'),
        name: style.name,
        effects: style.effects.map((effect) => ({ boundVariables: {}, ...effect })),
    }));
    const textStyles = (doc.textStyles ?? []).map((style) => ({
        id: id('style'),
        textDecoration: 'NONE',
        textCase: 'ORIGINAL',
        boundVariables: {},
        ...style,
    }));
    const gridStyles = doc.gridStyles ?? [];

    const pluginData = {};
    const messages = [];
    const figma = {
        root: {
            name: doc.name,
            getPluginData: (key) => pluginData[key] ?? '',
            setPluginData: (key, value) => {
                pluginData[key] = value;
            },
        },
        mixed: Symbol('mixed'),
        showUI() {},
        notify() {},
        closePlugin() {},
        ui: {
            onmessage: null,
            resize() {},
            postMessage: (message) => messages.push(message),
        },
        variables: {
            getLocalVariableCollectionsAsync: async () => collections,
            getLocalVariablesAsync: async () => variables,
            getVariableByIdAsync: async (variableId) => variables.find((v) => v.id === variableId) ?? null,
            getVariableCollectionByIdAsync: async (collectionId) =>
                collections.find((c) => c.id === collectionId) ?? null,
        },
        getLocalPaintStylesAsync: async () => paintStyles,
        getLocalEffectStylesAsync: async () => effectStyles,
        getLocalTextStylesAsync: async () => textStyles,
        getLocalGridStylesAsync: async () => gridStyles,
        getImageByHash: () => null,
        createText() {
            throw new Error('the fixture has no text nodes');
        },
    };

    return {
        figma,
        messages,
        pluginData,
        collectionId: (name) => collections.find((c) => c.name === name).id,
    };
}

/**
 * Evaluates the compiled plugin against a fake document. The returned `exportTokens` posts an EXPORT message the way
 * the panel does and resolves with the EXPORT_RESULT message (or throws the EXPORT_ERROR).
 */
export function loadPlugin(doc = fixture) {
    const fake = createFigma(doc);
    const code = readFileSync(path.join(root, 'code.js'), 'utf8');
    const context = vm.createContext({ figma: fake.figma, __html__: '', setTimeout, clearTimeout, console });
    vm.runInContext(code, context, { filename: 'code.js' });
    if (typeof fake.figma.ui.onmessage !== 'function') throw new Error('code.js did not register figma.ui.onmessage');

    return {
        ...fake,
        async exportTokens(message = {}) {
            fake.messages.length = 0;
            await fake.figma.ui.onmessage({ type: 'EXPORT', ...message });
            const result = fake.messages.find((m) => m.type === 'EXPORT_RESULT' || m.type === 'EXPORT_ERROR');
            if (!result) throw new Error('the plugin posted no result');
            if (result.type === 'EXPORT_ERROR') throw new Error(result.message);
            // The panel receives the message by structured clone; the tests see the same plain data.
            return structuredClone(result);
        },
    };
}
