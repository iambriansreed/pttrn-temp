import '@ptrn/web/AvatarGroup';
import { AvatarGroupProps, AvatarItem } from '@ptrn/react/AvatarGroup';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The elements as React components for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnAvatarGroup = 'pttrn-avatar-group' as unknown as ComponentType<any>;
const PttrnAvatar = 'pttrn-avatar' as unknown as ComponentType<any>;

/** The group's demo state as attributes, in the order the HTML shows them; defaults are left out. */
const groupAttributes = ({ size, max, variant }: Partial<AvatarGroupProps>) => ({
    size: size && size !== 'small' ? size : undefined,
    max: max !== undefined && max !== 5 ? max : undefined,
    variant: variant && variant !== 'stacked' ? variant : undefined,
});

/** One `items` entry as the attributes of a child `pttrn-avatar`. */
const itemAttributes = ({ name, image, initials, color, showIcon }: AvatarItem) => ({
    name,
    image: image || undefined,
    initials: initials || undefined,
    color: color && color !== 'base' ? color : undefined,
    'show-icon': showIcon ? '' : undefined,
});

/** The React demo state (the props table) rendered as the element, with each item as a child avatar. */
function AvatarGroupWc({ items = [], style, ...props }: Partial<AvatarGroupProps>) {
    return (
        <PttrnAvatarGroup {...groupAttributes(props)} style={style}>
            {items.map((item, index) => (
                <PttrnAvatar key={index} {...itemAttributes(item)} />
            ))}
        </PttrnAvatarGroup>
    );
}

const toAttributes = (attributes: Record<string, unknown>) =>
    Object.entries(attributes)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) =>
            value === '' ? ` ${key}` : ` ${key}="${String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`,
        )
        .join('');

/** The HTML a Web Component user writes for the current demo state. */
function avatarGroupToHtml({ items = [], ...props }: Partial<AvatarGroupProps>) {
    const avatars = items.map((item) => `<pttrn-avatar${toAttributes(itemAttributes(item))}></pttrn-avatar>`);
    return `<pttrn-avatar-group${toAttributes(groupAttributes(props))}>\n${avatars.join('\n')}\n</pttrn-avatar-group>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-avatar-group max="3" size="medium">
    <pttrn-avatar name="Fezzik" image="/avatar-01.png"></pttrn-avatar>
    <pttrn-avatar name="Inigo Montoya" initials="IM" color="info"></pttrn-avatar>
    <pttrn-avatar name="Miracle Max" color="success"></pttrn-avatar>
    <pttrn-avatar name="Princess Buttercup" show-icon color="accent-cool"></pttrn-avatar>
    <pttrn-avatar name="Westley" image="/avatar-02.png"></pttrn-avatar>
</pttrn-avatar-group>`;

export const avatarGroupWc: WebComponentDemo = {
    tag: 'pttrn-avatar-group',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens.',
    Wrapper: AvatarGroupWc,
    toHtml: avatarGroupToHtml,
};
