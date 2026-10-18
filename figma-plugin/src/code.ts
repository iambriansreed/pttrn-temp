/** Set by scripts/build.js from package.json when the plugin is compiled. */
declare const PLUGIN_VERSION: string;

const WINDOW_WIDTH = 320;

figma.showUI(__html__, {
    title: 'pttrn - Export Tokens',
    themeColors: true,
    width: WINDOW_WIDTH,
    height: 120,
});

interface Value {
    text: string;
    refs: string[];
}

interface Prop {
    collectionId?: string;
    group: string;
    comment: string;
    name: string;
    def: Value;
    modes: Map<string, Value>;
}

interface ImageFile {
    name: string;
    mime: string;
    bytes: Uint8Array;
}

interface TextRule {
    style: string;
    className: string;
    size: number;
    weight: number;
    italic: boolean;
    decorated: boolean;
    decls: string[];
}

interface Entry {
    variable: Variable;
    collection: VariableCollection;
    name: string;
}

interface CssFile {
    name: string;
    css: string;
}

/** A DTCG token file for the tokens/ folder of the download. */
interface TokenFile {
    name: string;
    text: string;
}

const WEIGHTS: Record<string, number> = {
    thin: 100,
    hairline: 100,
    extralight: 200,
    ultralight: 200,
    light: 300,
    regular: 400,
    normal: 400,
    book: 400,
    medium: 500,
    semibold: 600,
    demibold: 600,
    bold: 700,
    extrabold: 800,
    ultrabold: 800,
    heavy: 800,
    black: 900,
};

const IMAGE_DIR = 'images';

// The theme collection's modes are written as separate theme files, and everything else goes in BASE_FILE. Built for
// the USWDS Design Kit, so a collection with this name is the theme unless the panel picked another one (or none); the
// choice is stored in the file, so it holds for everyone who runs the plugin there.
const DEFAULT_THEME_COLLECTION = 'USWDS Theme';
const THEME_SETTING = 'themeCollection';
const NO_THEME = 'none';
const BASE_FILE = 'tokens.css';
const THEME_DIR = 'themes';

/** A variable collection with several modes, offered in the panel as the theme collection. */
interface ThemeOption {
    id: string;
    name: string;
    modes: number;
}

async function themeOptions(): Promise<ThemeOption[]> {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    return collections
        .filter((collection) => collection.modes.length > 1)
        .map((collection) => ({ id: collection.id, name: collection.name, modes: collection.modes.length }));
}

// The saved choice first, then the kit's collection, then any collection with "theme" in its name.
function pickThemeCollection(options: ThemeOption[], saved: string): string | null {
    if (saved === NO_THEME) return null;
    if (saved && options.some((option) => option.id === saved)) return saved;
    const option =
        options.find((option) => option.name === DEFAULT_THEME_COLLECTION) ??
        options.find((option) => /theme/i.test(option.name));
    return option ? option.id : null;
}

function readThemeSetting() {
    try {
        return figma.root.getPluginData(THEME_SETTING);
    } catch {
        return '';
    }
}

function saveThemeSetting(value: string) {
    try {
        figma.root.setPluginData(THEME_SETTING, value);
    } catch {
        // A view-only file cannot store plugin data; the choice still applies to this export.
    }
}

const GRID_ALIGNMENTS = { MIN: 'start', MAX: 'end', CENTER: 'center', STRETCH: 'stretch' };

const round = (n: number, digits = 4) => Number(n.toFixed(digits));
const num = (n: number, digits = 4) => String(round(n, digits));
const px = (n: number) => `${num(n)}px`;

const slug = (text: string) =>
    text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const cssIdent = (path: string) => path.split('/').map(slug).filter(Boolean).join('-') || 'unnamed';

// Figma names can hold U+2028/U+2029, which editors flag as unusual line terminators.
const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

// Local time with its UTC offset, e.g. "September 27, 2026 at 9:03 PM (UTC-04:00)".
function formatTimestamp(date: Date) {
    const hours = date.getHours();
    const offset = -date.getTimezoneOffset();
    const zone = `UTC${offset < 0 ? '-' : '+'}${pad2(Math.floor(Math.abs(offset) / 60))}:${pad2(Math.abs(offset) % 60)}`;
    const time = `${hours % 12 || 12}:${pad2(date.getMinutes())} ${hours < 12 ? 'AM' : 'PM'}`;
    return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} at ${time} (${zone})`;
}

const words = (name: string) =>
    name
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean);

// Plain, regular-looking variants win, so a bold or underlined style is not picked for a default element.
function fit(rule: TextRule, weight: number, size?: number) {
    const distance = size === undefined ? 0 : Math.abs(rule.size - size) * 100;
    return distance + Math.abs(rule.weight - weight) + (rule.decorated ? 1000 : 0) + (rule.italic ? 500 : 0);
}

function best(rules: TextRule[], weight: number, size?: number) {
    return rules.slice().sort((a, b) => fit(a, weight, size) - fit(b, weight, size))[0];
}

// Picks which text style becomes each element by its name and size, since Figma has no such field.
function pickElements(rules: TextRule[]) {
    const picks = new Map<string, TextRule>();
    const named = (list: string[]) => rules.filter((rule) => words(rule.style).some((w) => list.indexOf(w) !== -1));

    // An explicit "H1".."H6" in the name says which element it is.
    for (let level = 1; level <= 6; level++) {
        const matches = rules.filter((rule) => words(rule.style).indexOf(`h${level}`) !== -1);
        if (matches.length) picks.set(`h${level}`, best(matches, 500));
    }

    // With no explicit names, headings are ranked by size, largest first, one style per size.
    const bySize = new Map<number, TextRule[]>();
    named(['heading', 'headline', 'title', 'display'])
        .filter((rule) => !words(rule.style).some((w) => /^h[1-6]$/.test(w)))
        .forEach((rule) => bySize.set(rule.size, (bySize.get(rule.size) ?? []).concat(rule)));
    const sizes = picks.size ? [] : Array.from(bySize.keys()).sort((a, b) => b - a);
    for (let level = 1, next = 0; level <= 6 && next < sizes.length; level++) {
        if (!picks.has(`h${level}`)) picks.set(`h${level}`, best(bySize.get(sizes[next++]) as TextRule[], 500));
    }

    const paragraph = named(['paragraph', 'body']);
    if (paragraph.length) picks.set('p', best(paragraph, 400, 16));
    const small = named(['small', 'caption', 'footnote', 'helper']);
    if (small.length) picks.set('small', best(small, 400, 12));
    const code = named(['code', 'mono', 'monospace']);
    if (code.length) picks.set('code', best(code, 400, 14));

    return picks;
}

const clean = (text: string) => text.replace(/\*\//g, '* /').replace(/[\u2028\u2029]/g, ' ');
const comment = (text: string) => `/* ${clean(text)} */`;
const blockComment = (lines: string[]) =>
    ['/*', ...lines.map((line) => (line ? ` * ${clean(line)}` : ' *')), ' */'].join('\n');

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

const rgb = ({ r, g, b, a }: RGB & { a?: number }, opacity = 1) => {
    const channels = `${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)}`;
    const alpha = round((a ?? 1) * opacity * 100, 2);
    return alpha === 100 ? `rgb(${channels})` : `rgb(${channels} / ${alpha}%)`;
};

const isFont = (value: unknown): value is FontName =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as FontName).family === 'string' &&
    typeof (value as FontName).style === 'string';

function imageType(bytes: Uint8Array) {
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return { mime: 'image/jpeg', ext: 'jpg' };
    if (bytes[0] === 0x47 && bytes[1] === 0x49) return { mime: 'image/gif', ext: 'gif' };
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57) return { mime: 'image/webp', ext: 'webp' };
    return { mime: 'image/png', ext: 'png' };
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

function parseFontStyle(style: string | undefined) {
    const key = (style ?? '').toLowerCase().replace(/[\s-]+/g, '');
    return {
        italic: /italic|oblique/.test(key),
        weight: WEIGHTS[key.replace(/italic|oblique/g, '')] ?? 400,
    };
}

// Figma's gradientTransform maps node space to gradient space, so the gradient's x axis in node space is the inverse.
function linearAngle([[a, b], [c, d]]: Transform) {
    const det = a * d - b * c;
    if (!det) return 180;
    return ((Math.atan2(d / det, c / det) * 180) / Math.PI + 360) % 360;
}

const isAlias = (value: VariableValue): value is VariableAlias =>
    typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS';

// A font weight of "700px" is never valid, so FLOATs scoped only to font weight stay unitless.
const isUnitless = ({ scopes }: Variable) => scopes.length > 0 && scopes.every((scope) => scope === 'FONT_WEIGHT');

const yieldToUi = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const send = (label: string, fraction: number) => figma.ui.postMessage({ type: 'EXPORT_PROGRESS', label, fraction });

async function buildStylesheet(themeCollectionId: string | null): Promise<{
    css: string;
    files: CssFile[];
    tokenFiles: TokenFile[];
    tokens: number;
    themes: number;
    skipped: string[];
    images: ImageFile[];
    properties: number;
    modeAttributes: number;
}> {
    const warnings = new Set<string>();
    const usedNames = new Set<string>();
    const collectionsById = new Map<string, VariableCollection>();
    const entries = new Map<string, Entry>();
    const pending: Entry[] = [];
    const variableProps: Prop[] = [];
    const styleProps: Prop[] = [];
    const textRules: TextRule[] = [];
    const usedClasses = new Set<string>();
    const imageFiles = new Map<string, ImageFile>();
    const usedFiles = new Set<string>();

    // The first claimant keeps the plain name. Later ones get the group as a prefix, then a counter.
    function claim(path: string, group: string) {
        const base = cssIdent(path);
        let name = base;
        if (usedNames.has(name)) name = `${slug(group) || 'x'}-${base}`;
        for (let i = 2; usedNames.has(name); i++) name = `${slug(group) || 'x'}-${base}-${i}`;
        usedNames.add(name);
        return `--${name}`;
    }

    function register(variable: Variable, collection: VariableCollection) {
        const entry: Entry = { variable, collection, name: claim(variable.name, collection.name) };
        entries.set(variable.id, entry);
        pending.push(entry);
        return entry;
    }

    // Aliases can point at variables outside this file's local set (e.g. from a library), so fetch and register them too.
    async function lookup(id: string): Promise<Entry | null> {
        const known = entries.get(id);
        if (known) return known;

        const variable = await figma.variables.getVariableByIdAsync(id);
        if (!variable) return null;

        let collection = collectionsById.get(variable.variableCollectionId);
        if (!collection) {
            const fetched = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
            if (!fetched) return null;
            collection = fetched;
            collectionsById.set(fetched.id, fetched);
        }

        return register(variable, collection);
    }

    async function ref(alias: VariableAlias | undefined, refs: string[]): Promise<string | null> {
        if (!alias) return null;

        const target = await lookup(alias.id);
        if (!target) {
            warnings.add(`unresolved variable reference ${alias.id}`);
            return null;
        }

        refs.push(target.name);
        return `var(${target.name})`;
    }

    async function part(alias: VariableAlias | undefined, literal: string): Promise<Value> {
        const refs: string[] = [];
        const text = await ref(alias, refs);
        return { text: text ?? literal, refs };
    }

    async function variableValue({ variable }: Entry, modeId: string): Promise<Value | null> {
        const raw = variable.valuesByMode[modeId];
        if (raw === undefined) return null;

        const refs: string[] = [];
        if (isAlias(raw)) {
            const text = await ref(raw, refs);
            return text ? { text, refs } : null;
        }

        switch (variable.resolvedType) {
            case 'COLOR':
                return { text: rgb(raw as RGBA), refs };
            case 'FLOAT':
                return { text: isUnitless(variable) ? num(raw as number) : px(raw as number), refs };
            case 'STRING':
                return { text: JSON.stringify(raw), refs };
            default:
                return { text: String(raw), refs };
        }
    }

    async function variableProp(entry: Entry): Promise<Prop | null> {
        const { variable, collection } = entry;

        const def = await variableValue(entry, collection.defaultModeId);
        if (!def) {
            warnings.add(`${variable.name} has no value for its default mode`);
            return null;
        }

        const modes = new Map<string, Value>();
        for (const mode of collection.modes) {
            if (mode.modeId === collection.defaultModeId) continue;

            const value = await variableValue(entry, mode.modeId);
            if (value) modes.set(slug(mode.name) || 'mode', value);
        }

        return {
            collectionId: collection.id,
            group: collection.name,
            comment: variable.name,
            name: entry.name,
            def,
            modes,
        };
    }

    let converted = 0;
    async function flush() {
        for (let entry = pending.shift(); entry; entry = pending.shift()) {
            try {
                const prop = await variableProp(entry);
                if (prop) variableProps.push(prop);
            } catch (error) {
                warnings.add(`${entry.variable.name}: ${errorMessage(error)}`);
            }

            converted++;
            if (converted % 25 === 0) {
                const total = converted + pending.length;
                send(`Converting variables (${converted} of ${total})`, 0.1 + 0.6 * (converted / total));
                await yieldToUi();
            }
        }
    }

    function addStyleProp(group: string, label: string, name: string, text: string, refs: string[] = []) {
        styleProps.push({ group, comment: label, name, def: { text, refs }, modes: new Map() });
    }

    async function paintLayer(
        paint: Paint,
        refs: string[],
        label: string,
    ): Promise<{ css: string; solid: boolean } | null> {
        const opacity = paint.opacity ?? 1;

        switch (paint.type) {
            case 'SOLID': {
                const bound = opacity === 1 ? await ref(paint.boundVariables?.color, refs) : null;
                return { css: bound ?? rgb(paint.color, opacity), solid: true };
            }
            case 'GRADIENT_LINEAR':
            case 'GRADIENT_RADIAL':
            case 'GRADIENT_ANGULAR': {
                const stops = paint.gradientStops
                    .map(({ color, position }) => `${rgb(color, opacity)} ${num(position * 100, 2)}%`)
                    .join(', ');

                if (paint.type === 'GRADIENT_LINEAR') {
                    const angle = num(linearAngle(paint.gradientTransform), 2);
                    return { css: `linear-gradient(${angle}deg, ${stops})`, solid: false };
                }

                const fn = paint.type === 'GRADIENT_RADIAL' ? 'radial-gradient' : 'conic-gradient';
                return { css: `${fn}(${stops})`, solid: false };
            }
            case 'IMAGE': {
                const hash = paint.imageHash;
                const image = hash ? figma.getImageByHash(hash) : null;
                if (!hash || !image) throw new Error('its image could not be found');

                // The same image used by several styles is downloaded once.
                let file = imageFiles.get(hash);
                if (!file) {
                    const bytes = await image.getBytesAsync();
                    const { mime, ext } = imageType(bytes);
                    const base = cssIdent(label);
                    let name = `${base}.${ext}`;
                    for (let i = 2; usedFiles.has(name); i++) name = `${base}-${i}.${ext}`;
                    usedFiles.add(name);
                    file = { name, mime, bytes };
                    imageFiles.set(hash, file);
                }

                const url = `url("${IMAGE_DIR}/${file.name}")`;
                if (paint.scaleMode === 'TILE') {
                    const { width } = await image.getSizeAsync();
                    return { css: `${url} 0 0 / ${px(width * (paint.scalingFactor ?? 1))} auto repeat`, solid: false };
                }

                const size = paint.scaleMode === 'FIT' ? 'contain' : 'cover';
                return { css: `${url} center / ${size} no-repeat`, solid: false };
            }
            default:
                return null;
        }
    }

    // Phase 1: variables.
    send('Reading variables', 0.02);
    const [collections, localVariables] = await Promise.all([
        figma.variables.getLocalVariableCollectionsAsync(),
        figma.variables.getLocalVariablesAsync(),
    ]);
    const variablesById = new Map(localVariables.map((variable) => [variable.id, variable] as const));

    for (const collection of collections) {
        collectionsById.set(collection.id, collection);
        for (const id of collection.variableIds) {
            const variable = variablesById.get(id);
            if (variable) register(variable, collection);
        }
    }

    send(`Converting variables (0 of ${pending.length})`, 0.1);
    await flush();

    // Phase 2: styles.
    send('Reading styles', 0.7);
    const [paintStyles, effectStyles, textStyles, gridStyles] = await Promise.all([
        figma.getLocalPaintStylesAsync(),
        figma.getLocalEffectStylesAsync(),
        figma.getLocalTextStylesAsync(),
        figma.getLocalGridStylesAsync(),
    ]);

    const styleTotal = paintStyles.length + effectStyles.length + textStyles.length + gridStyles.length;
    let styleDone = 0;
    async function styleTick() {
        styleDone++;
        if (styleDone % 10 === 0 || styleDone === styleTotal) {
            send(`Converting styles (${styleDone} of ${styleTotal})`, 0.7 + 0.25 * (styleDone / styleTotal));
            await yieldToUi();
        }
    }

    // One odd style must not sink the export, so each one converts on its own and failures become notes.
    async function each<T extends { name: string }>(styles: readonly T[], convert: (style: T) => Promise<void>) {
        for (const style of styles) {
            try {
                await convert(style);
            } catch (error) {
                warnings.add(`${style.name}: ${errorMessage(error)}`);
            }
            await styleTick();
        }
    }

    await each(paintStyles, async (style) => {
        const refs: string[] = [];
        const layers: { css: string; solid: boolean }[] = [];

        for (const paint of style.paints) {
            if (paint.visible === false) continue;

            const layer = await paintLayer(paint, refs, style.name);
            if (layer) layers.push(layer);
            else warnings.add(`${style.name} uses the unsupported paint type ${paint.type}`);
        }

        if (layers.length) {
            // Figma lists paints bottom first, CSS lists backgrounds top first.
            const text =
                layers.length === 1
                    ? layers[0].css
                    : layers
                          .reverse()
                          .map(({ css, solid }) => (solid ? `linear-gradient(${css}, ${css})` : css))
                          .join(', ');
            addStyleProp('Paint styles', style.name, claim(style.name, 'paint'), text, refs);
        }
    });

    await each(effectStyles, async (style) => {
        const refs: string[] = [];
        const shadows: string[] = [];
        let blur: string | null = null;
        let backdropBlur: string | null = null;

        for (const effect of style.effects) {
            if (!effect.visible) continue;

            if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
                const color = (await ref(effect.boundVariables?.color, refs)) ?? rgb(effect.color);
                const inset = effect.type === 'INNER_SHADOW' ? 'inset ' : '';
                const { x, y } = effect.offset;
                shadows.push(`${inset}${px(x)} ${px(y)} ${px(effect.radius)} ${px(effect.spread ?? 0)} ${color}`);
            } else if (effect.type === 'LAYER_BLUR') {
                // Figma's blur radius is twice the standard deviation CSS blur() takes.
                blur = `blur(${px(effect.radius / 2)})`;
            } else if (effect.type === 'BACKGROUND_BLUR') {
                backdropBlur = `blur(${px(effect.radius / 2)})`;
            }
        }

        if (shadows.length) {
            addStyleProp('Effect styles', style.name, claim(style.name, 'effect'), shadows.join(', '), refs);
        }
        if (blur) {
            addStyleProp('Effect styles', `${style.name} (blur)`, claim(`${style.name}/blur`, 'effect'), blur);
        }
        if (backdropBlur) {
            const name = claim(`${style.name}/backdrop-blur`, 'effect');
            addStyleProp('Effect styles', `${style.name} (backdrop blur)`, name, backdropBlur);
        }
    });

    let unreadableFonts = 0;
    let unreadableSample = '';
    let unreadableError = '';

    // A style's fontName can come back as figma.mixed, so read the font through a temporary text layer instead.
    async function fontThroughTextNode(style: TextStyle): Promise<FontName | null> {
        let node: TextNode | null = null;
        try {
            node = figma.createText();
            await node.setTextStyleIdAsync(style.id);
            const font = node.fontName;
            return isFont(font) ? font : null;
        } catch (error) {
            unreadableError ||= errorMessage(error);
            return null;
        } finally {
            node?.remove();
        }
    }

    await each(textStyles, async (style) => {
        const bound = style.boundVariables ?? {};
        const fontName = isFont(style.fontName) ? style.fontName : await fontThroughTextNode(style);
        if (!fontName && !bound.fontFamily) {
            unreadableFonts++;
            unreadableSample ||= JSON.stringify(style.fontName) ?? typeof style.fontName;
        }

        const { italic, weight } = parseFontStyle(fontName?.style);
        const { lineHeight, letterSpacing } = style;

        const family =
            fontName || bound.fontFamily ? await part(bound.fontFamily, JSON.stringify(fontName?.family)) : null;
        const size = await part(bound.fontSize, px(style.fontSize));
        const fontWeight = fontName || bound.fontWeight ? await part(bound.fontWeight, String(weight)) : null;
        const lineHeightText =
            lineHeight.unit === 'AUTO'
                ? 'normal'
                : lineHeight.unit === 'PIXELS'
                  ? px(lineHeight.value)
                  : num(lineHeight.value / 100);
        const lh = await part(bound.lineHeight, lineHeightText);
        const spacingText =
            letterSpacing.unit === 'PIXELS' ? px(letterSpacing.value) : `${num(letterSpacing.value / 100)}em`;
        const ls = await part(bound.letterSpacing, spacingText);

        const fontStyle = italic ? 'italic' : 'normal';

        // The font shorthand is invalid without a family, so it is only written when the font is known.
        let shorthandName: string | null = null;
        if (family && fontWeight) {
            const shorthand = `${fontStyle} ${fontWeight.text} ${size.text}/${lh.text} ${family.text}`;
            const shorthandRefs = [...family.refs, ...size.refs, ...fontWeight.refs, ...lh.refs];
            shorthandName = claim(style.name, 'text');
            addStyleProp('Text styles', style.name, shorthandName, shorthand, shorthandRefs);
        }

        const parts: [string, string, Value][] = [];
        if (family) parts.push(['font-family', 'font family', family]);
        parts.push(['font-size', 'font size', size]);
        if (fontWeight) parts.push(['font-weight', 'font weight', fontWeight]);
        parts.push(['line-height', 'line height', lh], ['letter-spacing', 'letter spacing', ls]);
        if (italic) parts.push(['font-style', 'font style', { text: fontStyle, refs: [] }]);

        const decorations = { NONE: '', UNDERLINE: 'underline', STRIKETHROUGH: 'line-through' };
        if (decorations[style.textDecoration]) {
            parts.push(['text-decoration', 'text decoration', { text: decorations[style.textDecoration], refs: [] }]);
        }

        const cases: Record<string, string> = { UPPER: 'uppercase', LOWER: 'lowercase', TITLE: 'capitalize' };
        if (cases[style.textCase]) {
            parts.push(['text-transform', 'text transform', { text: cases[style.textCase], refs: [] }]);
        }

        const names: Record<string, string> = {};
        for (const [key, label, value] of parts) {
            const name = claim(`${style.name}/${key}`, 'text');
            names[key] = name;
            addStyleProp('Text styles', `${style.name} (${label})`, name, value.text, value.refs);
        }

        // The rule refers to the tokens above, so changing a token changes every use of it.
        const longhands = shorthandName ? [] : ['font-family', 'font-size', 'font-weight', 'line-height', 'font-style'];
        const decls = (shorthandName ? [`font: var(${shorthandName});`] : []).concat(
            longhands
                .concat(['letter-spacing', 'text-decoration', 'text-transform'])
                .filter((key) => names[key])
                .map((key) => `${key}: var(${names[key]});`),
        );
        const base = cssIdent(style.name);
        let className = base;
        for (let i = 2; usedClasses.has(className); i++) className = `${base}-${i}`;
        usedClasses.add(className);
        textRules.push({
            style: style.name,
            className,
            size: style.fontSize,
            weight,
            italic,
            decorated: style.textDecoration !== 'NONE',
            decls,
        });
    });

    if (unreadableFonts) {
        warnings.add(
            `${unreadableFonts} text styles have no readable font name (fontName is ${unreadableSample}${unreadableError ? `; reading it through a text layer failed: ${unreadableError}` : ''}), so their font family, weight and shorthand were left out`,
        );
    }

    await each(gridStyles, async (style) => {
        const seen = new Map<string, number>();

        for (const grid of style.layoutGrids) {
            if (grid.visible === false) continue;

            const kind = grid.pattern.toLowerCase();
            const count = (seen.get(kind) ?? 0) + 1;
            seen.set(kind, count);
            const path = `${style.name}/${kind}${count > 1 ? `-${count}` : ''}`;

            const values: [string, string][] = [];
            if (grid.pattern === 'GRID') {
                values.push(['size', px(grid.sectionSize)]);
            } else {
                if (Number.isFinite(grid.count)) values.push(['count', String(grid.count)]);
                values.push(['gutter', px(grid.gutterSize)]);
                if (grid.offset !== undefined) values.push(['margin', px(grid.offset)]);
                if (grid.sectionSize !== undefined && grid.alignment !== 'STRETCH') {
                    values.push(['size', px(grid.sectionSize)]);
                }
                values.push(['alignment', GRID_ALIGNMENTS[grid.alignment]]);
            }

            for (const [key, text] of values) {
                addStyleProp('Grid styles', `${style.name} (${kind} ${key})`, claim(`${path}/${key}`, 'grid'), text);
            }
        }
    });

    // Styles can alias variables that were not local, so convert those too.
    await flush();

    // Phase 3: assemble.
    send('Building stylesheet', 0.96);
    const props = variableProps.concat(styleProps);
    if (!props.length) throw new Error('This file has no local variables or styles to export.');

    const isThemed = (prop: Prop) => Array.from(prop.modes.values()).some((value) => value.text !== prop.def.text);

    function block(selector: string, items: { prop: Prop; value: Value }[]) {
        const lines = [`${selector} {`];
        let group: string | null = null;

        for (const { prop, value } of items) {
            if (prop.group !== group) {
                if (group !== null) lines.push('');
                lines.push(`    ${comment(prop.group)}`);
                group = prop.group;
            }
            lines.push(`    ${comment(prop.comment)}`, `    ${prop.name}: ${value.text};`);
        }

        lines.push('}');
        return lines.join('\n');
    }

    // Each collection picks its mode independently in Figma, so each gets its own attribute: a collection named
    // "Breakpoint" is switched with [data-breakpoint="md"], and only touches its own variables.
    const collectionsInUse = new Map<string, VariableCollection>();
    entries.forEach(({ collection }) => collectionsInUse.set(collection.id, collection));

    const collectionOrder: string[] = [];
    variableProps.forEach(({ collectionId }) => {
        if (collectionId && collectionOrder.indexOf(collectionId) === -1) collectionOrder.push(collectionId);
    });

    const usedAttrs = new Set<string>();
    const scoped = new Set<string>();
    const scopeBlocks: { collectionId: string; css: string }[] = [];
    const modeIndex: { attr: string; values: string[] }[] = [];
    let themeSet:
        | {
              collection: VariableCollection;
              attr: string;
              defaultKey: string;
              keys: string[];
              own: Prop[];
              outside: Prop[];
          }
        | undefined;
    const defaults = (list: Prop[]) => list.map((prop) => ({ prop, value: prop.def }));
    const scopedCollections = new Map<string, { attr: string; defaultKey: string; keys: string[] }>();

    for (const id of collectionOrder) {
        const collection = collectionsInUse.get(id);
        if (!collection || collection.modes.length < 2) continue;

        const own = variableProps.filter((prop) => prop.collectionId === id);
        const themed = own.filter(isThemed);
        if (!themed.length) continue;

        // A var() is resolved where it is declared and then inherited, so anything that aliases a themed property
        // must be redeclared in every block of this collection, or a nested attribute keeps the outer value.
        // A property themed by another collection is left alone, because its value there depends on that mode.
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

        const base = slug(collection.name) || 'mode';
        let attr = base;
        for (let i = 2; usedAttrs.has(attr); i++) attr = `${base}-${i}`;
        usedAttrs.add(attr);
        const selector = (key: string) => `[data-${attr}="${key}"]`;

        const defaultMode = collection.modes.find((mode) => mode.modeId === collection.defaultModeId);
        const defaultKey = slug(defaultMode?.name ?? '') || 'mode';

        own.forEach((prop) => scoped.add(prop.name));
        const push = (css: string) => scopeBlocks.push({ collectionId: id, css });
        push(block(`:root, ${selector(defaultKey)}`, defaults(own)));
        // The block above already declares this collection's own dependents, so only those from other collections
        // need the default selector again.
        const outside = dependents.filter((prop) => prop.collectionId !== id);
        if (outside.length) push(block(selector(defaultKey), defaults(outside)));

        const keys: string[] = [];
        for (const mode of collection.modes) {
            const key = slug(mode.name) || 'mode';
            if (mode.modeId !== collection.defaultModeId && key !== defaultKey && keys.indexOf(key) === -1) {
                keys.push(key);
            }
        }

        modeIndex.push({ attr: `[data-${attr}]`, values: [`${defaultKey} (default)`, ...keys] });
        scopedCollections.set(id, { attr, defaultKey, keys });
        if (collection.id === themeCollectionId) themeSet = { collection, attr, defaultKey, keys, own, outside };

        for (const key of keys) {
            const overrides = themed.map((prop) => ({ prop, value: prop.modes.get(key) ?? prop.def }));
            push(block(selector(key), overrides.concat(defaults(dependents))));
        }
    }

    const baseProps = props.filter((prop) => !scoped.has(prop.name));
    const rootBlocks = baseProps.length
        ? [
              block(
                  ':root',
                  baseProps.map((prop) => ({ prop, value: prop.def })),
              ),
          ]
        : [];
    const ruleBlocks: string[] = [];

    const ELEMENTS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'small', 'code'];
    const picks = pickElements(textRules.filter((rule) => rule.decls.length));
    const textRule = (selector: string, { style, decls }: TextRule) =>
        `${comment(style)}\n${selector} {\n${decls.map((decl) => `    ${decl}`).join('\n')}\n}`;

    if (picks.size) {
        ruleBlocks.push(comment('Element defaults, built from the text styles named in the header'));
        ELEMENTS.forEach((element) => {
            const pick = picks.get(element);
            if (pick) ruleBlocks.push(textRule(element, pick));
        });
    }

    const classRules = textRules.filter((rule) => rule.decls.length);
    if (classRules.length) {
        ruleBlocks.push(comment('Text style classes'));
        classRules.forEach((rule) => ruleBlocks.push(textRule(`.${rule.className}`, rule)));
    }

    // Phase 4: the token files. The same properties as DTCG documents, one per collection (and per mode), which is
    // what @ptrn/styles builds its stylesheets from. Values that have no DTCG form stay in the stylesheets only.
    send('Building token files', 0.98);
    const exportedAt = formatTimestamp(new Date());
    const tokenFiles: TokenFile[] = [];
    const cssOnly: string[] = [];
    {
        interface TokenJson {
            $type?: string;
            $value: unknown;
            $extensions: { pttrn: { css: string; figma: string } };
        }
        interface Json {
            [key: string]: Json | TokenJson;
        }
        interface TokenCollection {
            name: string;
            slug: string;
            kind: 'variables' | 'styles';
            props: Prop[];
            attribute?: string;
            modes?: string[];
            defaultMode?: string;
            theme?: boolean;
        }

        const usedSlugs = new Set<string>();
        const collectionSlug = (name: string) => {
            const base = slug(name) || 'collection';
            let next = base;
            for (let i = 2; usedSlugs.has(next); i++) next = `${base}-${i}`;
            usedSlugs.add(next);
            return next;
        };

        const tokenCollections: TokenCollection[] = [];
        for (const id of collectionOrder) {
            const collection = collectionsInUse.get(id);
            if (!collection) continue;
            const entry: TokenCollection = {
                name: collection.name,
                slug: collectionSlug(collection.name),
                kind: 'variables',
                props: variableProps.filter((prop) => prop.collectionId === id),
            };
            const scope = scopedCollections.get(id);
            if (scope) {
                entry.attribute = `data-${scope.attr}`;
                entry.modes = [scope.defaultKey].concat(scope.keys);
                entry.defaultMode = scope.defaultKey;
                if (collection.id === themeCollectionId) entry.theme = true;
            }
            tokenCollections.push(entry);
        }
        const styleGroups: string[] = [];
        styleProps.forEach((prop) => {
            if (styleGroups.indexOf(prop.group) === -1) styleGroups.push(prop.group);
        });
        for (const group of styleGroups) {
            tokenCollections.push({
                name: group,
                slug: collectionSlug(group),
                kind: 'styles',
                props: styleProps.filter((prop) => prop.group === group),
            });
        }

        // `{collection}.{figma name segments}`: `!-usa/color/red/5` in the Color collection is `color.usa.color.red.5`.
        const pathOf = (collection: TokenCollection, prop: Prop) => {
            const segments = prop.comment.split('/').map(slug).filter(Boolean);
            return [collection.slug].concat(segments.length ? segments : ['unnamed']).join('.');
        };
        const pathByCss = new Map<string, string>();
        for (const collection of tokenCollections) {
            for (const prop of collection.props) pathByCss.set(prop.name, pathOf(collection, prop));
        }

        const hex2 = (n: number) => (n < 16 ? '0' : '') + n.toString(16);
        const dimension = (value: string) => ({ value: Number(value), unit: 'px' });
        const toToken = (text: string, prop: Prop): { $type?: string; $value: unknown } | null => {
            const alias = text.match(/^var\((--[A-Za-z0-9_-]+)\)$/);
            if (alias) {
                const target = pathByCss.get(alias[1]);
                return target ? { $value: `{${target}}` } : null;
            }
            const color = text.match(/^rgb\((\d+) (\d+) (\d+)(?: \/ (\d*\.?\d+)%)?\)$/);
            if (color) {
                const [r, g, b] = [Number(color[1]), Number(color[2]), Number(color[3])];
                return {
                    $type: 'color',
                    $value: {
                        colorSpace: 'srgb',
                        components: [round(r / 255), round(g / 255), round(b / 255)],
                        alpha: color[4] === undefined ? 1 : round(Number(color[4]) / 100),
                        hex: `#${hex2(r)}${hex2(g)}${hex2(b)}`,
                    },
                };
            }
            const pixels = text.match(/^(-?\d*\.?\d+)px$/);
            if (pixels) return { $type: 'dimension', $value: dimension(pixels[1]) };
            if (/^-?\d*\.?\d+$/.test(text)) return { $type: 'number', $value: Number(text) };
            if (text === 'true' || text === 'false') return { $type: 'boolean', $value: text === 'true' };
            const quoted = text.match(/^"(.*)"$/);
            if (quoted) {
                // A variable named "font-family/sans" or a text style's "(font family)" property.
                const about = (what: string) =>
                    new RegExp(`font[-\\s/]?${what}`, 'i').test(`${prop.comment} ${prop.name}`);
                if (about('family')) return { $type: 'fontFamily', $value: quoted[1] };
                if (about('weight')) return { $type: 'fontWeight', $value: quoted[1] };
                // No DTCG type fits a plain string (a size name, a focus style); `string` is pttrn's extension.
                return { $type: 'string', $value: quoted[1] };
            }
            const layers = text.split(/,(?![^(]*\))/).map((layer) => {
                const shadow = layer
                    .trim()
                    .match(/^(inset )?(-?\d*\.?\d+)px (-?\d*\.?\d+)px (-?\d*\.?\d+)px (-?\d*\.?\d+)px (rgb\(.*\))$/);
                const shadowColor = shadow ? toToken(shadow[6], prop) : null;
                if (!shadow || !shadowColor || shadowColor.$type !== 'color') return null;
                return Object.assign(shadow[1] ? { inset: true } : {}, {
                    color: shadowColor.$value,
                    offsetX: dimension(shadow[2]),
                    offsetY: dimension(shadow[3]),
                    blur: dimension(shadow[4]),
                    spread: dimension(shadow[5]),
                });
            });
            if (layers.length && layers.every((layer) => layer !== null)) {
                return { $type: 'shadow', $value: layers.length === 1 ? layers[0] : layers };
            }
            return null;
        };

        const place = (root: Json, segments: string[], token: TokenJson) => {
            let node = root;
            for (const segment of segments.slice(0, -1)) {
                const next = node[segment];
                if (next && '$value' in next) return false;
                node = (next as Json) || (node[segment] = {});
            }
            const last = segments[segments.length - 1];
            if (node[last]) return false;
            node[last] = token;
            return true;
        };
        const skip = (prop: Prop) => {
            if (cssOnly.indexOf(prop.name) === -1) cssOnly.push(prop.name);
        };
        const document = (collection: TokenCollection, mode?: string) => {
            const root: Json = {};
            for (const prop of collection.props) {
                const value = mode && mode !== collection.defaultMode ? prop.modes.get(mode) || prop.def : prop.def;
                const token = toToken(value.text, prop);
                if (!token) {
                    skip(prop);
                    continue;
                }
                const placed = place(
                    root,
                    pathOf(collection, prop).split('.'),
                    Object.assign(token, { $extensions: { pttrn: { css: prop.name, figma: prop.comment } } }),
                );
                if (!placed) skip(prop);
            }
            return root;
        };
        const json = (value: unknown) => `${JSON.stringify(value, null, 4)}\n`;

        const manifestCollections: { [key: string]: unknown }[] = [];
        for (const collection of tokenCollections) {
            const entry: { [key: string]: unknown } = {
                name: collection.name,
                slug: collection.slug,
                kind: collection.kind,
            };
            if (collection.attribute) {
                entry.attribute = collection.attribute;
                entry.modes = collection.modes;
                entry.defaultMode = collection.defaultMode;
            }
            if (collection.theme) entry.theme = true;
            if (collection.modes && collection.modes.length > 1) {
                const files: { [mode: string]: string } = {};
                for (const mode of collection.modes) {
                    files[mode] = `${collection.slug}/${mode}.tokens.json`;
                    tokenFiles.push({ name: `tokens/${files[mode]}`, text: json(document(collection, mode)) });
                }
                entry.files = files;
            } else {
                const file = `${collection.slug}.tokens.json`;
                entry.file = file;
                tokenFiles.push({ name: `tokens/${file}`, text: json(document(collection)) });
            }
            manifestCollections.push(entry);
        }
        tokenFiles.unshift({
            name: 'tokens/manifest.json',
            text: json({
                source: {
                    figmaFile: figma.root.name,
                    exportedAt,
                    exporter: 'pttrn Export Tokens',
                    pluginVersion: PLUGIN_VERSION,
                },
                collections: manifestCollections,
            }),
        });
    }

    const images = Array.from(imageFiles.values());
    const generated = [`Figma file: ${figma.root.name}`, `Generated by pttrn Export Tokens on ${exportedAt}`];
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

    if (picks.size) {
        const width =
            Math.max(...ELEMENTS.filter((element) => picks.has(element)).map((element) => element.length)) + 2;
        header.push(
            '',
            'Elements',
            'Element defaults use these text styles, chosen by name and size. Edit any that do not fit.',
            '',
        );
        ELEMENTS.forEach((element) => {
            const pick = picks.get(element);
            if (pick) header.push(`  ${element}${' '.repeat(width - element.length)}${pick.style}`);
        });
        header.push('', 'Every text style is also a class, for example .' + (classRules[0]?.className ?? 'body') + '.');
    }

    header.push(
        '',
        'Token files',
        'The tokens/ folder in the download holds the same tokens as DTCG files: manifest.json plus one file',
        'per collection, or per mode of a collection with several. @ptrn/styles builds its stylesheets from them.',
    );
    if (cssOnly.length) {
        header.push(
            `${cssOnly.length} ${cssOnly.length === 1 ? 'property has' : 'properties have'} no DTCG form and ${cssOnly.length === 1 ? 'is' : 'are'} in the stylesheets only:`,
            ...listLines('  ', cssOnly),
        );
    }

    if (images.length) {
        header.push(
            '',
            'Images',
            `Image fills are referenced from ${IMAGE_DIR}/ next to this stylesheet. The downloaded ZIP`,
            'already lays them out that way.',
        );
    }

    if (warnings.size) {
        header.push('', 'Skipped', 'These could not be exported:');
        warnings.forEach((warning) => header.push(`  - ${warning}`));
    }

    const stylesheet = (lines: string[], list: string[]) => `${blockComment(lines)}\n\n${list.join('\n\n')}\n`;
    const files: CssFile[] = [];

    if (themeSet) {
        const { collection, attr, defaultKey, keys, own, outside } = themeSet;
        const themeKeys = [defaultKey, ...keys];
        const themeFiles = themeKeys.map((key) => `${THEME_DIR}/${key}.css`);

        const baseHeader = header.concat(
            '',
            'Themes',
            `The modes of "${collection.name}" ([data-${attr}]) are not in this file. Each one is a complete`,
            'stylesheet of its own. Load this file first, then one of:',
            '',
            ...themeFiles.map((file) => `  ${file}`),
            '',
            'Each theme file also sets :root, so with several loaded the last one is the page default. A',
            `data-${attr} attribute always wins over that, on <html> or on any element inside it.`,
        );
        const others = scopeBlocks.filter((scope) => scope.collectionId !== collection.id).map((scope) => scope.css);
        files.push({ name: BASE_FILE, css: stylesheet(baseHeader, rootBlocks.concat(others, ruleBlocks)) });

        // Unlike the blocks in the full stylesheet, a theme file holds every variable of the collection, so it works
        // without the default mode loaded beside it. Aliases from other collections are redeclared as in those blocks.
        themeKeys.forEach((key, i) => {
            const values = own.map((prop) => ({
                prop,
                value: key === defaultKey ? prop.def : (prop.modes.get(key) ?? prop.def),
            }));
            const themeHeader = generated.concat(
                '',
                `The "${key}" mode of "${collection.name}"${key === defaultKey ? ' (its default)' : ''}, complete.`,
                `Load ${BASE_FILE} first, then this file. It sets :root and [data-${attr}="${key}"].`,
            );
            // :where() takes :root's specificity to zero, so when every theme file is loaded, an attribute on <html>
            // still beats the :root of whichever file came last.
            files.push({
                name: themeFiles[i],
                css: stylesheet(themeHeader, [
                    block(`:where(:root), [data-${attr}="${key}"]`, values.concat(defaults(outside))),
                ]),
            });
        });
    }

    send('Done', 1);
    return {
        css: stylesheet(
            header,
            rootBlocks.concat(
                scopeBlocks.map((scope) => scope.css),
                ruleBlocks,
            ),
        ),
        files,
        tokenFiles,
        tokens: props.length - cssOnly.length,
        themes: themeSet ? themeSet.keys.length + 1 : 0,
        skipped: Array.from(warnings),
        images,
        properties: props.length,
        modeAttributes: modeIndex.length,
    };
}

interface UiMessage {
    type?: string;
    height?: number;
    /** The theme collection to use: an id, null for none, or absent to use the saved or detected one. */
    themeCollection?: string | null;
}

figma.ui.onmessage = async (message: UiMessage) => {
    if (message.type === 'RESIZE' && typeof message.height === 'number') {
        figma.ui.resize(WINDOW_WIDTH, Math.min(600, Math.max(100, Math.ceil(message.height))));
        return;
    }

    if (message.type !== 'EXPORT') return;

    try {
        const options = await themeOptions();
        let themeCollection: string | null;
        if (message.themeCollection === undefined) {
            themeCollection = pickThemeCollection(options, readThemeSetting());
        } else {
            themeCollection = options.some((option) => option.id === message.themeCollection)
                ? (message.themeCollection as string)
                : null;
            saveThemeSetting(themeCollection ?? NO_THEME);
        }

        const result = await buildStylesheet(themeCollection);
        figma.ui.postMessage({
            type: 'EXPORT_RESULT',
            ...result,
            themeOptions: options,
            themeCollection,
            fileName: slug(figma.root.name) || 'tokens',
            imageDir: IMAGE_DIR,
            figmaFile: figma.root.name,
        });
    } catch (error) {
        figma.ui.postMessage({ type: 'EXPORT_ERROR', message: errorMessage(error) });
    }
};
