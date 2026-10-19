/**
 * Derives the project-theme-dark mode of the USWDS Theme collection from project-theme.
 *
 * The Figma kit's dark mode only swaps ink and ink-reverse, which leaves every surface light under white text and every
 * status tone too dark for the dark page. pttrn owns its dark theme instead, as a rule over the light theme, so a fresh
 * Figma export regenerates it the same way (`npm run build` runs this first; `--derive-dark` on build.ts):
 *
 * - Each color family's ladder is mirrored: lightest and darkest, lighter and darker, light and dark swap values. medium
 *   and vivid keep theirs, so filled controls keep their white text.
 * - Base is the exception: its lightest sits one step above the page (gray-80 on the gray-90 page) so surfaces still read
 *   as surfaces, and its darkest is gray-5 rather than white so ink stays the strongest tone.
 * - Disabled swaps black-transparent for white-transparent and back, keeping each grade.
 * - Ink is white, ink-reverse is the page gray, and the page text colors follow.
 * - Component tokens that name white or black take ink-reverse or ink; a hue of grade 60 and up mirrors to its light
 *   counterpart; the reverse link tones, meant for dark surfaces that stay dark, keep the light theme's values.
 *
 * Contrast follows USWDS's magic numbers: text and background grades at least 50 apart meet 4.5:1, so a "dark" tone
 * (grade 30) on the page (grade 90) or on the lightest surface (grade 80) passes by construction.
 */
import fs from 'node:fs';
import path from 'node:path';

type Leaf = { $value: unknown; [key: string]: unknown };
type Group = { [key: string]: Group | Leaf };

export const LIGHT_FILE = 'uswds-theme/project-theme.tokens.json';
export const DARK_FILE = 'uswds-theme/project-theme-dark.tokens.json';
export const DERIVED_NOTE = `${DARK_FILE} by scripts/derive-dark-theme.ts from ${LIGHT_FILE}`;

/** Which tone each tone takes its value from. */
const MIRROR: Record<string, string> = {
    lightest: 'darkest',
    lighter: 'darker',
    light: 'dark',
    dark: 'light',
    darker: 'lighter',
    darkest: 'lightest',
};
/** The base ladder, by grade, from one step above the page to the strongest tone below ink. */
const BASE_GRADES: Record<string, string> = {
    lightest: '80',
    lighter: '70',
    light: '60',
    medium: '40',
    dark: '30',
    darker: '20',
    darkest: '5',
};
const PAGE_GRADE = '90';
const WHITE = '{general.usa.color.white}';

const isLeaf = (node: Group | Leaf): node is Leaf => '$value' in node;
const alias = (value: unknown) => (typeof value === 'string' ? value.match(/^\{([a-z0-9.-]+)\}$/i)?.[1] : undefined);
/** `color.usa.color.<hue>.<grade>` or `general.usa.color.<hue>` into its hue and grade. */
const primitive = (ref: string | undefined) => {
    const match = ref?.match(/^(?:color|general)\.usa\.color\.([a-z-]+?)(?:\.(\d+v?))?$/);
    return match ? { hue: match[1], grade: match[2] } : undefined;
};

const node = (tree: Group, segments: string[]): Group | Leaf | undefined =>
    segments.reduce<Group | Leaf | undefined>(
        (current, key) => (current && !isLeaf(current) ? current[key] : undefined),
        tree,
    );
const setValue = (tree: Group, segments: string[], value: string) => {
    const leaf = node(tree, segments);
    if (!leaf || !isLeaf(leaf)) throw new Error(`${segments.join('.')} is not a token`);
    leaf.$value = value;
};
/** Follows theme aliases in the light theme down to a primitive reference. */
const resolve = (light: Group, value: unknown): string => {
    let ref = alias(value);
    while (ref?.startsWith('uswds-theme.')) {
        const leaf = node(light, ref.split('.'));
        if (!leaf || !isLeaf(leaf)) throw new Error(`${ref} does not resolve`);
        ref = alias(leaf.$value);
    }
    return ref ? `{${ref}}` : String(value);
};
const leaves = function* (group: Group, prefix: string[] = []): Generator<[string[], Leaf]> {
    for (const [key, child] of Object.entries(group)) {
        if (key.startsWith('$')) continue;
        if (isLeaf(child)) yield [[...prefix, key], child];
        else yield* leaves(child, [...prefix, key]);
    }
};

export function deriveDarkTheme(tokensDir: string): { changed: number; total: number } | undefined {
    const lightPath = path.join(tokensDir, LIGHT_FILE);
    const darkPath = path.join(tokensDir, DARK_FILE);
    if (!fs.existsSync(lightPath) || !fs.existsSync(darkPath)) return undefined;

    const light: Group = JSON.parse(fs.readFileSync(lightPath, 'utf8'));
    const before: Group = JSON.parse(fs.readFileSync(darkPath, 'utf8'));
    const dark: Group = structuredClone(light);
    const theme = ['uswds-theme', 'theme'];
    const color = node(light, [...theme, 'color']);
    if (!color || isLeaf(color)) throw new Error(`${LIGHT_FILE} has no theme color families`);

    const baseHue =
        primitive(alias(resolve(light, (node(light, [...theme, 'color', 'base', 'darkest']) as Leaf).$value)))?.hue ??
        'gray';
    const gray = (grade: string) => `{color.usa.color.${baseHue}.${grade}}`;

    for (const [family, group] of Object.entries(color)) {
        if (isLeaf(group)) continue;
        for (const [tone, leaf] of Object.entries(group)) {
            if (!isLeaf(leaf)) continue;
            let next: string | undefined;
            if (family === 'base') next = BASE_GRADES[tone] && gray(BASE_GRADES[tone]);
            else if (family === 'disabled') {
                // The color collection has every transparent grade; the general one only some, so always alias color.
                const ref = primitive(alias(leaf.$value));
                if (ref?.hue === 'black-transparent') next = `{color.usa.color.white-transparent.${ref.grade}}`;
                if (ref?.hue === 'white-transparent') next = `{color.usa.color.black-transparent.${ref.grade}}`;
            } else if (family === 'emergency') next = undefined;
            else {
                const source = MIRROR[tone] && group[MIRROR[tone]];
                if (source && isLeaf(source)) next = String(source.$value);
            }
            if (next) setValue(dark, [...theme, 'color', family, tone], next);
        }
    }
    setValue(dark, [...theme, 'color', 'ink'], WHITE);
    setValue(dark, [...theme, 'color', 'ink-reverse'], gray(PAGE_GRADE));
    setValue(dark, [...theme, 'page', 'text-color'], WHITE);
    setValue(dark, [...theme, 'page', 'text-color-on-dark'], WHITE);

    const component = node(dark, ['uswds-theme', 'component']);
    if (component && !isLeaf(component)) {
        for (const [segments, leaf] of leaves(component)) {
            if (segments[0] === 'link' && segments[1].startsWith('reverse-')) {
                leaf.$value = resolve(light, leaf.$value);
                continue;
            }
            const ref = primitive(alias(leaf.$value));
            if (!ref) continue;
            if (ref.hue === 'black') leaf.$value = '{uswds-theme.theme.color.ink}';
            else if (ref.hue === 'white') leaf.$value = '{uswds-theme.theme.color.ink-reverse}';
            else if (ref.grade && Number.parseInt(ref.grade, 10) >= 60)
                leaf.$value = `{color.usa.color.${ref.hue}.${100 - Number.parseInt(ref.grade, 10)}${ref.grade.endsWith('v') ? 'v' : ''}}`;
        }
    }

    fs.writeFileSync(darkPath, `${JSON.stringify(dark, null, 4)}\n`);
    const manifestPath = path.join(tokensDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.source?.derived !== DERIVED_NOTE) {
        manifest.source = { ...manifest.source, derived: DERIVED_NOTE };
        fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 4)}\n`);
    }

    const after = new Map([...leaves(dark)].map(([segments, leaf]) => [segments.join('.'), String(leaf.$value)]));
    const previous = new Map([...leaves(before)].map(([segments, leaf]) => [segments.join('.'), String(leaf.$value)]));
    const lightValues = new Map(
        [...leaves(light)].map(([segments, leaf]) => [segments.join('.'), String(leaf.$value)]),
    );
    const changed = [...after].filter(([key, value]) => previous.get(key) !== value).length;
    const differs = [...after].filter(([key, value]) => lightValues.get(key) !== value).length;
    console.log(
        `Derived ${DARK_FILE} from ${LIGHT_FILE}: ${differs} of ${after.size} values differ from the light theme` +
            (changed ? `, ${changed} changed in this run` : ', no change'),
    );
    return { changed, total: after.size };
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
    const root = path.resolve(import.meta.dirname, '..');
    const result = deriveDarkTheme(path.join(root, 'tokens'));
    if (!result) throw new Error(`tokens/${LIGHT_FILE} or tokens/${DARK_FILE} is missing`);
}
