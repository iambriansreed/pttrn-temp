import { validateCode } from '../src/core/validate.js';
import type { Catalog, Component, ComponentSpec, Icon, Prop, Token } from '../src/core/types.js';

type RawProperty = {
    name: string;
    required?: boolean;
    description?: string;
    default?: unknown;
    type?: string | string[];
    options?: string[];
};

type RawData = {
    componentsMeta: {
        name: string;
        slug: string;
        description?: string;
        dependencies?: string[];
        usage?: { code?: string };
        spec?: ComponentSpec;
    }[];
    typesMeta: { name: string; properties?: RawProperty[] }[];
};

type RawIcon = { name: string; title: string; type: string; alias?: string };

function toProp(raw: RawProperty): Prop {
    const prop: Prop = {
        name: raw.name,
        required: Boolean(raw.required),
        description: raw.description ?? '',
        type: Array.isArray(raw.type) ? raw.type.map((v) => `'${v}'`).join(' | ') : (raw.type ?? 'unknown'),
    };
    if (raw.options?.length) prop.options = raw.options;
    if (raw.default !== undefined) prop.default = raw.default;
    return prop;
}

/** Joins each component with the `<Name>Props` entry that lists its props. */
export function extractComponents(data: RawData): Component[] {
    const props = new Map(data.typesMeta.map((t) => [t.name, t.properties ?? []]));
    return data.componentsMeta.map((c) => {
        const component: Component = {
            name: c.name,
            slug: c.slug,
            description: c.description ?? '',
            import: `@ptrn/react/${c.name}`,
            dependencies: c.dependencies ?? [],
            props: (props.get(`${c.name}Props`) ?? []).map(toProp),
        };
        if (c.usage?.code) component.usage = c.usage.code;
        if (c.spec) component.spec = c.spec;
        return component;
    });
}

export function extractIcons(aliases: RawIcon[]): Icon[] {
    return aliases.map((icon) => ({
        name: icon.name,
        title: icon.title,
        kind: icon.type,
        alias: icon.alias ?? '',
        import: `@ptrn/icons/${icon.name}`,
        export: `Svg${icon.name}`,
    }));
}

/** The body of the first rule whose selector starts with `selector`. */
function ruleBody(css: string, selector: string): string {
    const start = css.search(new RegExp(`^${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{]*\\{`, 'm'));
    if (start === -1) return '';
    const open = css.indexOf('{', start);
    const close = css.indexOf('\n}', open);
    return css.slice(open + 1, close === -1 ? undefined : close);
}

/** The group a token belongs to: the first word after the USWDS prefixes (`color`, `spacing`, `font`, `component`). */
function tokenKind(name: string) {
    return name
        .slice(2)
        .replace(/^(general-usa-|spacing-usa-|usa-|theme-)/, '')
        .split('-')[0];
}

/** Each declaration in a rule body, with the comment directly above it. */
function declarations(body: string): { name: string; value: string; description: string }[] {
    const found: { name: string; value: string; description: string }[] = [];
    let comment = '';
    for (const line of body.split('\n')) {
        const text = line.trim();
        const note = text.match(/^\/\*\s*(.*?)\s*\*\/$/);
        if (note) {
            comment = note[1];
            continue;
        }
        const decl = text.match(/^(--[\w-]+)\s*:\s*(.+?);$/);
        if (decl) {
            found.push({ name: decl[1], value: decl[2], description: comment });
            comment = '';
        }
    }
    return found;
}

/**
 * Reads the tokens from `tokens.css` and each USWDS theme file (keyed by theme name). A theme token's value is its
 * `default` value, and `themes` holds the other themes' values where they differ.
 */
export function extractTokens(tokensCss: string, themeCss: Record<string, string>): Token[] {
    const themeValues = Object.fromEntries(
        Object.entries(themeCss).map(([theme, css]) => [
            theme,
            new Map(declarations(ruleBody(css, ':where(:root)')).map((d) => [d.name, d])),
        ]),
    );
    const { default: defaults = new Map(), ...others } = themeValues;
    const base = declarations(ruleBody(tokensCss, ':root'));
    return [...base, ...defaults.values()].map((d) => {
        const token: Token = { name: d.name, kind: tokenKind(d.name), value: d.value, description: d.description };
        for (const [theme, values] of Object.entries(others)) {
            const value = values.get(d.name)?.value;
            if (value !== undefined && value !== d.value) token.themes = { ...token.themes, [theme]: value };
        }
        return token;
    });
}

/** Rules that mean an example teaches something wrong. Missing imports are fine: examples are fragments. */
const STALE_RULES = new Set([
    'syntax',
    'unknown-import',
    'unknown-icon',
    'wrong-icon-export',
    'unknown-prop',
    'invalid-prop-value',
    'missing-required-prop',
]);

/**
 * Removes docs examples that disagree with the component's own props. An AI copies the example it is shown, so serving
 * a stale one is worse than serving none.
 */
export function withoutStaleUsage(catalog: Catalog): {
    catalog: Catalog;
    dropped: { name: string; problems: string[] }[];
} {
    const dropped: { name: string; problems: string[] }[] = [];
    const components = catalog.components.map((component) => {
        if (!component.usage) return component;
        const problems = validateCode(catalog, component.usage)
            .issues.filter((issue) => STALE_RULES.has(issue.rule))
            .map((issue) => `${issue.line}:${issue.column} ${issue.message}`);
        if (problems.length === 0) return component;
        dropped.push({ name: component.name, problems });
        const { usage: _usage, ...rest } = component;
        return rest;
    });
    return { catalog: { ...catalog, components }, dropped };
}
