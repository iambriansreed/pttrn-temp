import '@ptrn/web/Avatar';
import { AvatarProps } from '@ptrn/react/Avatar';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnAvatar = 'pttrn-avatar' as unknown as ComponentType<any>;

/**
 * The demo state as attributes, in the order the HTML shows them; defaults are left out. React makes the avatar a
 * button when it has `onClick`; the element has the `clickable` attribute for that.
 */
const attributes = ({
    name,
    size,
    color,
    initials,
    showIcon,
    image,
    hideTooltip,
    focusable,
    disabled,
    onClick,
}: Partial<AvatarProps>) => ({
    name: name || undefined,
    size: size && size !== 'small' ? size : undefined,
    color: color && color !== 'base' ? color : undefined,
    initials: initials || undefined,
    'show-icon': showIcon ? '' : undefined,
    image: image || undefined,
    'hide-tooltip': hideTooltip ? '' : undefined,
    focusable: focusable ? '' : undefined,
    clickable: typeof onClick === 'function' ? '' : undefined,
    disabled: disabled ? '' : undefined,
});

/** The React demo state (the props table) rendered as the element; a click calls the demo's onClick. */
function AvatarWc(props: Partial<AvatarProps>) {
    return <PttrnAvatar {...attributes(props)} onClick={props.onClick} />;
}

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** The HTML a Web Component user writes for the current demo state. */
function avatarToHtml(props: Partial<AvatarProps>) {
    const attrs = Object.entries(attributes(props))
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => (value === '' ? key : `${key}="${escapeAttr(String(value))}"`));
    return `<pttrn-avatar${attrs.map((attr) => ` ${attr}`).join('')}></pttrn-avatar>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-avatar name="Andre Giant" image="/avatar-01.png" size="large"></pttrn-avatar>
<pttrn-avatar name="Inigo Montoya" color="info" size="large"></pttrn-avatar>
<pttrn-avatar name="Princess Buttercup" show-icon color="accent-cool" size="large"></pttrn-avatar>

<!-- A clickable avatar is a button: a click, Enter or Space fires "click". -->
<pttrn-avatar name="Miracle Max" color="success" size="large" clickable onclick="console.log('Clicked')"></pttrn-avatar>`;

export const avatarWc: WebComponentDemo = {
    tag: 'pttrn-avatar',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens.',
    Wrapper: AvatarWc,
    toHtml: avatarToHtml,
};
