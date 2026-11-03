import '@ptrn/web/Pagination';
import { PaginationProps } from '@ptrn/react/Pagination';
import { ComponentType, useEffect, useRef } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnPagination = 'pttrn-pagination' as unknown as ComponentType<any>;

/** The React demo state rendered as the element; `pttrn-change` calls the demo's `onChange`, as the React one does. */
function PaginationWc({ numPages, value, onChange }: Partial<PaginationProps>) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element || !onChange) return undefined;
        const listener = (event: Event) => onChange((event as CustomEvent<{ value: number }>).detail.value);
        element.addEventListener('pttrn-change', listener);
        return () => element.removeEventListener('pttrn-change', listener);
    }, [onChange]);

    return <PttrnPagination aria-label="Pagination" num-pages={numPages} ref={ref} value={value} />;
}

/** The HTML a Web Component user writes for the current demo state. */
function paginationToHtml({ numPages, value }: Partial<PaginationProps>) {
    const attrs = [
        'aria-label="Pagination"',
        numPages !== undefined && `num-pages="${numPages}"`,
        value !== undefined && `value="${value}"`,
    ].filter(Boolean);
    return `<pttrn-pagination ${attrs.join(' ')}></pttrn-pagination>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-pagination aria-label="Results" num-pages="10" value="1"></pttrn-pagination>

<script>
    document.querySelector('pttrn-pagination').addEventListener('pttrn-change', (event) => {
        console.log('Page', event.detail.value);
    });
</script>`;

export const paginationWc: WebComponentDemo = {
    tag: 'pttrn-pagination',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. Moving to a page sets `value` and fires `pttrn-change`; the element is the group, so name it with `aria-label`.',
    Wrapper: PaginationWc,
    toHtml: paginationToHtml,
};
