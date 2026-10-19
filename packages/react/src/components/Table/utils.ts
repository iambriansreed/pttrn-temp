import { isValid } from 'date-fns';
import { isValidElement, ReactNode, useMemo, useState } from 'react';
import { sendAriaLiveMessage } from '-/utils/sendAriaLiveMessage';

const parseDateTime = (val: TableCellValue) => {
    let dateValue = val;
    if (typeof val === 'string' || typeof val === 'number') dateValue = new Date(val).getTime();

    return dateValue instanceof Date && isValid(dateValue) ? dateValue.getTime() : 0;
};

export type BuiltInColumnSorters = 'boolean' | 'date' | 'number' | 'string';

export const BUILT_IN_COLUMN_SORTERS: Record<BuiltInColumnSorters, TableColumnSortingFn> = {
    string: (a: TableCellValue, b: TableCellValue) => `${a}`.localeCompare(`${b}`),
    number: (a: TableCellValue, b: TableCellValue) => {
        const aNum = typeof a === 'number' ? a : Number(a) || 0;
        const bNum = typeof b === 'number' ? b : Number(b) || 0;
        return aNum - bNum;
    },
    boolean: (a: TableCellValue, b: TableCellValue) => (a === b ? 0 : a ? 1 : -1),
    date: (a: TableCellValue, b: TableCellValue) => {
        return parseDateTime(a) - parseDateTime(b);
    },
} as const;

export type TableSize = 'large' | 'medium' | 'small' | 'x-large';

export type TableCellValue = unknown;

export type TableRow = {
    [key: string]: TableCellValue | TableCellValue[];
    id: string;
};

export type TableColumnSortingFn = (a: TableCellValue, b: TableCellValue) => number;

export type TableColumn<R extends TableRow> = {
    /**
     * The key of the column. This is used to access the data in the row.
     *
     * @type string
     */
    key: string;
    /**
     * The label of the column. This is used to display the column header.
     *
     * @type string
     */
    label: string;
    /**
     * The width of the column. This is used to set the width of the column.
     *
     * Used to set the value of
     * [grid-template-columns](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-columns)
     *
     * @default 1fr
     * @type string
     */
    width?: string;
    /**
     * The horizontal alignment of the column. This is used to set the text alignment of the column.
     *
     * @default left
     */
    align?: 'center' | 'left' | 'right';
    /**
     * The vertical alignment of the column. This is used to set the text alignment of the column.
     *
     * @default center
     */
    valign?: 'bottom' | 'center' | 'top';
    /**
     * The sorting function for the column.
     *
     * This can be a custom sorting function or one of the built-in sorting functions:
     *
     * `string`, `boolean`, `date`, or `number`.
     *
     * If unspecified, the column will not be sortable.
     */
    sort?: BuiltInColumnSorters | TableColumnSortingFn;
    /**
     * A formatter function for the cell values in the column.
     *
     * This function is called for each cell in the column and can be used to customize the display of the cell value.
     */
    formatter?: TableCellValueFormatter<R>;
};

export type TableCellValueFormatter<R extends TableRow> = (row: R, size: TableSize) => ReactNode;

export type SortOrder = 'asc' | 'desc';

export type SortState = { key: string; order: SortOrder }[];

export function formatCell(value: TableCellValue): ReactNode {
    if (isValidElement(value)) return value;

    if (Array.isArray(value)) return value.map(formatCell).join(', ');

    if (typeof value === 'object') {
        // eslint-disable-next-line no-console
        console.warn('Unexpected object value:', value);
        return null;
    }

    return `${value}`;
}

export function useTable<R extends TableRow>({
    data,
    pageIndex,
    pageSize,
    columns,
}: {
    data: R[];
    pageIndex: number;
    pageSize: number;
    columns?: TableColumn<R>[];
}) {
    const [sorting, setSorting] = useState<SortState>([]);

    const filteredData = useMemo(() => {
        let result = data;

        // Apply sorting
        if (sorting.length) {
            // Sort a copy: the rows belong to the caller, and removing the sort must restore their order.
            result = [...result].sort((a, b) => {
                for (const { key, order } of sorting) {
                    const aValue = a[key];
                    const bValue = b[key];

                    const colSort = columns?.find((col) => col.key === key)?.sort;

                    if (!colSort) continue;

                    const colSortFn = typeof colSort === 'function' ? colSort : BUILT_IN_COLUMN_SORTERS[colSort];
                    const next: number = colSortFn(aValue, bValue);

                    if (next !== 0) return next * (order === 'asc' ? 1 : -1);
                }

                return 0;
            });
        }

        // Apply pagination
        const start = pageIndex * pageSize;
        const end = start + pageSize;
        result = result.slice(start, end);

        return result;
    }, [data, sorting, pageIndex, pageSize, columns]);

    return {
        rows: filteredData,
        sorting,
        toggleSorting: (key: string) => {
            setSorting((prev) => {
                let nextArr: SortState = [];

                const exists = prev.find((sort) => sort.key === key);
                const order: SortOrder | undefined = getNextOrder(exists?.order);

                // update to nextOrder
                if (order && exists) nextArr = prev.map((sort) => (sort.key === key ? { ...sort, order } : sort));

                // add nextOrder
                if (order && !exists) nextArr = [...prev, { key, order }];

                // remove sorting
                if (!order && exists) nextArr = prev.filter((sort) => sort.key !== key);

                const columnLabel = columns?.find((col) => col.key === key)?.label || key;
                sendAriaLiveMessage(`${order ? `Sorted ${order}ending` : 'Removed sorting'} by ${columnLabel}`);

                return nextArr;
            });
        },
        totalColumns: columns?.length || 0,
        totalPages: Math.ceil(data.length / pageSize),
    };
}

function getNextOrder(currentOrder: SortOrder | undefined): SortOrder | undefined {
    if (!currentOrder) return 'asc';
    if (currentOrder === 'asc') return 'desc';
    return undefined;
}
