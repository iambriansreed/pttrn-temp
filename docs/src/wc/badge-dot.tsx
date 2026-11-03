import '@ptrn/web/Avatar';
import '@ptrn/web/BadgeDot';
import '@ptrn/web/Button';
import { BadgeDotProps } from '@ptrn/react/BadgeDot';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The elements as React components for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnBadgeDot = 'pttrn-badge-dot' as unknown as ComponentType<any>;
const PttrnAvatar = 'pttrn-avatar' as unknown as ComponentType<any>;
const PttrnButton = 'pttrn-button' as unknown as ComponentType<any>;

/** What the dot is attached to in the React example (`BadgeDotExample.tsx`): a button when outlined, else an avatar. */
const attachedTo = (outline?: boolean) =>
    outline ? <PttrnButton label="Button" size="large" /> : <PttrnAvatar image="/avatar-01.png" name="Andre Giant" />;
const attachedToHtml = (outline?: boolean) =>
    outline
        ? '<pttrn-button label="Button" size="large"></pttrn-button>'
        : '<pttrn-avatar image="/avatar-01.png" name="Andre Giant"></pttrn-avatar>';

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
    return `<pttrn-badge-dot${attrs.map((attr) => ` ${attr}`).join('')}>\n${attachedToHtml(props.outline)}\n</pttrn-badge-dot>`;
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
