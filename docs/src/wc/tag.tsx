import '@ptrn/web/Tag';
import { TagProps } from '@ptrn/react/Tag';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnTag = 'pttrn-tag' as unknown as ComponentType<any>;

/** The demo state as attributes, in the order the HTML shows them; defaults are left out. */
const attributes = ({ label, color, size, variant }: Partial<TagProps>) => ({
    label: label || undefined,
    color: color && color !== 'base' ? color : undefined,
    size: size && size !== 'small' ? size : undefined,
    variant: variant && variant !== 'flat' ? variant : undefined,
});

/** The React demo state (the props table) rendered as the element. */
function TagWc(props: Partial<TagProps>) {
    return <PttrnTag {...attributes(props)} />;
}

/** The HTML a Web Component user writes for the current demo state. */
function tagToHtml(props: Partial<TagProps>) {
    const attrs = Object.entries(attributes(props))
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}="${String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`);
    return `<pttrn-tag${attrs.map((attr) => ` ${attr}`).join('')}></pttrn-tag>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-tag label="Draft"></pttrn-tag>
<pttrn-tag label="Published" color="success" variant="pill"></pttrn-tag>
<pttrn-tag label="New" color="info" size="x-small" variant="corner-wrap"></pttrn-tag>`;

export const tagWc: WebComponentDemo = {
    tag: 'pttrn-tag',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens.',
    Wrapper: TagWc,
    toHtml: tagToHtml,
};
