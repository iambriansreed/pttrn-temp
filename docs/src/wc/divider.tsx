import '@ptrn/web/Divider';
import { DividerProps } from '@ptrn/react/Divider';
import { DividerExample } from '@ptrn/react/Divider/DividerExample';
import { ComponentType, CSSProperties } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnDivider = 'pttrn-divider' as unknown as ComponentType<any>;

/** The demo state as attributes, in the order the HTML shows them; defaults are left out. */
const attributes = ({ orientation, thickness, padding = true, inset }: Partial<DividerProps>) => ({
    orientation: orientation === 'vertical' ? orientation : undefined,
    thickness: thickness === 'heavy' ? thickness : undefined,
    'hide-padding': padding === false ? '' : undefined,
    inset: inset ? inset : undefined,
});

/** The element in place of the React Divider. */
function DividerElement({ style, ...props }: Partial<DividerProps> & { style?: CSSProperties }) {
    return <PttrnDivider {...attributes(props)} style={style} />;
}

/**
 * The React demo state (the props table) rendered as the element, inside the React example's own layout (the line
 * between two placeholders), so both tabs show the same thing.
 */
function DividerWc(props: Partial<DividerProps>) {
    return DividerExample.render!({
        props: props as DividerProps,
        Component: DividerElement as ComponentType<DividerProps>,
        setState: () => {},
        id: 'divider-wc',
    });
}

/** The HTML a Web Component user writes for the current demo state. */
function dividerToHtml(props: Partial<DividerProps>) {
    const attrs = Object.entries(attributes(props))
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => (value === '' ? key : `${key}="${value}"`));
    return `<pttrn-divider${attrs.map((attr) => ` ${attr}`).join('')}></pttrn-divider>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<div style="display: flex; flex-direction: column; width: 320px">
    <p>Content above the divider</p>
    <pttrn-divider></pttrn-divider>
    <p>Content below the divider</p>
</div>`;

export const dividerWc: WebComponentDemo = {
    tag: 'pttrn-divider',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens.',
    Wrapper: DividerWc,
    toHtml: dividerToHtml,
};
