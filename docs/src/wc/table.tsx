import '@ptrn/web/Table';
import { TableColumn, TableProps, TableRow } from '@ptrn/react/Table';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnTable = 'pttrn-table' as unknown as ComponentType<any>;

type Props = Partial<TableProps<TableRow>>;

const columnsOf = (columns: Props['columns'] = []) =>
    columns.filter((column): column is TableColumn<TableRow> => typeof column === 'object' && column !== null);

/**
 * A column's options as `data-*` attributes on its `th`. Sort functions and formatters are script-only (the element's
 * `columns` property), so the demo shows built-in sorters and plain values.
 */
const headerAttributes = ({ key, width, align, valign, sort }: TableColumn<TableRow>) => ({
    'data-key': key,
    'data-sort': typeof sort === 'string' ? sort : undefined,
    'data-width': width && width !== '1fr' ? width : undefined,
    'data-align': align,
    'data-valign': valign,
});

/** A cell value as text: an array joined with commas, anything that is not text left out. */
const text = (value: unknown): string =>
    Array.isArray(value)
        ? value.map(text).join(', ')
        : ['string', 'number', 'boolean'].includes(typeof value)
          ? String(value)
          : '';

/** The React demo state (`columns`, `data`, `title`, `size`, `pageSize`) as the element with a child table. */
function TableWc({ columns, data = [], title, size, pageSize }: Props) {
    const shown = columnsOf(columns);
    return (
        <PttrnTable page-size={pageSize} size={size}>
            <table>
                {title && <caption>{title}</caption>}
                <thead>
                    <tr>
                        {shown.map((column) => (
                            <th key={column.key} {...headerAttributes(column)}>
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr key={row.id}>
                            {shown.map((column) => (
                                <td key={column.key}>{text(row[column.key])}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </PttrnTable>
    );
}

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const attributeList = (attributes: Record<string, unknown>) =>
    Object.entries(attributes)
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([name, value]) => ` ${name}="${escape(String(value))}"`)
        .join('');

/** The HTML a Web Component user writes for the current demo state. */
function tableToHtml({ columns, data = [], title, size, pageSize }: Props) {
    const shown = columnsOf(columns);
    const header = shown.map((column) => `<th${attributeList(headerAttributes(column))}>${escape(column.label)}</th>`);
    const rows = data.map(
        (row) => `<tr>${shown.map((column) => `<td>${escape(text(row[column.key]))}</td>`).join('')}</tr>`,
    );
    return [
        `<pttrn-table${attributeList({ size: size === 'medium' ? undefined : size, 'page-size': pageSize })}>`,
        '<table>',
        title && `<caption>${escape(title)}</caption>`,
        `<thead><tr>${header.join('')}</tr></thead>`,
        `<tbody>${rows.join('\n')}</tbody>`,
        '</table>',
        '</pttrn-table>',
    ]
        .filter(Boolean)
        .join('\n');
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-table>
    <table>
        <caption>U.S. States — Capitals &amp; Quick Facts</caption>
        <thead>
            <tr>
                <th data-key="state" data-sort="string" data-width="160px">State</th>
                <th data-key="capital" data-width="140px">Capital</th>
                <th data-key="population" data-sort="number" data-align="right">Population</th>
            </tr>
        </thead>
        <tbody>
            <tr><td>California</td><td>Sacramento</td><td data-sort-value="39512223">39,512,223</td></tr>
            <tr><td>New York</td><td>Albany</td><td data-sort-value="19299981">19,299,981</td></tr>
            <tr><td>Texas</td><td>Austin</td><td data-sort-value="29183290">29,183,290</td></tr>
            <tr><td>Hawaii</td><td>Honolulu</td><td data-sort-value="1415872">1,415,872</td></tr>
        </tbody>
    </table>
</pttrn-table>`;

export const tableWc: WebComponentDemo = {
    tag: 'pttrn-table',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. Write the data as a plain `<table>` inside the element, with column options as `data-*` attributes on each `th`; from script, set the `columns` and `data` properties instead, which also take sort functions and cell formatters.',
    Wrapper: TableWc,
    toHtml: tableToHtml,
};
