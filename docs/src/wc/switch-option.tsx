import '@ptrn/web/SwitchOption';
import { SwitchOptionProps } from '@ptrn/react/SwitchOption';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { attrs, flag } from 'src/wc/demo-html';
import { useChange } from 'src/wc/switch';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnSwitchOption = 'pttrn-switch-option' as unknown as ComponentType<any>;

/** The React demo state rendered as the element. */
function SwitchOptionWc({
    checked,
    description,
    disabled,
    label,
    name,
    onChange,
    style,
    value,
}: Partial<SwitchOptionProps>) {
    const ref = useChange(onChange);
    return (
        <PttrnSwitchOption
            checked={flag(checked)}
            description={description || undefined}
            disabled={flag(disabled)}
            label={label}
            name={name || undefined}
            ref={ref}
            style={style}
            value={value || undefined}
        />
    );
}

/** The HTML a Web Component user writes for the current demo state. */
function switchOptionToHtml(props: Partial<SwitchOptionProps>) {
    const attributes = attrs({
        label: props.label,
        description: props.description,
        name: props.name,
        value: props.value,
        checked: !!props.checked,
        disabled: !!props.disabled,
    });
    return `<pttrn-switch-option${attributes}></pttrn-switch-option>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<form>
    <pttrn-switch-option
        label="Dark mode"
        description="Easier on the eyes at night."
        name="dark-mode"
        checked
    ></pttrn-switch-option>
</form>`;

export const switchOptionWc: WebComponentDemo = {
    tag: 'pttrn-switch-option',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. The whole row toggles the switch; it fires `pttrn-change` and `change`, and submits `value` under `name` in a form while on.',
    Wrapper: SwitchOptionWc,
    toHtml: (props) => switchOptionToHtml(props as Partial<SwitchOptionProps>),
};
