import '@ptrn/web/Calendar';
import { CalendarProps } from '@ptrn/react/Calendar';
import { ComponentType, useEffect, useRef } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnCalendar = 'pttrn-calendar' as unknown as ComponentType<any>;

type Props = Partial<CalendarProps>;

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

/** The demo's Date as the element's `yyyy-mm-dd` value. */
const isoDate = (value: unknown) =>
    value instanceof Date && !Number.isNaN(value.getTime())
        ? `${pad(value.getFullYear(), 4)}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
        : undefined;

/** The demo state as the element. A chosen day goes back to the demo state through `onChange`, as in React. */
function CalendarWc({ id, value, focusTrap, onChange }: Props) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element || !onChange) return;
        const listener = (event: Event) => onChange((event as CustomEvent<{ date: Date }>).detail.date);
        element.addEventListener('pttrn-change', listener);
        return () => element.removeEventListener('pttrn-change', listener);
    }, [onChange]);

    return <PttrnCalendar focus-trap={focusTrap ? '' : undefined} id={id} ref={ref} value={isoDate(value)} />;
}

/** The HTML a Web Component user writes for the current demo state. */
function calendarToHtml({ value, focusTrap }: Props) {
    const attrs = [isoDate(value) && `value="${isoDate(value)}"`, focusTrap && 'focus-trap'].filter(Boolean);
    return `<pttrn-calendar${attrs.length ? ` ${attrs.join(' ')}` : ''}></pttrn-calendar>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-calendar value="2024-06-10"></pttrn-calendar>

<script>
    document.querySelector('pttrn-calendar').addEventListener('pttrn-change', (event) => {
        console.log('Chose', event.detail.value);
    });
</script>`;

export const calendarWc: WebComponentDemo = {
    tag: 'pttrn-calendar',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. The value is a `yyyy-mm-dd` date, as on a native date input.',
    Wrapper: CalendarWc,
    toHtml: calendarToHtml,
};
