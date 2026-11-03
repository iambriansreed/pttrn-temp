import '@ptrn/web/Textarea';
import { TextareaProps } from '@ptrn/react/Textarea';
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
const PttrnTextarea = 'pttrn-textarea' as unknown as ComponentType<any>;

const count = (value: unknown) => (typeof value === 'number' && !Number.isNaN(value) ? value : undefined);

/** The React props as attributes; `maxLength`, `minRows` and `maxRows` become `maxlength`, `min-rows`, `max-rows`. */
const textareaAttributes = (props: Partial<TextareaProps>): Attributes => ({
    ...fieldAttributes(props),
    value: props.value || undefined,
    placeholder: props.placeholder || undefined,
    maxlength: count(props.maxLength),
    'min-rows': count(props.minRows),
    'max-rows': count(props.maxRows),
});

/** The React demo state (the props table) rendered as the element; typing updates the state as onChange does. */
function TextareaWc(props: Partial<TextareaProps>) {
    const ref = useElementEvent<CustomEvent<{ value: string }>>('pttrn-change', (event) =>
        props.onChange?.(event.detail.value),
    );
    return <PttrnTextarea {...defined(textareaAttributes(props))} ref={ref} />;
}

/** The HTML a Web Component user writes for the current demo state. */
const textareaToHtml = (props: Record<string, unknown>) =>
    elementHtml('pttrn-textarea', textareaAttributes(props as Partial<TextareaProps>));

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<form style="width: 320px">
    <pttrn-textarea label="Textarea" helper-text="This is an example textarea field." name="example-name"></pttrn-textarea>
</form>`;

export const textareaWc: WebComponentDemo = {
    tag: 'pttrn-textarea',
    usage: USAGE,
    usageDescription: USAGE_DESCRIPTION,
    Wrapper: TextareaWc,
    toHtml: textareaToHtml,
};
