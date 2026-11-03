import { SvgSearch } from '@ptrn/icons/Search';
import { Input } from '@ptrn/react/Input';
import { Table, TableColumn } from '@ptrn/react/Table';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loadTokens, TokenInfo, tokenTier } from 'src/utils/tokens';

import 'src/docs/tokenCatalog.scss';

type TokenRow = {
    id: string;
    css: string;
    figma: string;
    value: string;
    tier: string;
    color: boolean;
};

const columns: TableColumn<TokenRow>[] = [
    {
        key: 'css',
        label: 'Custom property',
        sort: 'string',
        formatter: (row) => <code>{row.css}</code>,
    },
    {
        key: 'value',
        label: 'Default value',
        formatter: (row) => (
            <span data-token-value>
                {row.color && <span aria-hidden data-token-swatch style={{ backgroundColor: `var(${row.css})` }} />}
                <code>{row.value}</code>
            </span>
        ),
    },
    { key: 'figma', label: 'Figma name', sort: 'string' },
    { key: 'tier', label: 'Tier', sort: 'string' },
];

/** Exact matches first, then tokens whose name starts with the search, then the rest in catalog order. */
function rank(row: TokenRow, search: string) {
    if (row.css === search) return 0;
    if (row.css.startsWith(search)) return 1;
    return 2;
}

/**
 * Every token `@ptrn/styles` builds, searchable by custom property, Figma name or value. The site search links here
 * with `?token=--name`, which fills in the search.
 */
export function TokenCatalog() {
    const [searchParams] = useSearchParams();
    const requested = searchParams.get('token') || '';

    const [search, setSearch] = useState(requested);
    // A new ?token= (from the site search, while this page is open) replaces whatever was typed.
    const [lastRequested, setLastRequested] = useState(requested);
    if (lastRequested !== requested) {
        setLastRequested(requested);
        setSearch(requested);
    }

    const [tokens, setTokens] = useState<TokenInfo[] | null>(null);
    useEffect(() => {
        let current = true;
        loadTokens().then((loaded) => current && setTokens(loaded));
        return () => {
            current = false;
        };
    }, []);

    // Arriving with ?token=, bring the catalog into view once its rows are in: the page above it can still be settling
    // when the address's #token-catalog is first scrolled to.
    const headingRef = useRef<HTMLHeadingElement>(null);
    useEffect(() => {
        if (tokens && requested) headingRef.current?.scrollIntoView({ block: 'start' });
    }, [tokens, requested]);

    const rows = useMemo(() => {
        const query = search.trim().toLowerCase();
        return (tokens || [])
            .map((token): TokenRow => ({
                id: token.css,
                css: token.css,
                figma: token.figma,
                value: token.value,
                tier: tokenTier(token),
                color: token.type === 'color',
            }))
            .filter((row) => !query || `${row.css} ${row.figma} ${row.value}`.toLowerCase().includes(query))
            .map((row, index) => ({ row, index }))
            .sort((a, b) => rank(a.row, query) - rank(b.row, query) || a.index - b.index)
            .map(({ row }) => row);
    }, [search, tokens]);

    return (
        <section aria-labelledby="token-catalog" data-token-catalog>
            <h2 id="token-catalog" ref={headingRef}>
                Token catalog
            </h2>
            <p>
                Every token in <code>@ptrn/styles/tokens</code>, with its default value and its name in Figma. Swatches
                show the current theme.
            </p>
            <Input
                aria-label="Search tokens"
                leading={<SvgSearch />}
                name="token-search"
                onChange={(next) => setSearch(next || '')}
                placeholder="Search by custom property, Figma name or value"
                value={search}
            />
            <p aria-live="polite" data-token-count>
                {tokens
                    ? `${rows.length} of ${tokens.length} tokens${search.trim() ? ` matching "${search.trim()}"` : ''}`
                    : 'Loading the token catalog...'}
            </p>
            {tokens && rows.length > 0 && <Table columns={columns} data={rows} pageSize={10} title="Design tokens" />}
        </section>
    );
}
