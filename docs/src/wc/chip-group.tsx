import '@ptrn/web/ChipGroup';
import closeIcon from '@ptrn/icons/Close.svg?raw';
import lightbulbIcon from '@ptrn/icons/Lightbulb.svg?raw';
import starIcon from '@ptrn/icons/Star.svg?raw';
import { ChipGroupProps } from '@ptrn/react/ChipGroup';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { chipHtml, ChipWc } from 'src/wc/chip';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnChipGroup = 'pttrn-chip-group' as unknown as ComponentType<any>;

/** The React demo state (`overflow`, `items`) rendered as the element with one `pttrn-chip` per item. */
function ChipGroupWc({ items = [], overflow }: Partial<ChipGroupProps>) {
    return (
        <PttrnChipGroup overflow={overflow}>
            {items.map((item, index) => (
                <ChipWc key={item.label ?? index} {...item} />
            ))}
        </PttrnChipGroup>
    );
}

/** The HTML a Web Component user writes for the current demo state. */
async function chipGroupToHtml({ items = [], overflow }: Partial<ChipGroupProps>) {
    const chips = await Promise.all(
        items.map((item) => chipHtml(item, { leading: item.leadingIcon, trailing: item.trailingIcon })),
    );
    return `<pttrn-chip-group${overflow ? ` overflow="${overflow}"` : ''}>\n${chips.join('\n')}\n</pttrn-chip-group>`;
}

const icon = (markup: string, slot: string) => markup.trim().replace('<svg', `<svg slot="${slot}"`);

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-chip-group overflow="scroll">
    <pttrn-chip label="Ideas">
        ${icon(lightbulbIcon, 'leading-icon')}
    </pttrn-chip>
    <pttrn-chip label="Favorites" badge-count="5" badge-size="x-small">
        ${icon(starIcon, 'leading-icon')}
    </pttrn-chip>
    <pttrn-chip label="Clear">
        ${icon(closeIcon, 'trailing-icon')}
    </pttrn-chip>
</pttrn-chip-group>`;

export const chipGroupWc: WebComponentDemo = {
    tag: 'pttrn-chip-group',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. Each item of the React `items` array is a `pttrn-chip` child.',
    Wrapper: ChipGroupWc,
    toHtml: (props) => chipGroupToHtml(props as Partial<ChipGroupProps>),
};
