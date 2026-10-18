import { SvgSearch } from '@ptrn/icons/Search';
import { Button } from '@ptrn/react/Button';
import { Input } from '@ptrn/react/Input';
import { Select } from '@ptrn/react/Select';
import { sendSnackbar } from '@ptrn/react/Snackbar/Manager';
import { Table, TableColumn, TableRow } from '@ptrn/react/Table';
import THEME_CSS from '@ptrn/styles/themes/default.css?raw';
import TOKENS_CSS from '@ptrn/styles/tokens.css?raw';
import { useMemo, useState } from 'react';
import { Page } from 'src/components/Page';

type ColorType = (typeof COLOR_TYPES)[number];

const COLOR_TYPES = ['Theme', 'Primitive'] as const;

/** Reads each color variable and the Figma name in the comment above it. Every theme file has the same variables. */
function colorRows(css: string, type: ColorType) {
    const rows = new Map<string, { id: string; tokenName: string; cssVariable: string; type: ColorType }>();
    for (const [, tokenName, cssVariable, value] of css.matchAll(/\/\* ([^*]+) \*\/\s*(--[\w-]+):\s*([^;]+);/g)) {
        const isColor = value.startsWith('rgb(') || /(^|-)color(-|$)/.test(cssVariable);
        if (isColor && !rows.has(cssVariable)) rows.set(cssVariable, { id: cssVariable, tokenName, cssVariable, type });
    }
    return [...rows.values()];
}

const COLOR_ROWS = [...colorRows(THEME_CSS, 'Theme'), ...colorRows(TOKENS_CSS, 'Primitive')];

type ColorTableRow = (typeof COLOR_ROWS)[number] & TableRow;

const columns: TableColumn<ColorTableRow>[] = [
    {
        label: 'Name',
        key: 'tokenName',
        sort: 'string',
    },
    {
        label: 'Swatch',
        key: 'swatch',
        formatter(row) {
            return <div style={{ backgroundColor: `var(${row.cssVariable})`, width: '40px', height: '40px' }} />;
        },
        width: '60px',
    },
    {
        label: 'Variable Name',
        key: 'cssVariable',
        formatter(row: ColorTableRow) {
            return (
                <Button
                    label={row.cssVariable}
                    onClick={() => {
                        navigator.clipboard.writeText(`var(${row.cssVariable})`);
                        sendSnackbar({ text: `Copied to clipboard`, timeout: 1000 });
                    }}
                    variant="tertiary"
                >
                    <span
                        style={{
                            whiteSpace: 'nowrap',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            maxWidth: '300px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {row.cssVariable}
                    </span>
                </Button>
            );
        },
        sort: 'string',
    },
    {
        label: 'Type',
        key: 'type',
        sort: 'string',
        width: '100px',
    },
];

export function Colors() {
    const [filter, setFilter] = useState<{ search: string; type: ColorType | null }>({
        search: '',
        type: null,
    });

    const filtered = useMemo(() => {
        return COLOR_ROWS.filter((color) => {
            const matchesSearch =
                filter.search === '' ||
                color.tokenName.toLowerCase().includes(filter.search.toLowerCase()) ||
                color.cssVariable.toLowerCase().includes(filter.search.toLowerCase());
            const matchesType = !filter.type || color.type === filter.type;

            return matchesSearch && matchesType;
        });
    }, [filter]);

    return (
        <Page>
            <h2>Colors</h2>
            <p>
                The USWDS colors from <code>@ptrn/styles</code>. Theme colors change with the USWDS theme; primitives
                are the fixed palette they point at. Swatches show the current theme.
            </p>
            <div data-page-icons style={{ marginBottom: '16px' }}>
                <div data-filters>
                    <Input
                        aria-label="Search colors"
                        data-search
                        id="color-search"
                        leading={<SvgSearch />}
                        name="color-search"
                        onChange={(search) => {
                            setFilter((p) => ({
                                ...p,
                                search: search || '',
                            }));
                        }}
                        placeholder="Search for an color"
                        value={filter.search}
                    />
                    <Select
                        aria-label="Icon type"
                        data-type
                        name="color-type"
                        onChange={(value) => {
                            setFilter((p) => ({
                                ...p,
                                type: value as ColorType | null,
                            }));
                        }}
                        options={[
                            { label: 'All types', value: '' },
                            ...COLOR_TYPES.map((type) => ({
                                label: type,
                                value: type,
                            })),
                        ]}
                        value={filter.type || 'all'}
                    />
                </div>
                {(filter.search || filter.type) && (
                    <p>
                        {filtered.length} item{filtered.length === 1 ? '' : 's'}
                        {filter.search && ` matching "${filter.search}"`}
                        {filter.type && ` of type "${filter.type}"`}
                    </p>
                )}
            </div>
            <Table columns={columns} data={filtered} pageSize={999999} size="large" />
        </Page>
    );
}
