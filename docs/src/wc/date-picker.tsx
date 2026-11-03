import '@ptrn/web/DatePicker';
import { DatePickerProps } from '@ptrn/react/DatePicker';
import { ComponentType, useEffect, useRef } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnDatePicker = 'pttrn-date-picker' as unknown as ComponentType<any>;

type Props = Partial<DatePickerProps>;

const FLAGS = ['disabled', 'readonly', 'invalid', 'required', 'keep-open'];
const flag = (on?: boolean) => (on ? '' : undefined);

/** The demo state as the element's attributes. */
const attributes = ({
    id,
    name,
    value,
    placeholder,
    size,
    disabled,
    readOnly,
    invalid,
    required,
    closeCalendarOnChange,
    ...props
}: Props) => ({
    'aria-label': props['aria-label'],
    id,
    name,
    value,
    placeholder,
    size,
    disabled: flag(disabled),
    readonly: flag(readOnly),
    invalid: flag(invalid),
    required: flag(required),
    'keep-open': flag(closeCalendarOnChange === false),
});

/** The demo state as the element. A typed or chosen date goes back to the demo state through `onChange`, as in React. */
function DatePickerWc({ onChange, ...props }: Props) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element || !onChange) return;
        const listener = (event: Event) => onChange((event as CustomEvent<{ value: string }>).detail.value);
        element.addEventListener('pttrn-change', listener);
        return () => element.removeEventListener('pttrn-change', listener);
    }, [onChange]);

    return <PttrnDatePicker {...attributes(props)} ref={ref} />;
}

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** The HTML a Web Component user writes for the current demo state; the demo's random id is left out. */
function datePickerToHtml(props: Props) {
    const attrs = Object.entries({ ...attributes(props), id: undefined })
        .filter(([name, value]) => value !== undefined && (value !== '' || FLAGS.includes(name)))
        .map(([name, value]) => (FLAGS.includes(name) ? name : `${name}="${escape(String(value))}"`));
    return `<pttrn-date-picker ${attrs.join(' ')}></pttrn-date-picker>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<form style="width: 320px">
    <pttrn-date-picker
        name="date1"
        required
        label="Date"
        helper-text="The date picker allows you to select a date."
    ></pttrn-date-picker>
</form>`;

export const datePickerWc: WebComponentDemo = {
    tag: 'pttrn-date-picker',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. It is a form control: in a form it submits the mm/dd/yyyy text under its `name`.',
    Wrapper: DatePickerWc,
    toHtml: datePickerToHtml,
};
