import '@ptrn/web/Button';
import addIcon from '@ptrn/icons/Add.svg?raw';
import { ButtonProps } from '@ptrn/react/Button';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { attrs, escapeText, flag, iconHtml, slotted } from 'src/wc/demo-html';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnButton = 'pttrn-button' as unknown as ComponentType<any>;

type DemoProps = Partial<ButtonProps> & { href?: string };

/** The React demo state (the props table) rendered as the element. */
function ButtonWc({
    'aria-label': ariaLabel,
    children,
    destructive,
    disabled,
    href,
    icon,
    iconOnly,
    label,
    onClick,
    size,
    tooltip,
    variant,
    width,
}: DemoProps) {
    return (
        <PttrnButton
            aria-label={ariaLabel || undefined}
            destructive={flag(destructive)}
            disabled={flag(disabled)}
            href={href}
            icon-only={flag(iconOnly)}
            label={label}
            onClick={onClick}
            size={size}
            tooltip={tooltip || undefined}
            variant={variant}
            width={width}
        >
            {slotted(icon)}
            {typeof children === 'string' ? children : null}
        </PttrnButton>
    );
}

/** The HTML a Web Component user writes for the current demo state. */
async function buttonToHtml(props: Record<string, unknown>) {
    const { children, icon, iconOnly, destructive, disabled } = props as DemoProps;
    const icons = await iconHtml(icon);
    const text = typeof children === 'string' ? escapeText(children) : '';
    const attributes = attrs({
        label: props.label,
        size: props.size,
        variant: props.variant,
        width: props.width,
        destructive: !!destructive,
        disabled: !!disabled,
        'icon-only': !!iconOnly,
        tooltip: props.tooltip,
        'aria-label': props['aria-label'],
    });
    const inner = [icons, text].filter(Boolean).join('\n');
    return `<pttrn-button${attributes}>${inner ? `\n${inner}\n` : ''}</pttrn-button>`;
}

const ADD = addIcon.trim().replace('<svg', '<svg slot="icon"');

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<div style="display: flex; flex-wrap: wrap; gap: var(--usa-spacing-2); align-items: center">
    <pttrn-button label="Add item">
        ${ADD}
    </pttrn-button>
    <pttrn-button label="Cancel" variant="secondary"></pttrn-button>
    <pttrn-button label="Delete" variant="tertiary" destructive></pttrn-button>
    <pttrn-button label="Add" icon-only>
        ${ADD}
    </pttrn-button>
</div>`;

export const buttonWc: WebComponentDemo = {
    tag: 'pttrn-button',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. Put an icon in the `icon` slot (the raw `.svg` files of `@ptrn/icons` work as they are) and listen for the native `click` event.',
    Wrapper: ButtonWc,
    toHtml: buttonToHtml,
};
