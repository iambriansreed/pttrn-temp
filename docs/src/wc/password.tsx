import '@ptrn/web/Password';
import { PasswordProps } from '@ptrn/react/Password';
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
const PttrnPassword = 'pttrn-password' as unknown as ComponentType<any>;

const passwordAttributes = (props: Partial<PasswordProps>): Attributes => ({
    ...fieldAttributes(props),
    value: props.value || undefined,
});

/** The React demo state (the props table) rendered as the element; typing updates the state as onChange does. */
function PasswordWc(props: Partial<PasswordProps>) {
    const ref = useElementEvent<CustomEvent<{ value: string }>>('pttrn-change', (event) =>
        props.onChange?.(event.detail.value),
    );
    return <PttrnPassword {...defined(passwordAttributes(props))} ref={ref} />;
}

/** The HTML a Web Component user writes for the current demo state. */
const passwordToHtml = (props: Record<string, unknown>) =>
    elementHtml('pttrn-password', passwordAttributes(props as Partial<PasswordProps>));

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<form style="width: 320px">
    <pttrn-password
        label="Password"
        helper-text="The password field allows you to enter a secure password."
        name="password"
    ></pttrn-password>
</form>`;

export const passwordWc: WebComponentDemo = {
    tag: 'pttrn-password',
    usage: USAGE,
    usageDescription: USAGE_DESCRIPTION,
    Wrapper: PasswordWc,
    toHtml: passwordToHtml,
};
