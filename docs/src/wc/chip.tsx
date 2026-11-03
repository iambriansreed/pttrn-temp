import '@ptrn/web/Chip';
import cloudIcon from '@ptrn/icons/Cloud.svg?raw';
import { ChipProps } from '@ptrn/react/Chip';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { attrs, flag, iconHtml, slotted } from 'src/wc/demo-html';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnChip = 'pttrn-chip' as unknown as ComponentType<any>;

/** The attributes for a chip's demo props: `selected={false}` is a toggle that is off. */
export function chipAttributes({ disabled, flat, label, selected, trailingBadge }: Partial<ChipProps>) {
    return {
        label,
        disabled: !!disabled,
        flat: !!flat,
        selected: !!selected,
        toggle: selected === false,
        'badge-count': trailingBadge?.count,
        'badge-size': trailingBadge?.size,
        'badge-surface-border': !!trailingBadge?.surfaceBorder,
    };
}

/** One chip from its React props, as the element; used by ChipGroup's demo too. */
export function ChipWc({ leadingIcon, onClick, trailingIcon, ...props }: Partial<ChipProps>) {
    const attributes = Object.fromEntries(
        Object.entries(chipAttributes(props)).map(([key, value]) => [
            key,
            typeof value === 'boolean' ? flag(value) : value,
        ]),
    );
    return (
        <PttrnChip {...attributes} onClick={onClick}>
            {slotted(leadingIcon, 'leading-icon')}
            {slotted(trailingIcon, 'trailing-icon')}
        </PttrnChip>
    );
}

/**
 * The HTML for one chip. Icons in the demo state are names (the Chip page) or React elements (ChipGroup items), so the
 * names are passed separately.
 */
export async function chipHtml(props: Partial<ChipProps>, icons: { leading?: unknown; trailing?: unknown }) {
    const [leading, trailing] = await Promise.all([
        iconHtml(icons.leading, 'leading-icon'),
        iconHtml(icons.trailing, 'trailing-icon'),
    ]);
    const inner = [leading, trailing].filter(Boolean).join('\n');
    return `<pttrn-chip${attrs(chipAttributes(props))}>${inner ? `\n${inner}\n` : ''}</pttrn-chip>`;
}

/** The HTML a Web Component user writes for the current demo state. */
function chipToHtml(props: Record<string, unknown>) {
    return chipHtml(props as Partial<ChipProps>, { leading: props.leadingIcon, trailing: props.trailingIcon });
}

const CLOUD = cloudIcon.trim().replace('<svg', '<svg slot="leading-icon"');

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<div style="display: flex; gap: var(--usa-spacing-1)">
    <pttrn-chip label="Assist chip">
        ${CLOUD}
    </pttrn-chip>
    <pttrn-chip label="Filter chip" toggle></pttrn-chip>
    <pttrn-chip label="Inbox" badge-count="3" badge-size="x-small" selected></pttrn-chip>
</div>`;

export const chipWc: WebComponentDemo = {
    tag: 'pttrn-chip',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. Icons go in the `leading-icon` and `trailing-icon` slots, and the native `click` event is the action. A chip does not toggle itself: a filter chip sets `selected` in its `click` listener.',
    Wrapper: ChipWc,
    toHtml: chipToHtml,
};
