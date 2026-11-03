import '@ptrn/web/PageControl';
import { PageControlProps } from '@ptrn/react/PageControl';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnPageControl = 'pttrn-page-control' as unknown as ComponentType<any>;

/** The React demo state rendered as the element. */
function PageControlWc({ currentPage, numPages, variant }: Partial<PageControlProps>) {
    return <PttrnPageControl current-page={currentPage} num-pages={numPages} variant={variant} />;
}

/** The HTML a Web Component user writes for the current demo state. */
function pageControlToHtml({ currentPage, numPages, variant }: Partial<PageControlProps>) {
    const attrs = [
        currentPage !== undefined && `current-page="${currentPage}"`,
        numPages !== undefined && `num-pages="${numPages}"`,
        variant && variant !== 'flat' && `variant="${variant}"`,
    ].filter(Boolean);
    return `<pttrn-page-control ${attrs.join(' ')}></pttrn-page-control>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-page-control current-page="1" num-pages="3"></pttrn-page-control>`;

export const pageControlWc: WebComponentDemo = {
    tag: 'pttrn-page-control',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. Set `current-page` as the user moves through the pages.',
    Wrapper: PageControlWc,
    toHtml: pageControlToHtml,
};
