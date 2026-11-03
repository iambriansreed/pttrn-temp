import '@ptrn/web/ProgressionStepper';
import { ProgressionStepperProps } from '@ptrn/react/ProgressionStepper';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The custom elements as React components for the demo. */
const PttrnProgressionStepper = 'pttrn-progression-stepper' as unknown as ComponentType<any>;
const PttrnProgressionStepperItem = 'pttrn-progression-stepper-item' as unknown as ComponentType<any>;

/** The React demo state (`steps`, `completedStep`, `variant`) rendered as the element tree. */
function ProgressionStepperWc({ steps = [], completedStep, variant }: Partial<ProgressionStepperProps>) {
    return (
        <PttrnProgressionStepper completed-step={completedStep} variant={variant}>
            {steps.map(({ name, subtext }, index) => (
                <PttrnProgressionStepperItem key={index} name={name} subtext={subtext || undefined} />
            ))}
        </PttrnProgressionStepper>
    );
}

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** The HTML a Web Component user writes for the current demo state. */
function progressionStepperToHtml({ steps = [], completedStep, variant }: Partial<ProgressionStepperProps>) {
    const attrs = [
        variant && variant !== 'horizontal' && `variant="${variant}"`,
        completedStep !== undefined && `completed-step="${completedStep}"`,
    ].filter(Boolean);
    const items = steps.map(
        ({ name, subtext }) =>
            `<pttrn-progression-stepper-item name="${escapeAttr(name)}"${subtext ? ` subtext="${escapeAttr(subtext)}"` : ''}></pttrn-progression-stepper-item>`,
    );
    return `<pttrn-progression-stepper${attrs.length ? ` ${attrs.join(' ')}` : ''}>\n${items.join('\n')}\n</pttrn-progression-stepper>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<h2>Checkout</h2>
<pttrn-progression-stepper completed-step="1">
    <pttrn-progression-stepper-item name="Account"></pttrn-progression-stepper-item>
    <pttrn-progression-stepper-item name="Address" subtext="Where we ship"></pttrn-progression-stepper-item>
    <pttrn-progression-stepper-item name="Review"></pttrn-progression-stepper-item>
</pttrn-progression-stepper>`;

export const progressionStepperWc: WebComponentDemo = {
    tag: 'pttrn-progression-stepper',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens.',
    Wrapper: ProgressionStepperWc,
    toHtml: progressionStepperToHtml,
};
