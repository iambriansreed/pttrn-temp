import arrowDownward from '@ptrn/icons/ArrowDownward.svg';
import arrowUpward from '@ptrn/icons/ArrowUpward.svg';
import chevronLeft from '@ptrn/icons/ChevronLeft.svg';
import chevronRight from '@ptrn/icons/ChevronRight.svg';
import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { define } from '../../utils/define';
import { uniqueId } from '../../utils/id';
import styles from './table.scss';

export type TableSize = 'large' | 'medium' | 'small' | 'x-large';

/** A row of `data`: its cell values by column key, and an `id` unique in the table. */
export type TableRow = { [key: string]: unknown; id: string };

export type TableColumnSortingFn = (a: unknown, b: unknown) => number;

export type BuiltInColumnSorters = 'boolean' | 'date' | 'number' | 'string';

/** A column of `columns`, the same shape as the React `TableColumn`. */
export type TableColumn<R extends TableRow = TableRow> = {
    /** The key of the cell values in each row. */
    key: string;
    /** The header text. */
    label: string;
    /** A `grid-template-columns` track size. Default `1fr`. */
    width?: string;
    align?: 'center' | 'left' | 'right';
    valign?: 'bottom' | 'center' | 'top';
    /** A built-in sorter or a compare function of two cell values. Without one the column is not sortable. */
    sort?: BuiltInColumnSorters | TableColumnSortingFn;
    /** Renders a cell: return text, a DOM node or a Lit template. Called with the row and the table size. */
    formatter?: (row: R, size: TableSize) => unknown;
};

type SortOrder = 'asc' | 'desc';
type SortState = { key: string; order: SortOrder }[];

/** What the table draws, from the light-DOM `<table>` or from the `columns` and `data` properties. */
type Model = {
    columns: TableColumn[];
    rows: TableRow[];
    caption: string;
    /** Light-DOM cells, copied once per read: row id to column key to the cell's nodes. */
    cells: Map<string, Record<string, Node[]>>;
};

/** After this many pages the pager asks for a page number instead of listing a button per page. */
const PAGE_BUTTONS_MAX = 7;
const SORTERS = ['boolean', 'date', 'number', 'string'];

const icon = (svg: string) => unsafeSVG(svg.replace('<svg ', '<svg aria-hidden="true" '));
const ICONS = {
    asc: icon(arrowUpward),
    desc: icon(arrowDownward),
    previous: icon(chevronLeft),
    next: icon(chevronRight),
};
const SORT_ARIA = { asc: 'ascending', desc: 'descending', none: 'none' } as const;

const time = (value: unknown) => {
    const date =
        value instanceof Date ? value : typeof value === 'string' || typeof value === 'number' ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
};

const BUILT_IN_SORTERS: Record<BuiltInColumnSorters, TableColumnSortingFn> = {
    string: (a, b) => `${a}`.localeCompare(`${b}`),
    number: (a, b) => (typeof a === 'number' ? a : Number(a) || 0) - (typeof b === 'number' ? b : Number(b) || 0),
    boolean: (a, b) => (a === b ? 0 : a ? 1 : -1),
    date: (a, b) => time(a) - time(b),
};

/** A cell value as the React table shows it: text, an array joined with commas, or a DOM node as it is. */
function formatCell(value: unknown): unknown {
    if (value instanceof Node) return value;
    if (Array.isArray(value)) return value.map(formatCell).join(', ');
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
        console.warn('pttrn-table: unexpected object value', value);
        return nothing;
    }
    return `${value}`;
}

/**
 * A container for displaying tabular data: the USWDS striped table, with a caption, sortable columns and, past the page
 * size, paging.
 *
 * Give it the data as a plain `<table>` child, which shows as is until the element loads: the header cells name the
 * columns and the body rows are the data. The element draws its own table from it, so the child table is not displayed
 * and its cells are copied (use `formatter` or event delegation on the element for interactive cells). Options per
 * column go on its `th`: `data-sort` (`string`, `number`, `date` or `boolean`), `data-width` (a grid track size),
 * `data-align`, `data-valign` and `data-key` (the cell's `data-cell` value). A `td` with `data-sort-value` sorts by
 * that instead of its text. From script, set the `columns` and `data` properties instead, the same shapes as the React
 * props, which also take sort functions and cell formatters.
 *
 * The drawn table is native: `th scope="col"` headers, `aria-colcount` and `aria-rowcount` for the whole data set,
 * `aria-sort` and a sort button on each sortable header, and a polite live region that announces sort and page
 * changes.
 *
 * React to Web Component mapping:
 *
 * | React              | Web Component                                          | Note                                     |
 * | ------------------ | ------------------------------------------------------ | ---------------------------------------- |
 * | `columns[]`        | `th` cells of a child `<table>`, or `columns` property | Options as `data-*` on each `th`.        |
 * | `data[]`           | `tr` rows of the child table body, or `data` property  |                                          |
 * | `title`            | `caption` attribute, or the child table's `<caption>`  | `title` is the native tooltip attribute. |
 * | `size`             | `size` attribute (reflected)                           | `medium` by default.                     |
 * | `pageSize`         | `page-size` attribute                                  | 10 by default.                           |
 * | `column.sort`      | `data-sort` on the `th`, or the column's `sort`        | Functions only through `columns`.        |
 * | `column.formatter` | `columns` property only                                | Returns text, a node or a Lit template.  |
 *
 * @element pttrn-table
 */
export class PttrnTable extends LitElement {
    static properties = {
        caption: { type: String },
        size: { type: String, reflect: true },
        pageSize: { type: Number, attribute: 'page-size' },
        columns: { attribute: false },
        data: { attribute: false },
        _sorting: { state: true },
        _pageIndex: { state: true },
        _message: { state: true },
    };

    static styles = styles;

    /** The caption, which names the table. Without it the child table's `<caption>` is used. */
    declare caption: string;
    /** The row height and padding. */
    declare size: TableSize;
    /** The number of rows per page. With more rows than this the table pages them. */
    declare pageSize: number;
    /** The column definitions, as in React. Set with `data` to give the table its data from script. */
    declare columns: (TableColumn | boolean)[];
    /** The rows, as in React. The array is never reordered. */
    declare data: TableRow[];
    declare _sorting: SortState;
    declare _pageIndex: number;
    declare _message: string;

    private _model: Model = { columns: [], rows: [], caption: '', cells: new Map() };
    private _sourceChanged = true;
    private _rowCount = -1;
    private readonly _descriptionId = uniqueId('pttrn-table-pagination-description');
    private readonly _observer = new MutationObserver(() => {
        this._sourceChanged = true;
        this.requestUpdate();
    });

    constructor() {
        super();
        this.caption = '';
        this.size = 'medium';
        this.pageSize = 10;
        this.columns = [];
        this.data = [];
        this._sorting = [];
        this._pageIndex = 0;
        this._message = '';
    }

    connectedCallback() {
        super.connectedCallback();
        this._observer.observe(this, { childList: true, subtree: true, attributes: true, characterData: true });
        this._sourceChanged = true;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._observer.disconnect();
    }

    private get _pageSize() {
        return Number.isFinite(this.pageSize) && this.pageSize >= 1 ? Math.floor(this.pageSize) : 10;
    }

    protected willUpdate(changed: PropertyValues<this>) {
        if (this._sourceChanged || changed.has('columns') || changed.has('data') || changed.has('caption')) {
            this._model = this._read();
            this._sourceChanged = false;
        }
        // A different number of rows starts again from the first page.
        const count = this._model.rows.length;
        if (count !== this._rowCount) {
            this._rowCount = count;
            this._pageIndex = 0;
        }
        const pages = Math.max(1, Math.ceil(count / this._pageSize));
        if (this._pageIndex >= pages) this._pageIndex = pages - 1;
    }

    /** The data from the `columns` and `data` properties when columns are set, otherwise from the child table. */
    private _read(): Model {
        const columns = (this.columns ?? []).filter(
            (column): column is TableColumn => typeof column === 'object' && column !== null,
        );
        if (columns.length) {
            return { columns, rows: this.data ?? [], caption: this.caption, cells: new Map() };
        }

        const table = [...this.children].find((child): child is HTMLTableElement => child instanceof HTMLTableElement);
        if (!table) return { columns: [], rows: [], caption: this.caption, cells: new Map() };

        const headerRow = table.tHead?.rows[0] ?? table.rows[0];
        const headers = headerRow ? [...headerRow.cells] : [];
        const lightColumns: TableColumn[] = headers.map((th, index) => {
            const { key, width, align, valign, sort } = th.dataset;
            return {
                key: key || `column-${index + 1}`,
                label: th.textContent?.trim() ?? '',
                width,
                align: align as TableColumn['align'],
                valign: valign as TableColumn['valign'],
                sort: sort && SORTERS.includes(sort) ? (sort as BuiltInColumnSorters) : undefined,
            };
        });

        const cells: Model['cells'] = new Map();
        const bodyRows = [...table.tBodies].flatMap((body) => [...body.rows]);
        const rows = bodyRows.map((tr, rowIndex) => {
            const id = `row-${rowIndex + 1}`;
            const row: TableRow = { id };
            const nodes: Record<string, Node[]> = {};
            lightColumns.forEach(({ key }, index) => {
                const cell = tr.cells[index];
                row[key] = cell ? (cell.dataset.sortValue ?? cell.textContent?.trim() ?? '') : '';
                nodes[key] = cell ? [...cell.childNodes].map((node) => node.cloneNode(true)) : [];
            });
            cells.set(id, nodes);
            return row;
        });

        return {
            columns: lightColumns,
            rows,
            caption: this.caption || table.caption?.textContent?.trim() || '',
            cells,
        };
    }

    /** The rows in sort order; a copy, so the caller's array keeps its order. */
    private _sorted(): TableRow[] {
        const { columns, rows } = this._model;
        if (!this._sorting.length) return rows;
        return [...rows].sort((a, b) => {
            for (const { key, order } of this._sorting) {
                const sort = columns.find((column) => column.key === key)?.sort;
                if (!sort) continue;
                const compare = typeof sort === 'function' ? sort : BUILT_IN_SORTERS[sort];
                const result = compare(a[key], b[key]);
                if (result !== 0) return result * (order === 'asc' ? 1 : -1);
            }
            return 0;
        });
    }

    /** Ascending, then descending, then unsorted. A new column joins the sort as its last tie-breaker. */
    private _toggleSort(column: TableColumn) {
        const current = this._sorting.find((sort) => sort.key === column.key);
        const order: SortOrder | undefined = !current ? 'asc' : current.order === 'asc' ? 'desc' : undefined;

        if (order && current)
            this._sorting = this._sorting.map((sort) => (sort.key === column.key ? { ...sort, order } : sort));
        else if (order) this._sorting = [...this._sorting, { key: column.key, order }];
        else this._sorting = this._sorting.filter((sort) => sort.key !== column.key);

        this._message = `${order ? `Sorted ${order}ending` : 'Removed sorting'} by ${column.label || column.key}`;
    }

    private _goToPage(page: number, pages: number) {
        this._pageIndex = page - 1;
        this._message = `Page ${page} of ${pages}`;
    }

    private _cell(row: TableRow, column: TableColumn) {
        if (column.formatter) return column.formatter(row, this.size);
        return this._model.cells.get(row.id)?.[column.key] ?? formatCell(row[column.key]);
    }

    private _header(column: TableColumn) {
        const sorted = this._sorting.find((sort) => sort.key === column.key)?.order;
        const sortable = !!column.sort;
        return html`<th
            aria-sort=${sortable ? SORT_ARIA[sorted ?? 'none'] : nothing}
            data-align=${column.align ?? nothing}
            ?data-sortable=${sortable}
            scope="col"
        >
            ${
                sortable
                    ? html`<button type="button" @click=${() => this._toggleSort(column)}>
                          ${column.label}${sorted ? html`<span aria-hidden="true" data-sort-icon>${ICONS[sorted]}</span>` : nothing}
                      </button>`
                    : column.label
            }
        </th>`;
    }

    private _footer(total: number, pageSize: number) {
        const pages = Math.ceil(total / pageSize);
        const page = this._pageIndex + 1;
        const first = total === 0 ? 0 : this._pageIndex * pageSize + 1;
        const last = Math.min(first + pageSize - 1, total);

        return html`<div data-pagination role="group">
            <div data-pagination-label>Showing ${first}-${last} of ${total} results</div>
            <div data-sr-only id=${this._descriptionId}>
                <p>
                    The buttons inside this control allow you to paginate through the data in the table above,
                    ${pageSize} rows at a time.
                </p>
            </div>
            <span aria-labelledby=${this._descriptionId} data-pager role="group">
                ${this._pagerButton(
                    page === 1 ? 'First page' : `Previous page (${page - 1})`,
                    ICONS.previous,
                    page <= 1,
                    () => this._goToPage(page - 1, pages),
                )}
                ${pages > PAGE_BUTTONS_MAX ? this._pageField(page, pages) : this._pageButtons(page, pages)}
                ${this._pagerButton(
                    page === pages ? 'Last page' : `Next page (${page + 1})`,
                    ICONS.next,
                    page >= pages,
                    () => this._goToPage(page + 1, pages),
                )}
            </span>
        </div>`;
    }

    private _row(row: TableRow, columns: TableColumn[]) {
        const cells = columns.map((column) => {
            const sorted = !!column.sort && this._sorting.some((sort) => sort.key === column.key);
            return html`<td
                data-align=${column.align || 'left'}
                data-cell=${column.key}
                ?data-sorted=${sorted}
                data-valign=${column.valign || 'center'}
            >
                ${this._cell(row, column)}
            </td>`;
        });
        return html`<tr>
            ${cells}
        </tr>`;
    }

    private _pagerButton(label: string, svg: unknown, disabled: boolean, onClick: () => void) {
        return html`<button aria-label=${label} data-icon-only ?disabled=${disabled} type="button" @click=${onClick}>
            <span aria-hidden="true" data-button-icon>${svg}</span><span aria-hidden="true" data-touch-target></span>
        </button>`;
    }

    private _pageButtons(page: number, pages: number) {
        return Array.from({ length: pages }, (_, index) => {
            const number = index + 1;
            return html`<button
                aria-current=${number === page ? 'page' : nothing}
                aria-label=${`Page ${number}`}
                type="button"
                @click=${() => this._goToPage(number, pages)}
            >
                <span data-button-label>${number}</span><span aria-hidden="true" data-touch-target></span>
            </button>`;
        });
    }

    /** Past seven pages: a page number field, applied on Enter or when it loses focus and kept within range. */
    private _pageField(page: number, pages: number) {
        const submit = (input: HTMLInputElement) => {
            const parsed = parseInt(input.value, 10);
            if (Number.isNaN(parsed)) {
                input.value = `${page}`;
                return;
            }
            const next = Math.min(Math.max(parsed, 1), pages);
            this._goToPage(next, pages);
            input.value = `${next}`;
        };
        return html`<form
            data-input-form
            @submit=${(event: SubmitEvent) => {
                event.preventDefault();
                submit((event.currentTarget as HTMLFormElement).elements.namedItem('page-number') as HTMLInputElement);
            }}
        >
            <div data-input>
                <input
                    aria-label="Page number"
                    autocomplete="off"
                    name="page-number"
                    type="number"
                    .value=${live(`${page}`)}
                    @blur=${(event: FocusEvent) => submit(event.currentTarget as HTMLInputElement)}
                />
            </div>
            <span>of ${pages}</span>
        </form>`;
    }

    render() {
        const { columns, rows, caption } = this._model;
        const pageSize = this._pageSize;
        const hasPagination = rows.length > pageSize;
        const start = this._pageIndex * pageSize;
        const page = this._sorted().slice(start, start + pageSize);
        const template = columns.map((column) => `minmax(min-content, ${column.width || '1fr'})`).join(' ');

        return html`
            <div data-pttrn="table" ?data-has-pagination=${hasPagination} data-size=${this.size}>
                <div data-scroll-container>
                    <table
                        aria-colcount=${columns.length}
                        aria-rowcount=${rows.length}
                        style=${`--template-columns: ${template}`}
                    >
                        ${
                            caption
                                ? html`<caption>
                                      ${caption}
                                  </caption>`
                                : nothing
                        }
                        <thead>
                            <tr>
                                ${columns.map((column) => this._header(column))}
                            </tr>
                        </thead>
                        <tbody>
                            ${repeat(
                                page,
                                (row) => row.id,
                                (row) => this._row(row, columns),
                            )}
                        </tbody>
                    </table>
                    ${hasPagination ? this._footer(rows.length, pageSize) : nothing}
                </div>
                <div aria-live="polite" data-sr-only role="status">${this._message}</div>
            </div>
        `;
    }
}

define('pttrn-table', PttrnTable);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-table': PttrnTable;
    }
}
