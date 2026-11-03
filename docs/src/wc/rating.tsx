import '@ptrn/web/Rating';
import { RatingProps } from '@ptrn/react/Rating';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { Attributes, defined, elementHtml, flag, useElementEvent } from 'src/wc/field-demo';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnRating = 'pttrn-rating' as unknown as ComponentType<any>;

/** React makes the rating interactive when it has an `onChange`; the element has the `interactive` attribute. */
const ratingAttributes = (props: Partial<RatingProps>): Attributes => ({
    value: typeof props.value === 'number' ? props.value : undefined,
    size: props.size && props.size !== 'medium' ? props.size : undefined,
    interactive: flag(typeof props.onChange === 'function'),
});

/** The React demo state (the props table) rendered as the element; choosing updates the state as onChange does. */
function RatingWc(props: Partial<RatingProps>) {
    const ref = useElementEvent<CustomEvent<{ value: number }>>('pttrn-change', (event) =>
        props.onChange?.(event.detail.value),
    );
    return <PttrnRating {...defined(ratingAttributes(props))} ref={ref} />;
}

/** The HTML a Web Component user writes for the current demo state. */
const ratingToHtml = (props: Record<string, unknown>) =>
    elementHtml('pttrn-rating', ratingAttributes(props as Partial<RatingProps>));

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-rating value="4.5" size="large"></pttrn-rating>

<form>
    <pttrn-rating interactive name="stars"></pttrn-rating>
</form>`;

export const ratingWc: WebComponentDemo = {
    tag: 'pttrn-rating',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. A rating is read-only unless it has `interactive`; an interactive rating fires `pttrn-change` and, with a `name`, submits the chosen number with its form.',
    Wrapper: RatingWc,
    toHtml: ratingToHtml,
};
