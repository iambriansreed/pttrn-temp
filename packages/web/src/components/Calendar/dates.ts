/**
 * The few date operations the calendar and the date picker need, with the semantics of the date-fns functions the React
 * components use (local time, weeks from Sunday, English names), so `@ptrn/web` needs no date library.
 */

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

export const isValidDate = (date: unknown): date is Date => date instanceof Date && !Number.isNaN(date.getTime());

export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const startOfToday = () => startOfDay(new Date());

export const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const addDays = (date: Date, days: number) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** A month later or earlier, kept on the last day of the month when the day does not exist there (31 Jan + 1 month). */
export function addMonths(date: Date, months: number) {
    const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

export const addYears = (date: Date, years: number) => addMonths(date, years * 12);

export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

export const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

export const startOfWeek = (date: Date) => addDays(date, -date.getDay());

export const endOfWeek = (date: Date) => addDays(date, 6 - date.getDay());

/** The weeks, Sunday to Saturday, that cover the month of `date`. */
export function monthWeeks(date: Date) {
    const weeks: Date[][] = [];
    const end = endOfWeek(endOfMonth(date));
    for (let day = startOfWeek(startOfMonth(date)); day <= end; day = addDays(day, 1)) {
        if (!weeks.length || weeks[weeks.length - 1].length === 7) weeks.push([]);
        weeks[weeks.length - 1].push(day);
    }
    return weeks;
}

/** "June 2024", date-fns `MMMM yyyy`. */
export const formatMonthYear = (date: Date) => `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

/** "10 June 2024", date-fns `d MMMM yyyy`. */
export const formatLongDate = (date: Date) => `${date.getDate()} ${formatMonthYear(date)}`;

/** "06-10-2024", date-fns `MM-dd-yyyy`. */
export const formatIdDate = (date: Date) => `${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${date.getFullYear()}`;

/** "06/10/2024", date-fns `MM/dd/yyyy`. */
export const formatUsDate = (date: Date) =>
    `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${pad(date.getFullYear(), 4)}`;

/** "2024-06-10", the value format of a native date input. */
export const formatIsoDate = (date: Date) =>
    `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** A local date from "yyyy-mm-dd", or undefined when the text is not one or names a day that does not exist. */
export function parseIsoDate(value: string | null | undefined) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value?.trim() ?? '');
    if (!match) return undefined;
    const [year, month, day] = match.slice(1).map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return undefined;
    return date;
}
