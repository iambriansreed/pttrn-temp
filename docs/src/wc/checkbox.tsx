import '@ptrn/web/Checkbox';
import { CheckboxProps } from '@ptrn/react/Checkbox';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { attrs, flag } from 'src/wc/demo-html';
import { useChange } from 'src/wc/switch';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnCheckbox = 'pttrn-checkbox' as unknown as ComponentType<any>;

/** The checkbox attributes of a demo state, shared by the option demos. */
export const checkboxAttributes = (props: Partial<CheckboxProps>) => ({
    name: props.name,
    value: props.value,
    checked: !!props.checked,
    indeterminate: !!props.indeterminate,
    disabled: !!props.disabled,
    invalid: !!props.invalid,
    required: !!props.required,
});

/** The React demo state rendered as the element. */
function CheckboxWc({ 'aria-label': ariaLabel, id, onChange, ...props }: Partial<CheckboxProps>) {
    const ref = useChange(onChange);
    const attributes = Object.fromEntries(
        Object.entries(checkboxAttributes(props)).map(([key, value]) => [
            key,
            typeof value === 'boolean' ? flag(value) : value || undefined,
        ]),
    );
    return <PttrnCheckbox {...attributes} aria-label={ariaLabel || undefined} id={id} ref={ref} />;
}

/** The HTML a Web Component user writes for the current demo state. */
function checkboxToHtml(props: Partial<CheckboxProps>) {
    return `<pttrn-checkbox${attrs({ 'aria-label': props['aria-label'], ...checkboxAttributes(props) })}></pttrn-checkbox>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<form>
    <label style="display: flex; gap: var(--usa-spacing-1); align-items: center">
        <pttrn-checkbox name="terms" value="accepted" required></pttrn-checkbox>
        I accept the terms
    </label>
</form>`;

export const checkboxWc: WebComponentDemo = {
    tag: 'pttrn-checkbox',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. Label the checkbox with a `<label>` or aria-label. It keeps its own state, fires `pttrn-change` and `change`, and in a form submits `value` under `name` while checked.',
    Wrapper: CheckboxWc,
    toHtml: (props) => checkboxToHtml(props as Partial<CheckboxProps>),
};
