import '@ptrn/web/ProgressBar';
import { ProgressBarProps } from '@ptrn/react/ProgressBar';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnProgressBar = 'pttrn-progress-bar' as unknown as ComponentType<any>;

/** The demo state as attributes, in the order the HTML shows them; defaults are left out. */
const attributes = ({ label, completion, size, align, successColor, successHidden }: Partial<ProgressBarProps>) => ({
    label: label || undefined,
    completion: completion ?? undefined,
    size: size && size !== 'large' ? size : undefined,
    align: align && align !== 'center' ? align : undefined,
    'success-color': successColor ? '' : undefined,
    'success-hidden': successHidden ? '' : undefined,
});

/** The React demo state (the props table) rendered as the element. */
function ProgressBarWc(props: Partial<ProgressBarProps>) {
    return <PttrnProgressBar {...attributes(props)} />;
}

/** The HTML a Web Component user writes for the current demo state. */
function progressBarToHtml(props: Partial<ProgressBarProps>) {
    const attrs = Object.entries(attributes(props))
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) =>
            value === '' ? key : `${key}="${String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`,
        );
    return `<pttrn-progress-bar${attrs.map((attr) => ` ${attr}`).join('')}></pttrn-progress-bar>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<div style="width: 320px">
    <pttrn-progress-bar label="Uploading 3 of 6 files" completion="50"></pttrn-progress-bar>
</div>`;

export const progressBarWc: WebComponentDemo = {
    tag: 'pttrn-progress-bar',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens.',
    Wrapper: ProgressBarWc,
    toHtml: progressBarToHtml,
};
