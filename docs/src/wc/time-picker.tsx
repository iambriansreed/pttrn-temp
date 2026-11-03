import '@ptrn/web/TimePicker';
import { TimePickerProps } from '@ptrn/react/TimePicker';
import { ComponentType, useEffect, useRef } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnTimePicker = 'pttrn-time-picker' as unknown as ComponentType<any>;

type Props = Partial<TimePickerProps>;

const flag = (on?: boolean) => (on ? '' : undefined);

/** The demo state as the element's attributes. */
const attributes = ({ id, name, value, size, disabled, readOnly, invalid, ...props }: Props) => ({
    'aria-label': props['aria-label'],
    id,
    name,
    value,
    size,
    disabled: flag(disabled),
    readonly: flag(readOnly),
    invalid: flag(invalid),
});

/** The demo state as the element. A changed time goes back to the demo state through `onChange`, as in React. */
function TimePickerWc({ onChange, ...props }: Props) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element || !onChange) return;
        const listener = (event: Event) => onChange((event as CustomEvent<{ value: string }>).detail.value);
        element.addEventListener('pttrn-change', listener);
        return () => element.removeEventListener('pttrn-change', listener);
    }, [onChange]);

    return <PttrnTimePicker {...attributes(props)} ref={ref} />;
}

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const FLAGS = ['disabled', 'readonly', 'invalid'];

/** The HTML a Web Component user writes for the current demo state; the demo's random id is left out. */
function timePickerToHtml(props: Props) {
    const attrs = Object.entries({ ...attributes(props), id: undefined })
        .filter(([name, value]) => value !== undefined && (value !== '' || FLAGS.includes(name)))
        .map(([name, value]) => (FLAGS.includes(name) ? name : `${name}="${escape(String(value))}"`));
    return `<pttrn-time-picker ${attrs.join(' ')}></pttrn-time-picker>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<form style="width: 320px">
    <label for="destination-time">Time</label>
    <pttrn-time-picker
        id="destination-time"
        name="time"
        aria-describedby="destination-time-help"
    ></pttrn-time-picker>
    <p id="destination-time-help">The time picker allows you to select a time.</p>
</form>`;

export const timePickerWc: WebComponentDemo = {
    tag: 'pttrn-time-picker',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. It is a form control: in a form it submits its "HH:mm" value under its `name`, and a label pointing at it focuses the hours.',
    Wrapper: TimePickerWc,
    toHtml: timePickerToHtml,
};
