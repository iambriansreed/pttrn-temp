import { closest, rank, squash } from './search.js';
import type { Catalog, Component, Prop } from './types.js';

const PROP_DESCRIPTION_MAX = 400;
const USAGE_MAX = 4000;
const TOKENS_MAX = 250;

function clip(text: string, max: number): string {
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** First sentence, so a browsing list stays short. */
function oneLine(text: string): string {
    const line = text.split(/\n/)[0].trim();
    return clip(line, 200);
}

export function listComponents(catalog: Catalog) {
    return {
        version: catalog.meta.version,
        components: catalog.components.map((c) => ({ name: c.name, description: oneLine(c.description) })),
    };
}

export function searchComponents(catalog: Catalog, query: string, limit = 10) {
    const matches = rank(
        query,
        catalog.components,
        (c) => ({ name: c.name, text: `${c.slug} ${c.description}` }),
        limit,
    );
    return {
        version: catalog.meta.version,
        components: matches.map((c) => ({ name: c.name, description: oneLine(c.description), import: c.import })),
    };
}

function shapeProp(prop: Prop): Prop {
    return { ...prop, description: clip(prop.description, PROP_DESCRIPTION_MAX) };
}

export type GetComponentResult =
    | { version: string; component: Component; error?: undefined; didYouMean?: undefined }
    | { version: string; component?: undefined; error: string; didYouMean: string[] };

export function getComponent(catalog: Catalog, name: string): GetComponentResult {
    const wanted = squash(name);
    const found = catalog.components.find((c) => squash(c.name) === wanted || squash(c.slug) === wanted);
    if (!found) {
        return {
            version: catalog.meta.version,
            error: `No component named "${name}".`,
            didYouMean: closest(
                name,
                catalog.components.map((c) => c.name),
            ),
        };
    }
    const component: Component = {
        ...found,
        props: found.props.map(shapeProp),
    };
    if (found.usage) component.usage = clip(found.usage, USAGE_MAX);
    return { version: catalog.meta.version, component };
}

export function searchIcons(catalog: Catalog, query: string, limit = 20) {
    const matches = rank(query, catalog.icons, (i) => ({ name: i.name, text: `${i.title} ${i.alias}` }), limit);
    return {
        version: catalog.meta.version,
        icons: matches.map((i) => ({ name: i.name, import: i.import, export: i.export })),
    };
}

export type GetTokensResult = {
    version: string;
    kinds?: { kind: string; count: number }[];
    tokens?: { name: string; value: string; themes?: Record<string, string>; description: string }[];
    truncated?: true;
    hint?: string;
};

export function getTokens(catalog: Catalog, kind?: string): GetTokensResult {
    const counts = new Map<string, number>();
    for (const token of catalog.tokens) counts.set(token.kind, (counts.get(token.kind) ?? 0) + 1);
    const kinds = [...counts].map(([name, count]) => ({ kind: name, count }));

    if (!kind) return { version: catalog.meta.version, kinds };

    const matching = catalog.tokens.filter((t) => t.kind === kind.toLowerCase());
    const tokens = matching.slice(0, TOKENS_MAX).map(({ name, value, themes, description }) => {
        const shaped: NonNullable<GetTokensResult['tokens']>[number] = { name, value, description };
        if (themes !== undefined) shaped.themes = themes;
        return shaped;
    });
    const result: GetTokensResult = { version: catalog.meta.version, tokens };
    if (matching.length > TOKENS_MAX) {
        result.truncated = true;
        result.hint = `Showing ${TOKENS_MAX} of ${matching.length}. Use a more specific kind.`;
    }
    if (matching.length === 0) result.kinds = kinds;
    return result;
}
