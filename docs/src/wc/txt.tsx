import '@ptrn/web/Txt';
import { TxtProps } from '@ptrn/react/Txt';
import { ComponentType, ReactElement, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnTxt = 'pttrn-txt' as unknown as ComponentType<any>;

/** The demo state as attributes, in the order the HTML shows them; defaults are left out. */
const attributes = ({ as, variant, skeletonLines, inherit, id }: Partial<TxtProps>) => ({
    id: id || undefined,
    as: typeof as === 'string' && as !== 'span' ? as : undefined,
    variant: variant && variant !== 'body-base' ? variant : undefined,
    'skeleton-lines': skeletonLines ? skeletonLines : undefined,
    inherit: inherit ? '' : undefined,
});

/** The React demo state (the props table) rendered as the element. */
function TxtWc({ children, ...props }: Partial<TxtProps>) {
    return <PttrnTxt {...attributes(props)}>{children as ReactNode}</PttrnTxt>;
}

function nodeToHtml(node: unknown): string {
    if (node === null || node === undefined || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    return renderToStaticMarkup(node as ReactElement);
}

/** The HTML a Web Component user writes for the current demo state. */
function txtToHtml({ children, ...props }: Partial<TxtProps>) {
    const attrs = Object.entries(attributes(props))
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => (value === '' ? key : `${key}="${String(value).replace(/"/g, '&quot;')}"`));
    return `<pttrn-txt${attrs.map((attr) => ` ${attr}`).join('')}>${nodeToHtml(children)}</pttrn-txt>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-txt as="h2" variant="heading-h2">Example heading</pttrn-txt>
<pttrn-txt as="p">Example text, with <code>code</code> inside.</pttrn-txt>
<!-- While the text loads: two skeleton lines in its size. -->
<pttrn-txt as="p" skeleton-lines="2"></pttrn-txt>`;

export const txtWc: WebComponentDemo = {
    tag: 'pttrn-txt',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens.',
    Wrapper: TxtWc,
    toHtml: txtToHtml,
};
