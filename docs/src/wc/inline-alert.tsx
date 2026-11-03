import '@ptrn/web/InlineAlert';
import { InlineAlertProps } from '@ptrn/react/InlineAlert';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { attrs } from 'src/wc/demo-html';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnInlineAlert = 'pttrn-inline-alert' as unknown as ComponentType<any>;

/** The React demo state (the props table) rendered as the element. */
function InlineAlertWc({ id, label, owner, variant }: Partial<InlineAlertProps>) {
    return <PttrnInlineAlert id={id} label={label} owner={owner || undefined} variant={variant} />;
}

/** The HTML a Web Component user writes for the current demo state. */
function inlineAlertToHtml({ label, owner, variant }: Partial<InlineAlertProps>) {
    return `<pttrn-inline-alert${attrs({ variant, owner, label })}></pttrn-inline-alert>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-inline-alert variant="informational">Example informational inline alert</pttrn-inline-alert>
<pttrn-inline-alert variant="error">Example error inline alert</pttrn-inline-alert>
<pttrn-inline-alert variant="success">Example success inline alert</pttrn-inline-alert>
<pttrn-inline-alert variant="warning">Example warning inline alert</pttrn-inline-alert>`;

export const inlineAlertWc: WebComponentDemo = {
    tag: 'pttrn-inline-alert',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. The message is the text inside the element, or its `label` attribute. Give it an `id` when a field points at it with aria-describedby.',
    Wrapper: InlineAlertWc,
    toHtml: (props) => inlineAlertToHtml(props as Partial<InlineAlertProps>),
};
