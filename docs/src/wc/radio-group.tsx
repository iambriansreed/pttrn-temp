import '@ptrn/web/RadioGroup';
import { RadioGroupOption, RadioGroupProps } from '@ptrn/react/RadioGroup';
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
const PttrnRadioGroup = 'pttrn-radio-group' as unknown as ComponentType<any>;
const PttrnRadioGroupItem = 'pttrn-radio-group-item' as unknown as ComponentType<any>;

/** The Field props a RadioGroupField adds; the same element renders them. */
export type RadioGroupDemoProps = Partial<RadioGroupProps> & {
    label?: string;
    helperText?: string;
    errorMessage?: string;
    labelTrailing?: string;
};

const text = (value: unknown) => (typeof value === 'string' && value ? value : undefined);

const groupAttributes = (props: RadioGroupDemoProps): Attributes => ({
    ...fieldAttributes(props),
    value: text(props.value),
    label: text(props.label),
    'helper-text': text(props.helperText),
    'error-message': text(props.errorMessage),
    'label-trailing': text(props.labelTrailing),
});

const itemAttributes = (option: RadioGroupOption): Attributes => ({
    value: option.value,
    label: option.label,
    description: text(option.description),
    disabled: flag(option.disabled),
});

/** The React demo state (the props table) rendered as the elements; choosing updates the state as onChange does. */
export function RadioGroupWc(props: RadioGroupDemoProps) {
    const ref = useElementEvent<CustomEvent<{ value: string }>>('pttrn-change', (event) =>
        props.onChange?.(event.detail.value),
    );
    const options = Array.isArray(props.options) ? props.options : [];
    return (
        <PttrnRadioGroup {...defined(groupAttributes(props))} ref={ref}>
            {options.map((option, index) => (
                <PttrnRadioGroupItem key={`${option.value}-${index}`} {...defined(itemAttributes(option))} />
            ))}
        </PttrnRadioGroup>
    );
}

/** The HTML a Web Component user writes for the current demo state. */
export function radioGroupToHtml(props: Record<string, unknown>) {
    const { options } = props as RadioGroupDemoProps;
    const items = (Array.isArray(options) ? options : [])
        .map((option) => elementHtml('pttrn-radio-group-item', itemAttributes(option)))
        .join('\n');
    return elementHtml('pttrn-radio-group', groupAttributes(props as RadioGroupDemoProps), items && `\n${items}\n`);
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<form>
    <pttrn-radio-group aria-label="Example options" name="example-name" value="1">
        <pttrn-radio-group-item value="1" label="Option 1" description="Description here"></pttrn-radio-group-item>
        <pttrn-radio-group-item value="2" label="Option 2"></pttrn-radio-group-item>
        <pttrn-radio-group-item value="3" label="Option 3"></pttrn-radio-group-item>
    </pttrn-radio-group>
</form>`;

export const radioGroupWc: WebComponentDemo = {
    tag: 'pttrn-radio-group',
    usage: USAGE,
    usageDescription: `${USAGE_DESCRIPTION} Each option is a \`pttrn-radio-group-item\` child.`,
    Wrapper: RadioGroupWc,
    toHtml: radioGroupToHtml,
};
