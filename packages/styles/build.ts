/* eslint-disable no-console */
/**
 * Builds the stylesheets and the typed token module from the DTCG token source in `tokens/`.
 *
 * Npx tsx build.ts
 *
 * Style Dictionary loads and validates the token files and resolves every reference; the formats below are pttrn's own,
 * because the stylesheets encode Figma's collections and modes as attribute-scoped blocks that no stock format
 * produces:
 *
 * Tokens.css every single-mode collection in `:root`, then each multi-mode collection (except the theme) as `:root,
 * [data-<attr>="<default>"]` plus one block per other mode themes/<mode>.css the theme collection, one complete
 * stylesheet per mode tokens.js, .d.ts every token with its CSS name, Figma name, type, value and mode values, typed
 *
 * A token in one collection can alias a token in another whose value changes with that collection's mode, so every
 * block of a collection redeclares the aliases that depend on it; otherwise a nested attribute would keep the outer
 * element's resolved value. This mirrors what the Figma plugin does when it exports CSS directly.
 */
import fs from 'node:fs';
import path from 'node:path';

import StyleDictionary from 'style-dictionary';

import { Collection, Manifest, valueToCss } from './scripts/dtcg.js';

const root = import.meta.dirname;
const tokensDir = path.join(root, 'tokens');
const manifest: Manifest = JSON.parse(fs.readFileSync(path.join(tokensDir, 'manifest.json'), 'utf8'));

type Value = { text: string; refs: string[] };
type Prop = {
    collection: Collection;
    path: string;
    comment: string;
    name: string;
    type: string | undefined;
    def: Value;
    modes: Map<string, Value>;
};

type SdToken = {
    path: string[];
    $type?: string;
    $value: unknown;
    original: { $value: unknown; $type?: string };
    $extensions?: { pttrn?: { css: string; figma: string } };
};

const defaultFile = (collection: Collection) =>
    collection.file ?? collection.files![collection.defaultMode ?? Object.keys(collection.files!)[0]];

async function loadTokens(files: string[]): Promise<SdToken[]> {
    const sd = new StyleDictionary({
        source: files.map((file) => path.join(tokensDir, file)),
        platforms: { tokens: { transforms: [] } },
        log: { verbosity: 'silent', warnings: 'error' },
    });
    await sd.hasInitialized;
    const { allTokens } = await sd.getPlatformTokens('tokens');
    return allTokens as unknown as SdToken[];
}

const isReference = (value: unknown): value is string => typeof value === 'string' && /^\{[^}]+\}$/.test(value);

function main() {
    return (async () => {
        const defaults = await loadTokens(manifest.collections.map(defaultFile));

        const byPath = new Map<string, SdToken>();
        for (const token of defaults) byPath.set(token.path.join('.'), token);

        const cssOf = (tokenPath: string) => {
            const target = byPath.get(tokenPath);
            if (!target?.$extensions?.pttrn) throw new Error(`reference to unknown token {${tokenPath}}`);
            return target.$extensions.pttrn.css;
        };
        const typeOf = (token: SdToken): string | undefined => {
            if (token.$type) return token.$type;
            const raw = token.original.$value;
            return isReference(raw) ? typeOf(byPath.get(raw.slice(1, -1))!) : undefined;
        };
        const valueOf = (token: SdToken): Value => {
            const raw = token.original.$value;
            if (isReference(raw)) {
                const css = cssOf(raw.slice(1, -1));
                return { text: `var(${css})`, refs: [css] };
            }
            return { text: valueToCss({ $value: raw }, typeOf(token), cssOf), refs: [] };
        };

        const props: Prop[] = [];
        const propByName = new Map<string, Prop>();
        for (const collection of manifest.collections) {
            for (const token of defaults) {
                if (token.path[0] !== collection.slug) continue;
                const meta = token.$extensions?.pttrn;
                if (!meta) throw new Error(`${token.path.join('.')} has no $extensions.pttrn`);
                const prop: Prop = {
                    collection,
                    path: token.path.join('.'),
                    comment: meta.figma,
                    name: meta.css,
                    type: typeOf(token),
                    def: valueOf(token),
                    modes: new Map(),
                };
                if (propByName.has(prop.name)) throw new Error(`${prop.name} is declared by two tokens`);
                props.push(prop);
                propByName.set(prop.name, prop);
            }
        }

        // Mode values: the same tokens with that mode's file in place of the collection's default file.
        for (const collection of manifest.collections) {
            if (!collection.files || !collection.modes) continue;
            for (const mode of collection.modes) {
                if (mode === collection.defaultMode) continue;
                const files = manifest.collections.map((other) =>
                    other === collection ? collection.files![mode] : defaultFile(other),
                );
                const modeTokens = await loadTokens(files);
                for (const token of modeTokens) {
                    if (token.path[0] !== collection.slug) continue;
                    const prop = propByName.get(token.$extensions!.pttrn!.css);
                    if (prop) prop.modes.set(mode, valueOf(token));
                }
            }
        }

        const clean = (text: string) => text.replace(/\*\//g, '* /').replace(/[\u2028\u2029]/g, ' ');
        const comment = (text: string) => `/* ${clean(text)} */`;
        const blockComment = (lines: string[]) =>
            ['/*', ...lines.map((line) => (line ? ` * ${clean(line)}` : ' *')), ' */'].join('\n');
        const isThemed = (prop: Prop) => Array.from(prop.modes.values()).some((value) => value.text !== prop.def.text);

        function block(selector: string, items: { prop: Prop; value: Value }[]) {
            const lines = [`${selector} {`];
            let group: string | null = null;
            for (const { prop, value } of items) {
                if (prop.collection.name !== group) {
                    if (group !== null) lines.push('');
                    lines.push(`    ${comment(prop.collection.name)}`);
                    group = prop.collection.name;
                }
                lines.push(`    ${comment(prop.comment)}`, `    ${prop.name}: ${value.text};`);
            }
            lines.push('}');
            return lines.join('\n');
        }

        const defaultsOf = (list: Prop[]) => list.map((prop) => ({ prop, value: prop.def }));
        const scoped = new Set<string>();
        const scopeBlocks: { collection: Collection; css: string }[] = [];
        const modeIndex: { attr: string; values: string[] }[] = [];
        let themeSet: { collection: Collection; keys: string[]; own: Prop[]; outside: Prop[] } | undefined;

        for (const collection of manifest.collections) {
            if (!collection.attribute || !collection.modes || collection.modes.length < 2) continue;
            const own = props.filter((prop) => prop.collection === collection);
            const themed = own.filter(isThemed);
            if (!themed.length) continue;

            // Anything that aliases a themed property, directly or through other aliases, is redeclared in every
            // block of this collection. A property themed by another collection is left to that collection.
            const active = new Set(themed.map((prop) => prop.name));
            for (let changed = true; changed;) {
                changed = false;
                for (const prop of props) {
                    if (active.has(prop.name) || isThemed(prop)) continue;
                    if (prop.def.refs.some((name) => active.has(name))) {
                        active.add(prop.name);
                        changed = true;
                    }
                }
            }
            const themedNames = new Set(themed.map((prop) => prop.name));
            const dependents = props.filter((prop) => active.has(prop.name) && !themedNames.has(prop.name));

            const attr = collection.attribute;
            const selector = (key: string) => `[${attr}="${key}"]`;
            const defaultKey = collection.defaultMode ?? collection.modes[0];
            const keys = collection.modes.filter((mode) => mode !== defaultKey);

            own.forEach((prop) => scoped.add(prop.name));
            const push = (css: string) => scopeBlocks.push({ collection, css });
            push(block(`:root, ${selector(defaultKey)}`, defaultsOf(own)));
            const outside = dependents.filter((prop) => prop.collection !== collection);
            if (outside.length) push(block(selector(defaultKey), defaultsOf(outside)));

            modeIndex.push({ attr: `[${attr}]`, values: [`${defaultKey} (default)`, ...keys] });
            if (collection.theme) themeSet = { collection, keys, own, outside };

            for (const key of keys) {
                const overrides = themed.map((prop) => ({ prop, value: prop.modes.get(key) ?? prop.def }));
                push(block(selector(key), overrides.concat(defaultsOf(dependents))));
            }
        }

        const baseProps = props.filter((prop) => !scoped.has(prop.name));
        const rootBlocks = baseProps.length ? [block(':root', defaultsOf(baseProps))] : [];

        function listLines(label: string, items: string[], max = 96) {
            const indent = ' '.repeat(label.length);
            const lines: string[] = [];
            let line = label;
            items.forEach((item, index) => {
                const text = index < items.length - 1 ? `${item},` : item;
                if (line.trim() && line.length + text.length + 1 > max) {
                    lines.push(line);
                    line = `${indent}${text}`;
                } else {
                    line += `${line === label ? '' : ' '}${text}`;
                }
            });
            lines.push(line);
            return lines;
        }

        const { source } = manifest;
        const generated = [
            `Figma file: ${source.figmaFile}`,
            `Exported by ${source.exporter} on ${source.exportedAt}`,
            'Built from the DTCG token files in tokens/ by @ptrn/styles. Edit the tokens, not this file.',
        ];
        const header = [
            ...generated,
            '',
            'Every Figma variable and style is a CSS custom property. The comment above each one',
            'holds its exact name in Figma.',
        ];
        if (modeIndex.length) {
            const width = Math.max(...modeIndex.map(({ attr }) => attr.length)) + 2;
            header.push(
                '',
                'Modes',
                'A collection with several modes is switched with its own attribute. Put the attribute on any',
                'element, such as <html> or a <div>, and that collection changes for everything inside it.',
                'The first value listed for each attribute is its default.',
                '',
            );
            modeIndex.forEach(({ attr, values }) =>
                header.push(...listLines(`  ${attr}${' '.repeat(width - attr.length)}`, values)),
            );
            if (modeIndex.length > 1) {
                const example = ({ attr, values }: (typeof modeIndex)[number]) =>
                    `${attr.slice(1, -1)}="${values[1] ?? values[0].replace(' (default)', '')}"`;
                header.push(
                    '',
                    'Some tokens depend on more than one collection: a token in one collection can point at a',
                    'token in another. Put both attributes on the same element so they apply together, for example:',
                    '',
                    `  <div ${example(modeIndex[0])} ${example(modeIndex[1])}>`,
                    '',
                    "If they are on different nested elements, those tokens can keep the outer element's value.",
                );
            }
        }

        const stylesheet = (lines: string[], list: string[]) => `${blockComment(lines)}\n\n${list.join('\n\n')}\n`;
        const written: string[] = [];
        const write = (file: string, content: string) => {
            fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
            fs.writeFileSync(path.join(root, file), content);
            written.push(file);
        };

        if (themeSet) {
            const { collection, keys, own, outside } = themeSet;
            const attr = collection.attribute!;
            const defaultKey = collection.defaultMode ?? collection.modes![0];
            const themeKeys = [defaultKey, ...keys];
            const themeFiles = themeKeys.map((key) => `themes/${key}.css`);
            const baseHeader = header.concat(
                '',
                'Themes',
                `The modes of "${collection.name}" ([${attr}]) are not in this file. Each one is a complete`,
                'stylesheet of its own. Load this file first, then one of:',
                '',
                ...themeFiles.map((file) => `  ${file}`),
                '',
                'Each theme file also sets :root, so with several loaded the last one is the page default. A',
                `${attr} attribute always wins over that, on <html> or on any element inside it.`,
            );
            const others = scopeBlocks.filter((scope) => scope.collection !== collection).map((scope) => scope.css);
            write('tokens.css', stylesheet(baseHeader, rootBlocks.concat(others)));

            fs.rmSync(path.join(root, 'themes'), { recursive: true, force: true });
            themeKeys.forEach((key, i) => {
                const values = own.map((prop) => ({
                    prop,
                    value: key === defaultKey ? prop.def : (prop.modes.get(key) ?? prop.def),
                }));
                const themeHeader = generated.concat(
                    '',
                    `The "${key}" mode of "${collection.name}"${key === defaultKey ? ' (its default)' : ''}, complete.`,
                    `Load tokens.css first, then this file. It sets :root and [${attr}="${key}"].`,
                );
                // :where() takes :root's specificity to zero, so an attribute on <html> beats whichever theme loaded last.
                write(
                    themeFiles[i],
                    stylesheet(themeHeader, [
                        block(`:where(:root), [${attr}="${key}"]`, values.concat(defaultsOf(outside))),
                    ]),
                );
            });
        } else {
            write('tokens.css', stylesheet(header, rootBlocks.concat(scopeBlocks.map((scope) => scope.css))));
        }

        // The typed token module.
        const entries = props.map((prop) => [
            prop.name,
            {
                css: prop.name,
                path: prop.path,
                figma: prop.comment,
                collection: prop.collection.slug,
                type: prop.type ?? null,
                value: prop.def.text,
                ...(prop.modes.size
                    ? { modes: Object.fromEntries([...prop.modes].map(([mode, value]) => [mode, value.text])) }
                    : {}),
            },
        ]);
        const collections = manifest.collections.map(({ name, slug, kind, attribute, modes, defaultMode, theme }) => ({
            name,
            slug,
            kind,
            ...(attribute ? { attribute, modes, defaultMode } : {}),
            ...(theme ? { theme } : {}),
        }));
        write(
            'tokens.js',
            `/** Generated from tokens/ by \`npm run build\` in @ptrn/styles. Do not edit. */\n` +
                `export const source = ${JSON.stringify(source, null, 4)};\n\n` +
                `export const collections = ${JSON.stringify(collections, null, 4)};\n\n` +
                `export const tokens = ${JSON.stringify(Object.fromEntries(entries), null, 4)};\n`,
        );
        const names = props.map((prop) => JSON.stringify(prop.name)).join('\n    | ');
        write(
            'tokens.d.ts',
            `/** Generated from tokens/ by \`npm run build\` in @ptrn/styles. Do not edit. */\n\n` +
                `/** Every custom property the stylesheets declare, as \`--name\`. */\nexport type TokenName =\n    | ${names};\n\n` +
                `export type TokenType = 'color' | 'dimension' | 'number' | 'fontFamily' | 'fontWeight' | 'shadow' | 'string';\n\n` +
                `export interface TokenInfo {\n    /** The custom property, as \`--name\`. */\n    css: TokenName;\n    /** The token's path in the DTCG files, \`collection.group.name\`. */\n    path: string;\n    /** The variable or style name in Figma. */\n    figma: string;\n    collection: string;\n    type: TokenType | null;\n    /** The default value as CSS text; an alias is \`var(--other)\`. */\n    value: string;\n    /** Values in the collection's other modes, when they differ. */\n    modes?: Record<string, string>;\n}\n\n` +
                `export interface CollectionInfo {\n    name: string;\n    slug: string;\n    kind: 'variables' | 'styles';\n    attribute?: string;\n    modes?: string[];\n    defaultMode?: string;\n    theme?: true;\n}\n\n` +
                `export declare const source: { figmaFile: string; exportedAt: string; exporter: string; pluginVersion?: string; importedBy?: string };\n` +
                `export declare const collections: readonly CollectionInfo[];\n` +
                `export declare const tokens: Readonly<Record<TokenName, TokenInfo>>;\n`,
        );

        console.log(
            `Built ${written.length} files from ${props.length} tokens in ${manifest.collections.length} collections:`,
        );
        written.forEach((file) => console.log(`  ${file}`));
    })();
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
