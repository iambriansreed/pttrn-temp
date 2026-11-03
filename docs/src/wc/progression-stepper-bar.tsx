import '@ptrn/web/ProgressionStepperBar';
import { ProgressionStepperBarProps } from '@ptrn/react/ProgressionStepperBar';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnProgressionStepperBar = 'pttrn-progression-stepper-bar' as unknown as ComponentType<any>;

/** The demo state as the element's attributes; `size` is left off when it is the default. */
const attributes = ({ stepCount, stepCompleted, size }: Partial<ProgressionStepperBarProps>) => ({
    'step-count': stepCount,
    'step-completed': stepCompleted,
    size: size === 'small' ? size : undefined,
});

/** The React demo state (the props table) rendered as the element. */
function ProgressionStepperBarWc(props: Partial<ProgressionStepperBarProps>) {
    return <PttrnProgressionStepperBar {...attributes(props)} />;
}

/** The HTML a Web Component user writes for the current demo state. */
function progressionStepperBarToHtml(props: Partial<ProgressionStepperBarProps>) {
    const attrs = Object.entries(attributes(props))
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}="${value}"`);
    return `<pttrn-progression-stepper-bar ${attrs.join(' ')}></pttrn-progression-stepper-bar>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<h2>Shipping details</h2>
<pttrn-progression-stepper-bar step-count="5" step-completed="2"></pttrn-progression-stepper-bar>`;

export const progressionStepperBarWc: WebComponentDemo = {
    tag: 'pttrn-progression-stepper-bar',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens.',
    Wrapper: ProgressionStepperBarWc,
    toHtml: progressionStepperBarToHtml,
};
