import '@ptrn/web/CheckboxOption';
import { CheckboxOptionProps } from '@ptrn/react/CheckboxOption';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { checkboxAttributes } from 'src/wc/checkbox';
import { attrs, flag } from 'src/wc/demo-html';
import { useChange } from 'src/wc/switch';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnCheckboxOption = 'pttrn-checkbox-option' as unknown as ComponentType<any>;

/** The React demo state rendered as the element. */
function CheckboxOptionWc({ description, label, onChange, style, ...props }: Partial<CheckboxOptionProps>) {
    const ref = useChange(onChange);
    const attributes = Object.fromEntries(
        Object.entries(checkboxAttributes(props)).map(([key, value]) => [
            key,
            typeof value === 'boolean' ? flag(value) : value || undefined,
        ]),
    );
    return (
        <PttrnCheckboxOption
            {...attributes}
            description={description || undefined}
            label={label}
            ref={ref}
            style={style}
        />
    );
}

/** The HTML a Web Component user writes for the current demo state. */
function checkboxOptionToHtml(props: Partial<CheckboxOptionProps>) {
    const attributes = attrs({ label: props.label, description: props.description, ...checkboxAttributes(props) });
    return `<pttrn-checkbox-option${attributes}></pttrn-checkbox-option>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<form>
    <pttrn-checkbox-option
        label="Example Checkbox"
        description="This is an example checkbox option."
        name="example-checkbox-name"
        value="example-checkbox-value"
    ></pttrn-checkbox-option>
</form>`;

export const checkboxOptionWc: WebComponentDemo = {
    tag: 'pttrn-checkbox-option',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. The whole row toggles the checkbox; it fires `pttrn-change` and `change`, and in a form submits `value` under `name` while checked.',
    Wrapper: CheckboxOptionWc,
    toHtml: (props) => checkboxOptionToHtml(props as Partial<CheckboxOptionProps>),
};
