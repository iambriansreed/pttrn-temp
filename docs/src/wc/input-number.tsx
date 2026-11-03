import '@ptrn/web/InputNumber';
import { InputNumberProps } from '@ptrn/react/InputNumber';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import {
    Attributes,
    defined,
    elementHtml,
    fieldAttributes,
    useElementEvent,
    USAGE_DESCRIPTION,
} from 'src/wc/field-demo';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnInputNumber = 'pttrn-input-number' as unknown as ComponentType<any>;

const num = (value: unknown) => (typeof value === 'number' && !Number.isNaN(value) ? value : undefined);

const inputNumberAttributes = (props: Partial<InputNumberProps>): Attributes => ({
    ...fieldAttributes(props),
    value: num(props.value),
    min: num(props.min),
    max: num(props.max),
    step: num(props.step),
    align: props.align === 'left' ? 'left' : undefined,
});

/** The React demo state (the props table) rendered as the element; a change updates the state as onChange does. */
function InputNumberWc(props: Partial<InputNumberProps>) {
    const ref = useElementEvent<CustomEvent<{ value: number | undefined }>>('pttrn-change', (event) =>
        props.onChange?.(event.detail.value),
    );
    return <PttrnInputNumber {...defined(inputNumberAttributes(props))} ref={ref} />;
}

/** The HTML a Web Component user writes for the current demo state. */
const inputNumberToHtml = (props: Record<string, unknown>) =>
    elementHtml('pttrn-input-number', inputNumberAttributes(props as Partial<InputNumberProps>));

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<form style="width: 320px">
    <pttrn-input-number
        label="Example Input Number"
        helper-text="The input number allows you to increment or decrement a value."
        name="example-name"
    ></pttrn-input-number>
</form>`;

export const inputNumberWc: WebComponentDemo = {
    tag: 'pttrn-input-number',
    usage: USAGE,
    usageDescription: USAGE_DESCRIPTION,
    Wrapper: InputNumberWc,
    toHtml: inputNumberToHtml,
};
