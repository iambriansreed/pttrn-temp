import '@ptrn/web/Link';
import { LinkProps } from '@ptrn/react/Link';
import { LinkExample } from '@ptrn/react/Link/LinkExample';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnLink = 'pttrn-link' as unknown as ComponentType<any>;

/** The demo state as attributes, in the order the HTML shows them; defaults are left out. */
const attributes = ({ label, href, trailingIcon, size, variant, target, disabled }: Partial<LinkProps>) => ({
    label: label || undefined,
    href: href || undefined,
    'trailing-icon': trailingIcon || undefined,
    size: size && size !== 'base' ? size : undefined,
    variant: variant && variant !== 'default' ? variant : undefined,
    target: target && target !== '_self' ? target : undefined,
    disabled: disabled ? '' : undefined,
});

/** The element in place of the React Link. */
function LinkElement(props: LinkProps) {
    return <PttrnLink {...attributes(props)} />;
}

/** The React demo state rendered as the element, inside the React example's own layout (a dark band for inverse). */
function LinkWc(props: Partial<LinkProps>) {
    return LinkExample.render!({
        props: props as LinkProps,
        Component: LinkElement,
        setState: () => {},
        id: 'link-wc',
    });
}

/** The HTML a Web Component user writes for the current demo state. */
function linkToHtml(props: Partial<LinkProps>) {
    const attrs = Object.entries(attributes(props))
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) =>
            value === '' ? key : `${key}="${String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`,
        );
    return `<pttrn-link${attrs.map((attr) => ` ${attr}`).join('')}></pttrn-link>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-link href="https://example.com" label="Example label" trailing-icon="external"></pttrn-link>
<pttrn-link href="/components" label="All components" trailing-icon="chevron" size="small"></pttrn-link>`;

export const linkWc: WebComponentDemo = {
    tag: 'pttrn-link',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens.',
    Wrapper: LinkWc,
    toHtml: linkToHtml,
};
