import '@ptrn/web/Input';
import { InputProps } from '@ptrn/react/Input';
import { ComponentType, ReactNode } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import {
    Attributes,
    defined,
    elementHtml,
    escapeHtml,
    fieldAttributes,
    flag,
    useElementEvent,
    USAGE_DESCRIPTION,
} from 'src/wc/field-demo';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnInput = 'pttrn-input' as unknown as ComponentType<any>;

type DemoProps = Partial<InputProps> & { leading?: ReactNode; trailing?: ReactNode };

/**
 * The React props as attributes. `showClearButton` (default true) is inverted to `hide-clear-button`. The demo's
 * `label` and `description` are not Input props (the React demo ignores them), so they stay out and both tabs look the
 * same.
 */
const inputAttributes = (props: DemoProps): Attributes => ({
    ...fieldAttributes(props),
    value: props.value === undefined || props.value === '' ? undefined : String(props.value),
    placeholder: props.placeholder || undefined,
    type: props.type && props.type !== 'text' ? props.type : undefined,
    autocomplete: props.autoComplete && props.autoComplete !== 'off' ? props.autoComplete : undefined,
    'hide-clear-button': flag(props.showClearButton === false),
});

const slotText = (node: ReactNode) => (typeof node === 'string' || typeof node === 'number' ? String(node) : '');

/** The React demo state (the props table) rendered as the element; typing updates the state as onChange does. */
function InputWc(props: DemoProps) {
    const ref = useElementEvent<CustomEvent<{ value: string }>>('pttrn-change', (event) =>
        props.onChange?.(event.detail.value),
    );
    return (
        <PttrnInput {...defined(inputAttributes(props))} ref={ref}>
            {props.leading ? <span slot="leading">{props.leading}</span> : null}
            {props.trailing ? <span slot="trailing">{props.trailing}</span> : null}
        </PttrnInput>
    );
}

/** The HTML a Web Component user writes for the current demo state. */
function inputToHtml(props: Record<string, unknown>) {
    const { leading, trailing } = props as DemoProps;
    const inner = [
        slotText(leading) && `<span slot="leading">${escapeHtml(slotText(leading))}</span>`,
        slotText(trailing) && `<span slot="trailing">${escapeHtml(slotText(trailing))}</span>`,
    ]
        .filter(Boolean)
        .join('\n');
    return elementHtml('pttrn-input', inputAttributes(props as DemoProps), inner);
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<form style="width: 320px">
    <pttrn-input label="Example Input" helper-text="This is an example input field." name="example-name"></pttrn-input>
</form>

<script type="module">
    document.querySelector('pttrn-input').addEventListener('pttrn-change', (event) => console.log(event.detail.value));
</script>`;

export const inputWc: WebComponentDemo = {
    tag: 'pttrn-input',
    usage: USAGE,
    usageDescription: USAGE_DESCRIPTION,
    Wrapper: InputWc,
    toHtml: inputToHtml,
};
