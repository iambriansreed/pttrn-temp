import '@ptrn/web/Slider';
import { SliderProps, SliderValue } from '@ptrn/react/Slider';
import { ComponentType, useCallback } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { Attributes, defined, elementHtml, flag } from 'src/wc/field-demo';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnSlider = 'pttrn-slider' as unknown as ComponentType<any>;

type DemoProps = Partial<SliderProps<SliderValue>>;
type SliderElement = HTMLElement & { formatNumber?: SliderProps<SliderValue>['formatNumber'] };

/** The React props as attributes, with the defaults the React demo gives (`value` 50, `min` 0, `max` 100). */
const sliderAttributes = (props: DemoProps): Attributes => {
    const value = props.value || 50;
    return {
        label: props.label || undefined,
        name: props.name || undefined,
        value: Array.isArray(value) ? value.join(',') : value,
        min: props.min || 0,
        max: props.max || 100,
        step: typeof props.step === 'number' && props.step !== 1 ? props.step : undefined,
        marks: flag(props.marks),
        disabled: flag(props.disabled),
        readonly: flag(props.readOnly),
    };
};

/** The React demo state (the props table) rendered as the element; `formatNumber` is a property, set on the element. */
function SliderWc(props: DemoProps) {
    const { formatNumber } = props;
    const ref = useCallback(
        (element: SliderElement | null) => {
            if (element) element.formatNumber = formatNumber;
        },
        [formatNumber],
    );
    return <PttrnSlider {...defined(sliderAttributes(props))} ref={ref} />;
}

/** The HTML a Web Component user writes for the current demo state, with the script that sets `formatNumber`. */
function sliderToHtml(props: Record<string, unknown>) {
    const { formatNumber } = props as DemoProps;
    const element = elementHtml('pttrn-slider', sliderAttributes(props as DemoProps));
    if (typeof formatNumber !== 'function') return element;
    return `${element}\n<script type="module">\n    document.querySelector('pttrn-slider').formatNumber = ${formatNumber.toString()};\n</script>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<form style="width: 100%">
    <pttrn-slider label="Slider Example" max="100" min="0" name="slider-example" value="50"></pttrn-slider>
    <pttrn-slider label="Price range" max="100" min="0" name="price" value="20,60"></pttrn-slider>
</form>

<script type="module">
    const [volume, price] = document.querySelectorAll('pttrn-slider');
    volume.addEventListener('pttrn-change', (event) => console.log(event.detail.value));
    price.formatNumber = (value) => \`$\${value}\`;
</script>`;

export const sliderWc: WebComponentDemo = {
    tag: 'pttrn-slider',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. Two numbers in `value` make a range. `formatNumber` is a JavaScript property; inside a `<form>` the slider submits its `name` and value ("start,end" for a range).',
    Wrapper: SliderWc,
    toHtml: sliderToHtml,
};
