import '@ptrn/web/Skeleton';
import { SkeletonProps } from '@ptrn/react/Skeleton';
import { SkeletonExample } from '@ptrn/react/Skeleton/SkeletonExample';
import { ComponentType, ReactNode } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { useComponentContext } from 'src/components/ComponentProvider';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnSkeleton = 'pttrn-skeleton' as unknown as ComponentType<any>;

/** The demo state as attributes, in the order the HTML shows them; defaults are left out. */
const attributes = ({ variant, width, height }: Partial<SkeletonProps>) => ({
    variant: variant && variant !== 'rectangular' ? variant : undefined,
    width: width !== undefined && width !== 100 ? width : undefined,
    height: height !== undefined && height !== 100 ? height : undefined,
});

/** The element in place of the React Skeleton; what the example passes as children is slotted in. */
function SkeletonElement({ children, ...props }: SkeletonProps) {
    return <PttrnSkeleton {...attributes(props)}>{children as ReactNode}</PttrnSkeleton>;
}

/**
 * The React demo state (the props table) rendered as the element, through the React example's own render, so the
 * "Loading Transition" preset swaps the placeholder for content after three seconds on both tabs.
 */
function SkeletonWc(props: Partial<SkeletonProps>) {
    const { preset } = useComponentContext();
    return SkeletonExample.render!({
        props: props as SkeletonProps,
        preset,
        Component: SkeletonElement,
        setState: () => {},
        id: 'skeleton-wc',
    });
}

/** The HTML a Web Component user writes for the current demo state. */
function skeletonToHtml(props: Partial<SkeletonProps>) {
    const attrs = Object.entries(attributes(props))
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}="${String(value).replace(/"/g, '&quot;')}"`);
    return `<pttrn-skeleton${attrs.map((attr) => ` ${attr}`).join('')}></pttrn-skeleton>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<!-- While the content loads, the placeholder shows. -->
<pttrn-skeleton variant="photo" width="118" height="118"></pttrn-skeleton>

<!-- Once the content is put inside the element, it shows instead. -->
<pttrn-skeleton variant="photo" width="118" height="118">
    <img alt="Andre Giant" src="/avatar-01.png" width="118" height="118" />
</pttrn-skeleton>`;

export const skeletonWc: WebComponentDemo = {
    tag: 'pttrn-skeleton',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens.',
    Wrapper: SkeletonWc,
    toHtml: skeletonToHtml,
};
