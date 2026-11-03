import '@ptrn/web/BadgeDot';
import { Avatar } from '@ptrn/react/Avatar';
import { BadgeDotProps } from '@ptrn/react/BadgeDot';
import { Button } from '@ptrn/react/Button';
import { ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnBadgeDot = 'pttrn-badge-dot' as unknown as ComponentType<any>;

/**
 * What the dot is attached to in the React example (`BadgeDotExample.tsx`): a button when outlined, else an avatar.
 * They are the React components until their Web Components exist, so the generated HTML carries their React markup.
 */
const attachedTo = (outline?: boolean) =>
    outline ? <Button label="Button" size="large" /> : <Avatar image="/avatar-01.png" name="Andre Giant" />;

/** The demo state as attributes, in the order the HTML shows them. */
const attributes = ({ color, size, outline }: Partial<BadgeDotProps>) => ({
    color: color && color !== 'primary' ? color : undefined,
    size: size && size !== 6 ? size : undefined,
    outline: outline ? '' : undefined,
});

/** The React demo state (the props table) rendered as the element. */
function BadgeDotWc(props: Partial<BadgeDotProps>) {
    return <PttrnBadgeDot {...attributes(props)}>{attachedTo(props.outline)}</PttrnBadgeDot>;
}

/** The HTML a Web Component user writes for the current demo state. */
function badgeDotToHtml(props: Partial<BadgeDotProps>) {
    const attrs = Object.entries(attributes(props))
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => (value === '' ? key : `${key}="${value}"`));
    return `<pttrn-badge-dot${attrs.map((attr) => ` ${attr}`).join('')}>\n${renderToStaticMarkup(attachedTo(props.outline))}\n</pttrn-badge-dot>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<!-- The dot is decorative: the element it marks says what it means in its label. -->
<pttrn-badge-dot color="secondary" size="12" outline>
    <button type="button" aria-label="Messages, new">Messages</button>
</pttrn-badge-dot>`;

export const badgeDotWc: WebComponentDemo = {
    tag: 'pttrn-badge-dot',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens.',
    Wrapper: BadgeDotWc,
    toHtml: badgeDotToHtml,
};
