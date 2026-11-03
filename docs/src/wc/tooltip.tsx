import '@ptrn/web/Tooltip';
import { TooltipProps } from '@ptrn/react/Tooltip';
import { ComponentType, ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnTooltip = 'pttrn-tooltip' as unknown as ComponentType<any>;

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/**
 * The React demo renders its trigger with a render function given the trigger props. The element wires the trigger
 * itself, so the demo calls the function with none and slots what it returns.
 */
const trigger = (children: TooltipProps['children'] | undefined): ReactElement =>
    typeof children === 'function' ? children({}) : <span>No Hover</span>;

/** The React demo state (the props table) rendered as the element. */
function TooltipWc({ children, label, placement, disabled, showTail = true }: Partial<TooltipProps>) {
    return (
        <PttrnTooltip
            disabled={disabled ? '' : undefined}
            hide-tail={showTail ? undefined : ''}
            label={label}
            placement={placement}
        >
            {trigger(children)}
        </PttrnTooltip>
    );
}

/** The HTML a Web Component user writes for the current demo state. */
function tooltipToHtml({ children, label, placement, disabled, showTail = true }: Partial<TooltipProps>) {
    const attrs = [
        `label="${escapeAttr(label ?? '')}"`,
        placement && `placement="${placement}"`,
        disabled && 'disabled',
        !showTail && 'hide-tail',
    ].filter(Boolean);
    return `<pttrn-tooltip ${attrs.join(' ')}>\n${renderToStaticMarkup(trigger(children))}\n</pttrn-tooltip>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-tooltip label="I explain what this button does" placement="top">
    <button type="button">Click me</button>
</pttrn-tooltip>`;

export const tooltipWc: WebComponentDemo = {
    tag: 'pttrn-tooltip',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. The first child element is the trigger: the tooltip shows while it is hovered or focused.',
    Wrapper: TooltipWc,
    toHtml: tooltipToHtml,
};
