import './pagination.scss';
import { SvgChevronLeft } from '@ptrn/icons/ChevronLeft';
import { SvgChevronRight } from '@ptrn/icons/ChevronRight';
import { AriaAttributes, useEffect, useState } from 'react';
import { PageList } from './PageList';
import { Button } from '-/components/Button';
import { Input } from '-/components/Input';
import { sendAriaLiveMessage } from '-/utils/sendAriaLiveMessage';

// After this point the manual input renders. With equal or fewer pages the individual page buttons render instead.
const INPUT_TYPE_THRESHOLD = 7;

export type PaginationProps = {
    /**
     * The number of pages to display in the pagination component.
     *
     * If there is only one page, the component will not render.
     *
     * @default 2
     */
    numPages: number;
    /**
     * The current page number.
     *
     * @default 1
     */
    value: number;

    /** Called when the page changes. */
    onChange: (newPageNumber: number) => void;
};

/**
 * A navigation component that allows customers to move between a range of listed content within a page into smaller
 * multiple micro pages.
 *
 * @example
 *     import { Pagination } from '@ptrn/react/Pagination';
 *
 *     function Example() {
 *         const [currentPage, setCurrentPage] = useState(1);
 *
 *         return <Pagination value={currentPage} onChange={setCurrentPage} numPages={10} />;
 *     }
 *
 * @name Pagination
 * @phase Stable
 */
export function Pagination({
    numPages,
    value,
    onChange: onChangeProp,
    ...ariaProps
}: AriaAttributes & PaginationProps) {
    const onChange = (newPage: number) => {
        onChangeProp(newPage);
        sendAriaLiveMessage(`Page ${newPage} of ${numPages}`);
    };

    const nextPage = () => {
        if (value < numPages) onChange(value + 1);
    };

    const previousPage = () => {
        if (value > 1) onChange(value - 1);
    };

    const [inputValue, setInputValue] = useState<string | undefined>(`${value}`);

    useEffect(() => setInputValue(`${value}`), [value]);

    const submitInputChange = () => {
        const parsedValue = parseInt(inputValue || '', 10);
        if (isNaN(parsedValue)) return setInputValue(`${value}`);

        let next = parsedValue;
        if (parsedValue < 1) next = 1;
        if (parsedValue > numPages) next = numPages;

        onChange(next);
        if (next !== parsedValue) setInputValue(`${next}`);
    };

    const inBounds = (n: number) => n >= 1 && n <= numPages;

    if (numPages <= 1) return null;

    return (
        <span data-pttrn="pagination" role="group" {...ariaProps}>
            <Button
                disabled={!inBounds(value - 1)}
                icon={<SvgChevronLeft />}
                iconOnly
                label={value === 1 ? 'First page' : `Previous page (${value - 1})`}
                onClick={previousPage}
                owner="pagination"
                size="small"
                variant="tertiary"
            />
            {numPages > INPUT_TYPE_THRESHOLD ? (
                <form
                    data-input-form
                    onSubmit={(e) => {
                        e.preventDefault();
                        submitInputChange();
                    }}
                >
                    <Input
                        name="page-number"
                        onBlur={() => submitInputChange()}
                        onChange={setInputValue}
                        owner="pagination"
                        showClearButton={false}
                        type="number"
                        value={inputValue}
                    />
                    <span>of {numPages}</span>
                </form>
            ) : (
                <PageList numPages={numPages} onChange={onChange} value={value} />
            )}

            <Button
                disabled={!inBounds(value + 1)}
                icon={<SvgChevronRight />}
                iconOnly
                label={value === numPages ? 'Last page' : `Next page (${value + 1})`}
                onClick={nextPage}
                owner="pagination"
                size="small"
                variant="tertiary"
            />
        </span>
    );
}
