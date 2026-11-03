import '@ptrn/web/InputPhone';
import { InputPhoneProps } from '@ptrn/react/InputPhone';
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
const PttrnInputPhone = 'pttrn-input-phone' as unknown as ComponentType<any>;

type ChangeDetail = { value: string; countryCode: Parameters<InputPhoneProps['onChange']>[1] };

/** The React props as attributes; `initialCountryCode` is `country-code`. `renderFlag` is a JavaScript property. */
const inputPhoneAttributes = (props: Partial<InputPhoneProps>): Attributes => ({
    ...fieldAttributes(props),
    value: props.value || undefined,
    'country-code': props.initialCountryCode || undefined,
    'disable-formatting': flag(props.disableFormatting),
    'scroll-limit': typeof props.scrollLimit === 'number' && props.scrollLimit !== 5 ? props.scrollLimit : undefined,
});

/** The React demo state (the props table) rendered as the element; typing updates the state as onChange does. */
function InputPhoneWc(props: Partial<InputPhoneProps>) {
    const ref = useElementEvent<CustomEvent<ChangeDetail>>('pttrn-change', (event) =>
        props.onChange?.(event.detail.value, event.detail.countryCode),
    );
    return <PttrnInputPhone {...defined(inputPhoneAttributes(props))} ref={ref} />;
}

/** The HTML a Web Component user writes for the current demo state. */
const inputPhoneToHtml = (props: Record<string, unknown>) =>
    elementHtml('pttrn-input-phone', inputPhoneAttributes(props as Partial<InputPhoneProps>));

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<form style="width: 320px">
    <pttrn-input-phone
        label="Example Input Phone"
        helper-text="The phone input allows you to enter a phone number with country code."
        country-code="US"
        name="example-name"
    ></pttrn-input-phone>
</form>

<script type="module">
    const phone = document.querySelector('pttrn-input-phone');
    phone.addEventListener('pttrn-change', (event) => console.log(event.detail.value, event.detail.countryCode));
    // Optional decorative flags: any string, DOM node or Lit template per country.
    phone.renderFlag = (code) => String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));
</script>`;

export const inputPhoneWc: WebComponentDemo = {
    tag: 'pttrn-input-phone',
    usage: USAGE,
    usageDescription: `${USAGE_DESCRIPTION} The form receives the number under \`name\` and the country under \`<name>-country-code\`.`,
    Wrapper: InputPhoneWc,
    toHtml: inputPhoneToHtml,
};
