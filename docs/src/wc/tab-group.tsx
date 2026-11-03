import '@ptrn/web/TabGroup';
import { TabGroupProps } from '@ptrn/react/TabGroup';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { iconSlotHtml, slottedIcon } from 'src/wc/tab-list-demo';
import { WebComponentDemo } from 'src/wc/types';

/** The elements as React components for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnTabGroup = 'pttrn-tab-group' as unknown as ComponentType<any>;
const PttrnTabGroupItem = 'pttrn-tab-group-item' as unknown as ComponentType<any>;

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** The React demo state rendered as the `pttrn-tab-group` element tree. */
function TabGroupWc({ options = [], value, label, size, width, showTrail }: Partial<TabGroupProps>) {
    return (
        <PttrnTabGroup label={label} show-trail={showTrail ? '' : undefined} size={size} value={value} width={width}>
            {options.map((option, index) => (
                <PttrnTabGroupItem
                    badge={option.badge || undefined}
                    disabled={option.disabled ? '' : undefined}
                    key={`${option.value}-${index}`}
                    label={option.label}
                    value={option.value}
                >
                    {slottedIcon(option.icon, 'icon')}
                    {slottedIcon(option.iconSelected, 'icon-selected')}
                </PttrnTabGroupItem>
            ))}
        </PttrnTabGroup>
    );
}

/** The HTML a Web Component user writes for the current demo state. */
function tabGroupToHtml({ options = [], value, label, size, width, showTrail }: Partial<TabGroupProps>) {
    const attrs = [
        label && `label="${escapeAttr(label)}"`,
        value && `value="${escapeAttr(value)}"`,
        size && size !== 'medium' && `size="${size}"`,
        width && width !== 'hug' && `width="${width}"`,
        showTrail && 'show-trail',
    ].filter(Boolean);
    const items = options
        .map((option) => {
            const itemAttrs = [
                `value="${escapeAttr(option.value)}"`,
                `label="${escapeAttr(option.label)}"`,
                option.badge && `badge="${option.badge}"`,
                option.disabled && 'disabled',
            ].filter(Boolean);
            const icons = [iconSlotHtml(option.icon, 'icon'), iconSlotHtml(option.iconSelected, 'icon-selected')]
                .filter(Boolean)
                .join('\n');
            return `<pttrn-tab-group-item ${itemAttrs.join(' ')}>${icons ? `\n${icons}\n` : ''}</pttrn-tab-group-item>`;
        })
        .join('\n');
    return `<pttrn-tab-group${attrs.length ? ` ${attrs.join(' ')}` : ''}>\n${items}\n</pttrn-tab-group>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-tab-group label="Sections" value="1">
    <pttrn-tab-group-item value="1" label="Option 1" aria-controls="panel-1"></pttrn-tab-group-item>
    <pttrn-tab-group-item value="2" label="Option 2" aria-controls="panel-2"></pttrn-tab-group-item>
    <pttrn-tab-group-item value="3" label="Option 3" aria-controls="panel-3"></pttrn-tab-group-item>
</pttrn-tab-group>
<div id="panel-1" role="tabpanel">Panel one</div>
<div id="panel-2" role="tabpanel" hidden>Panel two</div>
<div id="panel-3" role="tabpanel" hidden>Panel three</div>

<script>
    document.querySelector('pttrn-tab-group').addEventListener('pttrn-change', (event) => {
        document.querySelectorAll('[role="tabpanel"]').forEach((panel) => {
            panel.hidden = panel.id !== \`panel-\${event.detail.value}\`;
        });
    });
</script>`;

export const tabGroupWc: WebComponentDemo = {
    tag: 'pttrn-tab-group',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. Selecting a tab sets `value` and fires `pttrn-change`; each `pttrn-tab-group-item` is the tab itself, so point it at its panel with `aria-controls`.',
    Wrapper: TabGroupWc,
    toHtml: tabGroupToHtml,
};
