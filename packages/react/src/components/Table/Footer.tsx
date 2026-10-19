import { Pagination } from '-/components/Pagination';

/**
 * TableFooter component displays pagination controls and information for a table.
 *
 * @name TableFooter
 * @parent Table
 */
export function TableFooter({
    pageIndex,
    pageSize,
    setPageIndex,
    totalRows,
    id,
    totalPages,
}: {
    pageIndex: number;
    pageSize: number;
    setPageIndex: (newVal: number) => void;
    totalRows: number;
    id: string;
    totalPages: number;
}) {
    const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
    const endRow = Math.min(startRow + pageSize - 1, totalRows);
    return (
        <div data-pagination role="group">
            <div data-pagination-label>
                Showing {startRow}-{endRow} of {totalRows} results
            </div>
            <div data-sr-only id={`${id}-pagination-description`}>
                <p>
                    The buttons inside this control allow you to paginate through the data in the table above,{' '}
                    {pageSize} rows at a time.
                </p>
            </div>
            <Pagination
                aria-labelledby={`${id}-pagination-description`}
                numPages={totalPages}
                onChange={(newVal) => setPageIndex(newVal - 1)}
                value={pageIndex + 1}
            />
        </div>
    );
}
