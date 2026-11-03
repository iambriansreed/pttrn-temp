import '@ptrn/web/ProgressCircle';
import { ProgressCircleProps } from '@ptrn/react/ProgressCircle';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnProgressCircle = 'pttrn-progress-circle' as unknown as ComponentType<any>;

/** The demo state as attributes, in the order the HTML shows them; defaults are left out. */
const attributes = ({ label, size, labelPosition }: Partial<ProgressCircleProps>) => ({
    label: label || undefined,
    size: size && size !== 'medium' ? size : undefined,
    'label-position': labelPosition || undefined,
});

/** The React demo state (the props table) rendered as the element. */
function ProgressCircleWc(props: Partial<ProgressCircleProps>) {
    return <PttrnProgressCircle {...attributes(props)} />;
}

/** The HTML a Web Component user writes for the current demo state. */
function progressCircleToHtml(props: Partial<ProgressCircleProps>) {
    const attrs = Object.entries(attributes(props))
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}="${String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`);
    return `<pttrn-progress-circle${attrs.map((attr) => ` ${attr}`).join('')}></pttrn-progress-circle>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<!-- Mark the region it stands in for as busy while it shows. -->
<section aria-busy="true">
    <pttrn-progress-circle label="Loading results"></pttrn-progress-circle>
</section>`;

export const progressCircleWc: WebComponentDemo = {
    tag: 'pttrn-progress-circle',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens.',
    Wrapper: ProgressCircleWc,
    toHtml: progressCircleToHtml,
};
