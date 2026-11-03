import '@ptrn/web/CheckboxGroup';
import { CheckboxGroupOption, CheckboxGroupProps } from '@ptrn/react/CheckboxGroup';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import {
    Attributes,
    defined,
    elementHtml,
    fieldAttributes,
    flag,
    useElementEvent,
    USAGE_DESCRIPTION,
} from 'src/wc/field-demo';
import { WebComponentDemo } from 'src/wc/types';

/** The elements as React components for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnCheckboxGroup = 'pttrn-checkbox-group' as unknown as ComponentType<any>;
const PttrnCheckboxGroupItem = 'pttrn-checkbox-group-item' as unknown as ComponentType<any>;

/** The Field props a CheckboxGroupField adds; the same element renders them. */
export type CheckboxGroupDemoProps = Partial<CheckboxGroupProps> & {
    label?: string;
    helperText?: string;
    errorMessage?: string;
    labelTrailing?: string;
};

const text = (value: unknown) => (typeof value === 'string' && value ? value : undefined);

const groupAttributes = (props: CheckboxGroupDemoProps): Attributes => ({
    ...fieldAttributes(props),
    'select-all': flag(props.selectAll),
    'select-all-label': text(props.selectAllProps?.label),
    'select-all-description': text(props.selectAllProps?.description),
    label: text(props.label),
    'helper-text': text(props.helperText),
    'error-message': text(props.errorMessage),
    'label-trailing': text(props.labelTrailing),
});

const itemAttributes = (option: CheckboxGroupOption, value: unknown): Attributes => ({
    value: option.value,
    label: option.label,
    description: text(option.description),
    disabled: flag(option.disabled),
    checked: flag(Array.isArray(value) && value.includes(option.value)),
});

/** The React demo state (the props table) rendered as the elements; toggling updates the state as onChange does. */
export function CheckboxGroupWc(props: CheckboxGroupDemoProps) {
    const ref = useElementEvent<CustomEvent<{ value: string[] }>>('pttrn-change', (event) =>
        props.onChange?.(event.detail.value),
    );
    const options = Array.isArray(props.options) ? props.options : [];
    return (
        <PttrnCheckboxGroup {...defined(groupAttributes(props))} ref={ref}>
            {options.map((option, index) => (
                <PttrnCheckboxGroupItem
                    key={`${option.value}-${index}`}
                    {...defined(itemAttributes(option, props.value))}
                />
            ))}
        </PttrnCheckboxGroup>
    );
}

/** The HTML a Web Component user writes for the current demo state. */
export function checkboxGroupToHtml(props: Record<string, unknown>) {
    const { options, value } = props as CheckboxGroupDemoProps;
    const items = (Array.isArray(options) ? options : [])
        .map((option) => elementHtml('pttrn-checkbox-group-item', itemAttributes(option, value)))
        .join('\n');
    return elementHtml(
        'pttrn-checkbox-group',
        groupAttributes(props as CheckboxGroupDemoProps),
        items && `\n${items}\n`,
    );
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<form>
    <pttrn-checkbox-group aria-label="Example Checkbox Group" name="example-checkbox-group" select-all>
        <pttrn-checkbox-group-item value="option1" label="Option 1" checked></pttrn-checkbox-group-item>
        <pttrn-checkbox-group-item value="option2" label="Option 2"></pttrn-checkbox-group-item>
        <pttrn-checkbox-group-item value="option3" label="Option 3"></pttrn-checkbox-group-item>
    </pttrn-checkbox-group>
</form>`;

export const checkboxGroupWc: WebComponentDemo = {
    tag: 'pttrn-checkbox-group',
    usage: USAGE,
    usageDescription: `${USAGE_DESCRIPTION} Each option is a \`pttrn-checkbox-group-item\` child, and its \`checked\` attribute is the starting value; the \`value\` property reads and sets the checked values as an array.`,
    Wrapper: CheckboxGroupWc,
    toHtml: checkboxGroupToHtml,
};
