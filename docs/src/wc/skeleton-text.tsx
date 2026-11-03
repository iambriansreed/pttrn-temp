import '@ptrn/web/SkeletonText';
import { SkeletonTextProps } from '@ptrn/react/SkeletonText';
import { SkeletonTextExample } from '@ptrn/react/SkeletonText/SkeletonTextExample';
import { ComponentType, ReactNode } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { useComponentContext } from 'src/components/ComponentProvider';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnSkeletonText = 'pttrn-skeleton-text' as unknown as ComponentType<any>;

/** The demo state as attributes, in the order the HTML shows them; defaults are left out. */
const attributes = ({ variant, lines }: Partial<SkeletonTextProps>) => ({
    variant: variant && variant !== 'body-base' ? variant : undefined,
    lines: lines !== undefined && lines !== 3 ? lines : undefined,
});

/** The element in place of the React SkeletonText; what the example passes as children is slotted in. */
function SkeletonTextElement({ children, ...props }: SkeletonTextProps) {
    return <PttrnSkeletonText {...attributes(props)}>{children as ReactNode}</PttrnSkeletonText>;
}

/**
 * The React demo state (the props table) rendered as the element, through the React example's own render, so the
 * "Loading Transition" preset swaps the placeholder for text after three seconds on both tabs.
 */
function SkeletonTextWc(props: Partial<SkeletonTextProps>) {
    const { preset } = useComponentContext();
    return SkeletonTextExample.render!({
        props: props as SkeletonTextProps,
        preset,
        Component: SkeletonTextElement,
        setState: () => {},
        id: 'skeleton-text-wc',
    });
}

/** The HTML a Web Component user writes for the current demo state. */
function skeletonTextToHtml(props: Partial<SkeletonTextProps>) {
    const attrs = Object.entries(attributes(props))
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}="${value}"`);
    return `<pttrn-skeleton-text${attrs.map((attr) => ` ${attr}`).join('')}></pttrn-skeleton-text>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<!-- While the text loads, the placeholder shows: one bar per line, in the size of the text. -->
<pttrn-skeleton-text variant="body-base" lines="2"></pttrn-skeleton-text>

<!-- Once the text is put inside the element, it shows instead. -->
<pttrn-skeleton-text variant="body-base" lines="2">
    <pttrn-txt as="p">This is the loaded text content that was previously loading.</pttrn-txt>
</pttrn-skeleton-text>`;

export const skeletonTextWc: WebComponentDemo = {
    tag: 'pttrn-skeleton-text',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens.',
    Wrapper: SkeletonTextWc,
    toHtml: skeletonTextToHtml,
};
