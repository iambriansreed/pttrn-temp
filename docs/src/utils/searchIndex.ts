import { COMPONENT_PHASES, componentsMeta, typesMeta, utilitiesMeta } from 'src/meta';
import { routes } from 'src/routes';
import { IconName, ICONS } from 'src/utils/icons';
import { kebabCase } from 'src/utils/kebabCase';
import { headingId, markdownText } from 'src/utils/markdownText';
import { loadTokens, tokenTier, tokenUrl } from 'src/utils/tokens';

export type SearchKind = 'component' | 'hook' | 'icon' | 'page' | 'token' | 'type';

/** The kinds of result, in the order their groups are shown when their best matches are equally good. */
export const SEARCH_GROUPS: { kind: SearchKind; title: string }[] = [
    { kind: 'component', title: 'Components' },
    { kind: 'page', title: 'Pages' },
    { kind: 'token', title: 'Design tokens' },
    { kind: 'icon', title: 'Icons' },
    { kind: 'type', title: 'Types' },
    { kind: 'hook', title: 'Hooks' },
];

export type SearchEntry = {
    /** A DOM id, unique in the index. */
    id: string;
    kind: SearchKind;
    /** What the result is called: a component, a heading, a token's custom property, an icon. */
    name: string;
    /** A short label shown with the result: the page a heading is on, a token's tier, a component's phase. */
    detail?: string;
    /** The text an excerpt is taken from. */
    text: string;
    /** Words that find the entry without being shown: an icon's aliases, a token's Figma name. */
    keywords: string;
    url: string;
    /** The icon to draw next to an icon result. */
    icon?: IconName;
    /** The custom property to draw a swatch with, for a color token. */
    swatch?: string;
};

type IndexedEntry = SearchEntry & { nameLower: string; keywordsLower: string; haystack: string };

/** One heading of a markdown page and the text under it, up to the next heading. */
type MarkdownSection = { level: number; heading: string; body: string };

/** Splits a markdown document at its headings. Lines inside code fences are text, never headings. */
function markdownSections(markdown: string): MarkdownSection[] {
    const sections: MarkdownSection[] = [];
    let fenced = false;
    for (const line of markdown.split('\n')) {
        if (/^\s*(```|~~~)/.test(line)) {
            fenced = !fenced;
            continue;
        }
        const heading = fenced ? null : line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
        if (heading) {
            sections.push({ level: heading[1].length, heading: heading[2], body: '' });
        } else if (sections.length) {
            sections[sections.length - 1].body += `${line}\n`;
        } else if (line.trim()) {
            sections.push({ level: 0, heading: '', body: `${line}\n` });
        }
    }
    return sections;
}

/** Markdown body text as one line of plain text: no list markers, quote marks, table pipes or inline markup. */
function plainText(markdown: string): string {
    return markdown
        .split('\n')
        .map((line) =>
            markdownText(
                line
                    .replace(/^\s*>\s?/, '')
                    .replace(/^\s*([-*+]|\d+\.)\s+/, '')
                    .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/, '')
                    .replace(/\s*\|\s*/g, ' '),
            ),
        )
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function pageEntries(): SearchEntry[] {
    return routes
        .flatMap((route) => route.children || [route])
        .filter((route) => route.markdown && route.path && !route.hide)
        .flatMap((route) =>
            markdownSections(route.markdown!).map((section, index): SearchEntry => {
                const name = section.heading ? markdownText(section.heading) : route.title;
                // The page's own title lands on the top of the page; every other heading on its anchor.
                const isTop = index === 0 && section.level <= 1;
                return {
                    id: '',
                    kind: 'page',
                    name,
                    detail: name === route.title ? undefined : route.title,
                    text: plainText(section.body),
                    keywords: route.title,
                    url: isTop ? route.path! : `${route.path}#${headingId(section.heading)}`,
                };
            }),
        );
}

function componentEntries(): SearchEntry[] {
    return componentsMeta.map((component) => ({
        id: '',
        kind: 'component',
        name: component.name,
        detail: COMPONENT_PHASES[component.phase]?.title,
        text: plainText(component.description || ''),
        keywords: '',
        url: `/${component.slug}`,
    }));
}

function typeEntries(): SearchEntry[] {
    return typesMeta.flatMap((type): SearchEntry | [] => {
        // A type is documented on the page of the first component that uses it.
        const component = componentsMeta.find((meta) => meta.name === type.components?.[0]);
        if (!component) return [];
        return {
            id: '',
            kind: 'type',
            name: type.name,
            detail: component.name,
            text: plainText(type.description || ''),
            keywords: '',
            url: `/${component.slug}`,
        };
    });
}

function hookEntries(): SearchEntry[] {
    return utilitiesMeta.map((utility) => ({
        id: '',
        kind: 'hook',
        name: utility.name,
        text: plainText(utility.description || ''),
        keywords: '',
        url: utility.name.startsWith('use') ? `/hooks#${kebabCase(utility.name)}` : '/hooks',
    }));
}

function iconEntries(): SearchEntry[] {
    // A filled variant is shown with its outlined icon, as on the icons page, so it is found through it.
    return ICONS.filter((icon) => !icon.variantUnfilled).map((icon) => ({
        id: '',
        kind: 'icon',
        name: icon.name,
        detail: icon.type,
        text: icon.alias ? `Also: ${icon.alias}` : icon.title,
        keywords: [icon.title, icon.variantFill].filter(Boolean).join(' '),
        url: `/icons?icon=${encodeURIComponent(icon.name)}`,
        icon: icon.name,
    }));
}

async function tokenEntries(): Promise<SearchEntry[]> {
    return (await loadTokens()).map((token) => ({
        id: '',
        kind: 'token',
        name: token.css,
        detail: tokenTier(token),
        text: `${token.value} (Figma: ${token.figma})`,
        keywords: token.path,
        url: tokenUrl(token.css),
        swatch: token.type === 'color' ? `var(${token.css})` : undefined,
    }));
}

let index: Promise<IndexedEntry[]> | undefined;

/** The search index: built once, on first use, and shared by every search after that. */
export function loadSearchIndex(): Promise<IndexedEntry[]> {
    index ??= tokenEntries().then((tokens) =>
        [...componentEntries(), ...pageEntries(), ...tokens, ...iconEntries(), ...typeEntries(), ...hookEntries()].map(
            (entry, position) => ({
                ...entry,
                id: `search-result-${position}`,
                nameLower: entry.name.toLowerCase(),
                keywordsLower: entry.keywords.toLowerCase(),
                haystack: `${entry.name} ${entry.keywords} ${entry.text}`.toLowerCase(),
            }),
        ),
    );
    return index;
}

/** How well an entry matches, 0 for not at all. The name counts most, then the hidden keywords, then the text. */
function score(entry: IndexedEntry, query: string, terms: string[], atWordStart: RegExp): number {
    const name = entry.nameLower;
    let points = 0;
    if (name === query) points = 100;
    else if (name.startsWith(query) || name.startsWith(`--${query}`)) points = 60;
    else if (atWordStart.test(name)) points = 50;
    else if (name.includes(query)) points = 40;
    else if (terms.every((term) => name.includes(term))) points = 30;
    else if (entry.keywordsLower.includes(query)) points = 20;
    else if (terms.every((term) => entry.haystack.includes(term))) points = 10;
    // Among equal matches the shorter name is the closer one.
    return points && points - Math.min(name.length, 99) / 100;
}

export type SearchGroup = {
    kind: SearchKind;
    title: string;
    /** How many entries of this kind matched; at most `limit` of them are in `results`. */
    total: number;
    results: SearchEntry[];
    /** How well the group's best entry matched, which orders the groups. */
    best: number;
};

/**
 * Searches the index and returns the matches grouped by kind, best first in each group. The group with the best match
 * comes first, so typing a token's exact name puts the token above pages that mention it; equally good groups keep the
 * `SEARCH_GROUPS` order.
 */
export function search(entries: IndexedEntry[], value: string, limit = 8): SearchGroup[] {
    const query = value.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!query) return [];
    const terms = query.split(' ');
    const atWordStart = new RegExp(`(^|[^a-z0-9])${escapeRegExp(query)}`);

    const scored = entries
        .map((entry) => ({ entry, points: score(entry, query, terms, atWordStart) }))
        .filter(({ points }) => points > 0)
        .sort((a, b) => b.points - a.points);

    return SEARCH_GROUPS.flatMap(({ kind, title }) => {
        const matches = scored.filter(({ entry }) => entry.kind === kind);
        if (!matches.length) return [];
        const results = matches.slice(0, limit).map(({ entry }) => entry);
        return { kind, title, total: matches.length, results, best: Math.floor(matches[0].points) };
    }).sort((a, b) => b.best - a.best);
}

/** Escapes a user-typed string so it can be used inside a RegExp literally. */
export function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
