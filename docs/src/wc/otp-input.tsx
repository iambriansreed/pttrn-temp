import '@ptrn/web/OTPInput';
import { OTPInputProps } from '@ptrn/react/OTPInput';
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

/** The element as a React component for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnOTPInput = 'pttrn-otp-input' as unknown as ComponentType<any>;

/** The React props as attributes; `defaultValue` is the `value` attribute, the default a form reset goes back to. */
const otpAttributes = (props: Partial<OTPInputProps>): Attributes => ({
    ...fieldAttributes(props),
    value: props.defaultValue || undefined,
    length: typeof props.length === 'number' && props.length !== 6 ? props.length : undefined,
    alphanumeric: flag(props.alphanumeric),
    secure: flag(props.secure),
});

/** The React demo state (the props table) rendered as the element; a complete code calls onChange as React does. */
function OTPInputWc(props: Partial<OTPInputProps>) {
    const ref = useElementEvent<CustomEvent<{ value: string }>>('pttrn-change', (event) =>
        props.onChange?.(event.detail.value),
    );
    // A new length or default value starts a fresh element, as the React demo remounts on a preset.
    return <PttrnOTPInput {...defined(otpAttributes(props))} key={`${props.length}-${props.defaultValue}`} ref={ref} />;
}

/** The HTML a Web Component user writes for the current demo state. */
const otpToHtml = (props: Record<string, unknown>) =>
    elementHtml('pttrn-otp-input', otpAttributes(props as Partial<OTPInputProps>));

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<form>
    <pttrn-otp-input name="2-auth" length="6" value="8675"></pttrn-otp-input>
</form>

<script type="module">
    // Fires once the last cell fills: verify the code here.
    document.querySelector('pttrn-otp-input').addEventListener('pttrn-change', (event) => console.log(event.detail.value));
</script>`;

export const otpInputWc: WebComponentDemo = {
    tag: 'pttrn-otp-input',
    usage: USAGE,
    usageDescription: USAGE_DESCRIPTION,
    Wrapper: OTPInputWc,
    toHtml: otpToHtml,
};
