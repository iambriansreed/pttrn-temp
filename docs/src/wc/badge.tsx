import '@ptrn/web/Avatar';
import '@ptrn/web/Badge';
import { BadgeProps } from '@ptrn/react/Badge';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The elements as React components for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnBadge = 'pttrn-badge' as unknown as ComponentType<any>;
const PttrnAvatar = 'pttrn-avatar' as unknown as ComponentType<any>;

/** What the badge is attached to in the React example (`BadgeExample.tsx`): an avatar. */
const ATTACHED_TO = <PttrnAvatar image="/avatar-01.png" name="Andre Giant" />;
const ATTACHED_TO_HTML = '<pttrn-avatar image="/avatar-01.png" name="Andre Giant"></pttrn-avatar>';

/** The demo state as attributes, in the order the HTML shows them. */
const attributes = ({ count, size, color, surfaceBorder }: Partial<BadgeProps>) => ({
    count: count ?? undefined,
    size: size && size !== 'small' ? size : undefined,
    color: color && color !== 'primary' ? color : undefined,
    'surface-border': surfaceBorder ? '' : undefined,
});

/** The React demo state (the props table) rendered as the element. */
function BadgeWc(props: Partial<BadgeProps>) {
    return <PttrnBadge {...attributes(props)}>{ATTACHED_TO}</PttrnBadge>;
}

/** The HTML a Web Component user writes for the current demo state. */
function badgeToHtml(props: Partial<BadgeProps>) {
    const attrs = Object.entries(attributes(props))
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => (value === '' ? key : `${key}="${value}"`));
    return `<pttrn-badge${attrs.map((attr) => ` ${attr}`).join('')}>\n${ATTACHED_TO_HTML}\n</pttrn-badge>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<!-- Assistive technology reads the number alone: the element it is attached to says what it counts. -->
<pttrn-badge count="5" surface-border>
    <button type="button" aria-label="Messages, 5 unread">Messages</button>
</pttrn-badge>`;

export const badgeWc: WebComponentDemo = {
    tag: 'pttrn-badge',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens.',
    Wrapper: BadgeWc,
    toHtml: badgeToHtml,
};
