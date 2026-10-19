import { PaginationProps } from './Pagination';
import { Button } from '-/components/Button';

export type PageListProps = Pick<PaginationProps, 'numPages' | 'onChange' | 'value'>;

/**
 * PageList component displays a list of page buttons for pagination.
 *
 * @name PageList
 * @parent Pagination
 */
export function PageList({ numPages, onChange, value }: PageListProps) {
    return Array.from({ length: numPages }, (_, index) => {
        const page = index + 1;
        return (
            <Button
                aria-current={value === page ? 'page' : undefined}
                aria-label={`Page ${page}`}
                key={page}
                label={String(page)}
                onClick={() => onChange(page)}
                owner="pagination"
                size="small"
                variant={value === page ? 'primary' : 'tertiary'}
            />
        );
    });
}
