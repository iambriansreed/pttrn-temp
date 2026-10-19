/**
 * The token model shared by the importer (`css-to-dtcg.ts`) and the build (`../build.ts`): how Figma names become token
 * paths, how CSS values and DTCG values convert both ways, and how the token files are laid out.
 *
 * Layout of `tokens/`: manifest.json provenance plus every collection, its attribute, modes and default mode
 * <collection>.tokens.json a single-mode collection (or a group of styles) <collection>/<mode>.tokens.json one complete
 * file per mode of a multi-mode collection
 *
 * Each file is a DTCG document whose top-level group is the collection slug, so a reference is unambiguous across
 * collections: `{color.usa.color.red.50}`. Every token carries `$extensions.pttrn.css` (its custom property name,
 * exactly as the stylesheets declare it) and `$extensions.pttrn.figma` (its name in Figma).
 */
import fs from 'node:fs';
import path from 'node:path';

export type Collection = {
    name: string;
    slug: string;
    /** `variables` for a Figma variable collection, `styles` for a group of paint, effect, text or grid styles. */
    kind: 'variables' | 'styles';
    /** The `data-*` attribute that switches the collection's mode, when it has more than one. */
    attribute?: string;
    modes?: string[];
    defaultMode?: string;
    /** The theme collection: its modes build into `themes/<mode>.css` instead of blocks in `tokens.css`. */
    theme?: boolean;
    /** Written by the build: the token files relative to `tokens/`. */
    file?: string;
    files?: Record<string, string>;
};

export type Manifest = {
    source: {
        figmaFile: string;
        exportedAt: string;
        exporter: string;
        pluginVersion?: string;
        importedBy?: string;
        /** A mode file that a script writes from another, rather than Figma. */
        derived?: string;
    };
    collections: Collection[];
};

/** A custom property as the stylesheets declare it: its default value and its value in each other mode. */
export type Prop = {
    collection: string;
    group: string;
    comment: string;
    name: string;
    def: string;
    modes: Record<string, string>;
};

export type ColorValue = { colorSpace: 'srgb'; components: [number, number, number]; alpha: number; hex: string };
export type DimensionValue = { value: number; unit: 'px' | 'rem' };
export type ShadowValue = {
    color: ColorValue;
    offsetX: DimensionValue;
    offsetY: DimensionValue;
    blur: DimensionValue;
    spread: DimensionValue;
    inset?: boolean;
};
export type TokenValue = { $type?: string; $value: unknown };

export type Token = TokenValue & {
    $extensions: { pttrn: { css: string; figma: string } };
};

export const round = (n: number, digits = 4) => Number(n.toFixed(digits));
export const num = (n: number, digits = 4) => String(round(n, digits));
export const px = (n: number) => `${num(n)}px`;

export const slug = (text: string) =>
    text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

/** `{collection}.{figma name segments}`: `!-usa/color/red/5` in the Color collection is `color.usa.color.red.5`. */
export function tokenPath(collection: Pick<Collection, 'slug'>, prop: Pick<Prop, 'comment'>) {
    const segments = prop.comment.split('/').map(slug).filter(Boolean);
    return [collection.slug, ...(segments.length ? segments : ['unnamed'])].join('.');
}

const hex2 = (n: number) => n.toString(16).padStart(2, '0');

export function rgbFromCss(text: string): ColorValue | null {
    const match = text.match(/^rgb\((\d+) (\d+) (\d+)(?: \/ (\d*\.?\d+)%)?\)$/);
    if (!match) return null;
    const [r, g, b] = [match[1], match[2], match[3]].map(Number);
    return {
        colorSpace: 'srgb',
        components: [round(r / 255), round(g / 255), round(b / 255)],
        alpha: match[4] === undefined ? 1 : round(Number(match[4]) / 100),
        hex: `#${hex2(r)}${hex2(g)}${hex2(b)}`,
    };
}

export function rgbToCss({ components, alpha }: ColorValue) {
    const channels = components.map((c) => Math.round(c * 255)).join(' ');
    const percent = round(alpha * 100, 2);
    return percent === 100 ? `rgb(${channels})` : `rgb(${channels} / ${percent}%)`;
}

const dimensionFromCss = (text: string): DimensionValue | null => {
    const match = text.match(/^(-?\d*\.?\d+)(px|rem)$/);
    return match ? { value: Number(match[1]), unit: match[2] as DimensionValue['unit'] } : null;
};

export const dimensionToCss = ({ value, unit }: DimensionValue) => `${num(value)}${unit}`;

export function shadowFromCss(text: string): ShadowValue | ShadowValue[] | null {
    const layers = text.split(/,(?![^(]*\))/).map((layer) => layer.trim());
    const parsed: ShadowValue[] = [];
    for (const layer of layers) {
        const match = layer.match(
            /^(inset )?(-?\d*\.?\d+px) (-?\d*\.?\d+px) (-?\d*\.?\d+px) (-?\d*\.?\d+px) (rgb\(.*\))$/,
        );
        if (!match) return null;
        const color = rgbFromCss(match[6]);
        const [offsetX, offsetY, blur, spread] = [match[2], match[3], match[4], match[5]].map(dimensionFromCss);
        if (!color || !offsetX || !offsetY || !blur || !spread) return null;
        parsed.push({ ...(match[1] ? { inset: true } : {}), color, offsetX, offsetY, blur, spread });
    }
    return parsed.length === 1 ? parsed[0] : parsed;
}

export function shadowToCss(value: ShadowValue | ShadowValue[]) {
    const layers = Array.isArray(value) ? value : [value];
    return layers
        .map(
            (layer) =>
                `${layer.inset ? 'inset ' : ''}${dimensionToCss(layer.offsetX)} ${dimensionToCss(layer.offsetY)} ${dimensionToCss(layer.blur)} ${dimensionToCss(layer.spread)} ${rgbToCss(layer.color)}`,
        )
        .join(', ');
}

/** A token's `$value` as CSS text. References are resolved by the caller, which knows every token's CSS name. */
export function valueToCss(token: TokenValue, type: string | undefined, resolveReference: (path: string) => string) {
    const value = token.$value;
    if (typeof value === 'string' && /^\{[^}]+\}$/.test(value)) return resolveReference(value.slice(1, -1));
    switch (type) {
        case 'color':
            return rgbToCss(value as ColorValue);
        case 'dimension':
            return dimensionToCss(value as DimensionValue);
        case 'number':
            return num(value as number);
        case 'fontFamily':
        case 'string':
            return JSON.stringify(value);
        case 'fontWeight':
            return typeof value === 'number' ? num(value) : JSON.stringify(value);
        case 'shadow':
            return shadowToCss(value as ShadowValue | ShadowValue[]);
        default:
            throw new Error(`no CSS form for a token of type ${type}`);
    }
}

type Group = { [key: string]: Group | Token };

function setToken(root: Group, pathSegments: string[], token: Token, cssName: string) {
    let node = root;
    for (const segment of pathSegments.slice(0, -1)) {
        const next = node[segment];
        if (next && '$value' in next) throw new Error(`${cssName}: ${segment} is both a token and a group`);
        node = (next as Group) ?? (node[segment] = {});
    }
    const last = pathSegments[pathSegments.length - 1];
    if (node[last]) throw new Error(`${cssName}: the path ${pathSegments.join('.')} is already taken`);
    node[last] = token;
}

/** Writes `manifest.json` and one DTCG file per collection (per mode); returns the number of files written. */
export function writeTokenFiles(
    dir: string,
    manifest: Manifest,
    props: Prop[],
    toValue: (text: string, prop: Prop) => TokenValue,
) {
    fs.mkdirSync(dir, { recursive: true });
    let written = 0;
    const write = (file: string, document: Group) => {
        const target = path.join(dir, file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, `${JSON.stringify(document, null, 4)}\n`);
        written += 1;
    };

    for (const collection of manifest.collections) {
        const own = props.filter((prop) => prop.collection === collection.slug);
        const document = (mode?: string): Group => {
            const root: Group = {};
            for (const prop of own) {
                const text = mode && mode !== collection.defaultMode ? (prop.modes[mode] ?? prop.def) : prop.def;
                const token: Token = {
                    ...toValue(text, prop),
                    $extensions: { pttrn: { css: prop.name, figma: prop.comment } },
                };
                setToken(root, tokenPath(collection, prop).split('.'), token, prop.name);
            }
            return root;
        };
        if (collection.modes && collection.modes.length > 1) {
            collection.files = {};
            for (const mode of collection.modes) {
                const file = `${collection.slug}/${mode}.tokens.json`;
                collection.files[mode] = file;
                write(file, document(mode));
            }
        } else {
            collection.file = `${collection.slug}.tokens.json`;
            write(collection.file, document());
        }
    }

    fs.writeFileSync(path.join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 4)}\n`);
    return written + 1;
}
