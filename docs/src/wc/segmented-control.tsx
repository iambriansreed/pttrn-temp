import '@ptrn/web/SegmentedControl';
import { SegmentedControlProps } from '@ptrn/react/SegmentedControl';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { iconSlotHtml, slottedIcon } from 'src/wc/tab-list-demo';
import { WebComponentDemo } from 'src/wc/types';

/** The elements as React components for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnSegmentedControl = 'pttrn-segmented-control' as unknown as ComponentType<any>;
const PttrnSegmentedControlItem = 'pttrn-segmented-control-item' as unknown as ComponentType<any>;

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** The React demo state rendered as the `pttrn-segmented-control` element tree. */
function SegmentedControlWc({ options = [], value, label, size, width, iconsOnly }: Partial<SegmentedControlProps>) {
    return (
        <PttrnSegmentedControl
            icons-only={iconsOnly ? '' : undefined}
            label={label}
            size={size}
            value={value}
            width={width}
        >
            {options.map((option, index) => (
                <PttrnSegmentedControlItem
                    disabled={option.disabled ? '' : undefined}
                    key={`${option.value}-${index}`}
                    label={option.label}
                    value={option.value}
                >
                    {slottedIcon(option.icon, 'icon')}
                    {slottedIcon(option.iconSelected, 'icon-selected')}
                </PttrnSegmentedControlItem>
            ))}
        </PttrnSegmentedControl>
    );
}

/** The HTML a Web Component user writes for the current demo state. */
function segmentedControlToHtml({
    options = [],
    value,
    label,
    size,
    width,
    iconsOnly,
}: Partial<SegmentedControlProps>) {
    const attrs = [
        label && `label="${escapeAttr(label)}"`,
        value && `value="${escapeAttr(value)}"`,
        size && size !== 'medium' && `size="${size}"`,
        width && width !== 'hug' && `width="${width}"`,
        iconsOnly && 'icons-only',
    ].filter(Boolean);
    const items = options
        .map((option) => {
            const itemAttrs = [
                `value="${escapeAttr(option.value)}"`,
                `label="${escapeAttr(option.label)}"`,
                option.disabled && 'disabled',
            ].filter(Boolean);
            const icons = [iconSlotHtml(option.icon, 'icon'), iconSlotHtml(option.iconSelected, 'icon-selected')]
                .filter(Boolean)
                .join('\n');
            return `<pttrn-segmented-control-item ${itemAttrs.join(' ')}>${icons ? `\n${icons}\n` : ''}</pttrn-segmented-control-item>`;
        })
        .join('\n');
    return `<pttrn-segmented-control${attrs.length ? ` ${attrs.join(' ')}` : ''}>\n${items}\n</pttrn-segmented-control>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-segmented-control label="View" value="1">
    <pttrn-segmented-control-item value="1" label="Option 1"></pttrn-segmented-control-item>
    <pttrn-segmented-control-item value="2" label="Option 2"></pttrn-segmented-control-item>
    <pttrn-segmented-control-item value="3" label="Option 3"></pttrn-segmented-control-item>
</pttrn-segmented-control>

<script>
    document.querySelector('pttrn-segmented-control').addEventListener('pttrn-change', (event) => {
        console.log('Selected', event.detail.value);
    });
</script>`;

export const segmentedControlWc: WebComponentDemo = {
    tag: 'pttrn-segmented-control',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. Selecting a segment sets `value` and fires `pttrn-change`; put an icon in the `icon` and `icon-selected` slots of an item.',
    Wrapper: SegmentedControlWc,
    toHtml: segmentedControlToHtml,
};
