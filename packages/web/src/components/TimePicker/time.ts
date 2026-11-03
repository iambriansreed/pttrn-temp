/** The time arithmetic of the React TimePicker (`packages/react/src/components/TimePicker/utils.ts` and `Segment.tsx`). */

export type Meridiem = 'AM' | 'PM';
export type Segment = 'hours' | 'meridiem' | 'minutes';

export const HOUR_OPTIONS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
export const MINUTE_OPTIONS = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
export const MERIDIEM_OPTIONS: Meridiem[] = ['AM', 'PM'];

export const BOUNDS = { hours: { min: 1, max: 12 }, minutes: { min: 0, max: 59 } } as const;
export const NUMBER_PLACEHOLDER = '--';

/** A number kept within `min` and `max`; past an end it wraps to the other end with `rollover`, or stops there. */
export function bound(
    value: number | string | undefined,
    { min, max }: { min: number; max: number },
    rollover = false,
) {
    const parsed = typeof value === 'number' ? value : parseInt(String(value), 10);
    if (Number.isNaN(parsed)) return min;
    if (parsed > max) return rollover ? min : max;
    if (parsed < min) return rollover ? max : min;
    return parsed;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** A 24-hour "HH:mm" value as the 12-hour parts the segments show; not a time, the numbers are undefined. */
export function valueToParts(value: string) {
    const match = /^(\d{1,2}):(\d{1,2})$/.exec(value);
    const hours24 = match ? Number(match[1]) : NaN;
    const minutes = match ? Number(match[2]) : NaN;
    if (!match || hours24 > 23 || minutes > 59) {
        return { hours: undefined, minutes: undefined, meridiem: 'AM' as Meridiem };
    }
    return {
        hours: pad(hours24 % 12 || 12),
        minutes: pad(minutes),
        meridiem: (hours24 < 12 ? 'AM' : 'PM') as Meridiem,
    };
}

/** The 12-hour parts as a 24-hour "HH:mm" value, or '' while the hours or the minutes are missing. */
export function partsToValue(hours: string | undefined, minutes: string | undefined, meridiem: Meridiem) {
    if (hours === undefined || minutes === undefined) return '';
    let hours24 = Number(hours);
    if (meridiem === 'PM' && hours24 < 12) hours24 += 12;
    else if (meridiem === 'AM' && hours24 === 12) hours24 = 0;
    return `${pad(hours24)}:${pad(Number(minutes))}`;
}

/** What a segment shows for its part. */
export function segmentText(kind: Segment, part: string | undefined) {
    if (kind === 'meridiem') return part || 'AM';
    if (part === undefined) return NUMBER_PLACEHOLDER;
    return pad(bound(part, BOUNDS[kind], true));
}
