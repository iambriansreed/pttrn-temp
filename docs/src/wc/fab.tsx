import '@ptrn/web/Fab';
import boltIcon from '@ptrn/icons/Bolt.svg?raw';
import { FabProps } from '@ptrn/react/Fab';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { attrs, flag, iconHtml, slotted } from 'src/wc/demo-html';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnFab = 'pttrn-fab' as unknown as ComponentType<any>;

type DemoProps = Partial<FabProps> & { href?: string };

/** The React demo state (the props table) rendered as the element. */
function FabWc({
    'aria-label': ariaLabel,
    container,
    href,
    icon,
    iconOnly,
    label,
    onClick,
    placement,
    size,
    tooltip,
    variant,
}: DemoProps) {
    return (
        <PttrnFab
            aria-label={ariaLabel || undefined}
            container={container}
            href={href}
            icon-only={flag(iconOnly)}
            label={label}
            onClick={onClick}
            placement={placement}
            size={size}
            tooltip={tooltip || undefined}
            variant={variant}
        >
            {slotted(icon)}
        </PttrnFab>
    );
}

/** The HTML a Web Component user writes for the current demo state. */
async function fabToHtml(props: Record<string, unknown>) {
    const { icon, iconOnly } = props as DemoProps;
    const svg = await iconHtml(icon);
    const attributes = attrs({
        label: props.label,
        size: props.size,
        variant: props.variant,
        placement: props.placement,
        container: props.container,
        'icon-only': !!iconOnly,
        tooltip: props.tooltip,
        'aria-label': props['aria-label'],
    });
    return `<pttrn-fab${attributes}>${svg ? `\n${svg}\n` : ''}</pttrn-fab>`;
}

const BOLT = boltIcon.trim().replace('<svg', '<svg slot="icon"');

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<div style="position: relative; height: var(--usa-spacing-15)">
    <pttrn-fab label="Example label" variant="neutral">
        ${BOLT}
    </pttrn-fab>
</div>`;

export const fabWc: WebComponentDemo = {
    tag: 'pttrn-fab',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. The element sits in a corner of its nearest positioned ancestor, or of the viewport with `container="page"`.',
    Wrapper: FabWc,
    toHtml: fabToHtml,
};
