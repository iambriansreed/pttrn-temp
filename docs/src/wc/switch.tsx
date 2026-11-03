import '@ptrn/web/Switch';
import { SwitchProps } from '@ptrn/react/Switch';
import { ComponentType, useEffect, useRef } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { attrs, flag } from 'src/wc/demo-html';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnSwitch = 'pttrn-switch' as unknown as ComponentType<any>;

/** Calls the demo's `onChange(checked, event)` for each `pttrn-change` of the element behind `ref`. */
export function useChange(onChange?: (checked: boolean, event: any) => void) {
    const ref = useRef<HTMLElement>(null);
    useEffect(() => {
        const element = ref.current;
        const listener = (event: Event) =>
            onChange?.((event as CustomEvent<{ checked: boolean }>).detail.checked, event);
        element?.addEventListener('pttrn-change', listener);
        return () => element?.removeEventListener('pttrn-change', listener);
    }, [onChange]);
    return ref;
}

/** The React demo state rendered as the element. */
function SwitchWc({ 'aria-label': ariaLabel, checked, disabled, id, name, onChange, value }: Partial<SwitchProps>) {
    const ref = useChange(onChange);
    return (
        <PttrnSwitch
            aria-label={ariaLabel || undefined}
            checked={flag(checked)}
            disabled={flag(disabled)}
            id={id}
            name={name || undefined}
            ref={ref}
            value={value || undefined}
        />
    );
}

/** The HTML a Web Component user writes for the current demo state. */
function switchToHtml(props: Partial<SwitchProps>) {
    const attributes = attrs({
        'aria-label': props['aria-label'],
        name: props.name,
        value: props.value,
        checked: !!props.checked,
        disabled: !!props.disabled,
    });
    return `<pttrn-switch${attributes}></pttrn-switch>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<form>
    <label style="display: flex; gap: var(--usa-spacing-1); align-items: center">
        <pttrn-switch name="dark-mode" checked></pttrn-switch>
        Dark mode
    </label>
</form>`;

export const switchWc: WebComponentDemo = {
    tag: 'pttrn-switch',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. Label the switch with a `<label>` or aria-label. It keeps its own state, fires `pttrn-change` and `change`, and submits `value` under `name` in a form while on.',
    Wrapper: SwitchWc,
    toHtml: (props) => switchToHtml(props as Partial<SwitchProps>),
};
