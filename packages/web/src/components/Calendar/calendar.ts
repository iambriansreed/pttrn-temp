import chevronLeft from '@ptrn/icons/ChevronLeft.svg';
import chevronRight from '@ptrn/icons/ChevronRight.svg';
import doubleLeft from '@ptrn/icons/KeyboardDoubleArrowLeft.svg';
import doubleRight from '@ptrn/icons/KeyboardDoubleArrowRight.svg';
import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { define } from '../../utils/define';
import { emit } from '../../utils/emit';
import { uniqueId } from '../../utils/id';
import { hideTooltip, showTooltip, tooltip } from '../../utils/private-tooltip';
import styles from './calendar.scss';
import {
    addDays,
    addMonths,
    addYears,
    formatIdDate,
    formatIsoDate,
    formatLongDate,
    formatMonthYear,
    isSameDay,
    monthWeeks,
    parseIsoDate,
    startOfToday,
} from './dates';

export type CalendarChangeDetail = { value: string; date: Date };

const icon = (svg: string) => unsafeSVG(svg.replace('<svg ', '<svg aria-hidden="true" width="24" '));

const WEEKDAYS = [
    ['Sun', 'Sunday'],
    ['Mon', 'Monday'],
    ['Tue', 'Tuesday'],
    ['Wed', 'Wednesday'],
    ['Thu', 'Thursday'],
    ['Fri', 'Friday'],
    ['Sat', 'Saturday'],
];

type NavButton = { label: string; icon: ReturnType<typeof unsafeSVG>; move: (date: Date) => Date };

const NAVIGATION: Record<'previousYear' | 'previousMonth' | 'nextMonth' | 'nextYear', NavButton> = {
    previousYear: { label: 'Previous Year', icon: icon(doubleLeft), move: (date) => addYears(date, -1) },
    previousMonth: { label: 'Previous Month', icon: icon(chevronLeft), move: (date) => addMonths(date, -1) },
    nextMonth: { label: 'Next Month', icon: icon(chevronRight), move: (date) => addMonths(date, 1) },
    nextYear: { label: 'Next Year', icon: icon(doubleRight), move: (date) => addYears(date, 1) },
};

const sameDate = (a: Date | undefined, b: Date | undefined) => (a && b ? isSameDay(a, b) : a === b);

/**
 * Allows customers to select the date, month, and year: a month of days in a grid, with buttons that move the month and
 * the year.
 *
 * The grid is a table with role grid, named by the month title, with a column header per weekday and a cell per day
 * named by its full date ("10 June 2024"). The day matching `value` is selected (`aria-selected`). The active day,
 * where the keys move, is the only day in the Tab order: it starts at the value, or today without one, and moves to a
 * value set later without taking focus. The arrow keys move it by a day or a week, Home and End to the ends of the
 * week, PageUp and PageDown by a month, and Enter or Space choose it. The navigation buttons move the view and the
 * active day without choosing a date.
 *
 * Choosing a day sets `value` and fires `pttrn-change`.
 *
 * React to Web Component mapping:
 *
 * | React       | Web Component          | Note                                                             |
 * | ----------- | ---------------------- | ---------------------------------------------------------------- |
 * | `value`     | `value` attribute      | `yyyy-mm-dd`, as on a date input; `valueAsDate` takes a `Date`.  |
 * | `onChange`  | `pttrn-change` event   | `detail.value` and `detail.date`. The element also sets `value`. |
 * | `focusTrap` | `focus-trap` attribute | Focuses the active day on load; Tab cycles inside.               |
 * | `id`        | `id` attribute         | Day ids end in their date as `MM-dd-yyyy`.                       |
 *
 * @fires {CustomEvent<{ value: string; date: Date }>} pttrn-change - When the user chooses a day, with the day as
 *   `yyyy-mm-dd` and as a `Date`.
 * @element pttrn-calendar
 */
export class PttrnCalendar extends LitElement {
    static properties = {
        value: { type: String, reflect: true },
        focusTrap: { type: Boolean, attribute: 'focus-trap' },
        _active: { state: true },
    };

    static styles = styles;

    /** The selected date as `yyyy-mm-dd`. The calendar opens on its month and moves there when it changes. */
    declare value: string;
    /** Focuses the active day when the calendar loads and keeps Tab inside it, for use in a popup. */
    declare focusTrap: boolean;
    declare _active: Date;

    private _shown: Date | undefined;
    private _focusActive = false;
    private readonly _generatedId = uniqueId('pttrn-calendar');

    constructor() {
        super();
        this.value = '';
        this.focusTrap = false;
        this._active = startOfToday();
    }

    /** The selected date as a `Date`, or null without a valid one. */
    get valueAsDate(): Date | null {
        return parseIsoDate(this.value) ?? null;
    }

    set valueAsDate(date: Date | null) {
        this.value = date && !Number.isNaN(date.getTime()) ? formatIsoDate(date) : '';
    }

    private get _baseId() {
        return this.id || this._generatedId;
    }

    protected willUpdate(changed: PropertyValues<this>) {
        if (!this.hasUpdated) {
            const value = parseIsoDate(this.value);
            this._shown = value;
            this._active = value ?? startOfToday();
            this._focusActive = this.focusTrap;
            return;
        }
        // A value that changes moves the active day, and so the view, to it; one of the same day does not, so a parent
        // that sets the value again does not undo the user's navigation.
        if (changed.has('value')) {
            const value = parseIsoDate(this.value);
            if (!sameDate(value, this._shown)) {
                this._shown = value;
                if (value) this._active = value;
            }
        }
    }

    protected updated() {
        if (!this._focusActive) return;
        this._focusActive = false;
        this.renderRoot.querySelector<HTMLElement>('tbody td[tabindex="0"]')?.focus({ preventScroll: true });
    }

    private _moveActive(date: Date, focus: boolean) {
        this._active = date;
        this._focusActive = focus;
    }

    private _choose(date: Date) {
        this.value = formatIsoDate(date);
        emit<CalendarChangeDetail>(this, 'pttrn-change', { value: this.value, date });
    }

    private _onGridKeyDown = {
        handleEvent: (event: KeyboardEvent) => {
            if (this.focusTrap && event.code === 'Tab' && !event.shiftKey) {
                event.preventDefault();
                event.stopPropagation();
                this.renderRoot.querySelector<HTMLElement>('[data-header] button')?.focus();
                return;
            }
            if (event.shiftKey) return;
            const active = this._active;
            const week = monthWeeks(active).find((days) => days.some((day) => isSameDay(day, active)));
            let next: Date | undefined;
            switch (event.code) {
                case 'ArrowDown':
                    next = addDays(active, 7);
                    break;
                case 'ArrowUp':
                    next = addDays(active, -7);
                    break;
                case 'ArrowLeft':
                    next = addDays(active, -1);
                    break;
                case 'ArrowRight':
                    next = addDays(active, 1);
                    break;
                case 'Home':
                    next = week?.[0];
                    if (next && isSameDay(next, active)) next = undefined;
                    break;
                case 'End':
                    next = week?.[6];
                    if (next && isSameDay(next, active)) next = undefined;
                    break;
                case 'PageDown':
                    next = addMonths(active, 1);
                    break;
                case 'PageUp':
                    next = addMonths(active, -1);
                    break;
                case 'Enter':
                case 'Space': {
                    const target = event.target as HTMLElement;
                    if (target.nodeName === 'TD') target.click();
                    break;
                }
                default:
                    return;
            }
            // As in React, a handled key stops here, even Home on a Sunday.
            event.preventDefault();
            event.stopPropagation();
            if (next) this._moveActive(next, true);
        },
        capture: true,
    };

    private _tip(id: string) {
        // By id lookup rather than a selector: the id starts with the element's own id, which may not be a valid one.
        return (this.renderRoot as ShadowRoot).getElementById(id);
    }

    private _navButton(key: keyof typeof NAVIGATION) {
        const { label, icon: svg, move } = NAVIGATION[key];
        const tipId = `${this._baseId}-${key}-tooltip`;
        const show = (event: Event) => showTooltip(event.currentTarget as Element, this._tip(tipId));
        const hide = () => hideTooltip(this._tip(tipId));
        const onKeyDown = (event: KeyboardEvent) => {
            // In a trap, Shift+Tab from the first button returns to the active day.
            if (key === 'previousYear' && this.focusTrap && event.code === 'Tab' && event.shiftKey) {
                event.preventDefault();
                event.stopPropagation();
                this._focusActive = true;
                this.requestUpdate();
            }
        };
        return html`<button
                aria-label=${label}
                data-size="large"
                data-variant="tertiary"
                type="button"
                @blur=${hide}
                @click=${() => this._moveActive(move(this._active), false)}
                @focus=${show}
                @keydown=${onKeyDown}
                @mouseenter=${show}
                @mouseleave=${hide}
            >
                <span aria-hidden="true" data-button-icon>${svg}</span
                ><span aria-hidden="true" data-touch-target></span>
            </button>
            ${tooltip(tipId, label)}`;
    }

    private _day(date: Date, value: Date | undefined) {
        const active = isSameDay(date, this._active);
        const selected = !!value && isSameDay(date, value);
        return html`<td
            aria-label=${formatLongDate(date)}
            aria-selected=${selected ? 'true' : nothing}
            ?data-selected=${selected}
            id=${`${this._baseId}-option-${formatIdDate(date)}`}
            role=${active ? 'gridcell' : nothing}
            tabindex=${active ? 0 : -1}
            @click=${() => this._choose(date)}
        >
            ${date.getDate()}
        </td>`;
    }

    render() {
        const value = parseIsoDate(this.value);
        const baseId = this._baseId;
        const titleId = `${baseId}-title`;

        return html`
            <div data-pttrn="calendar" id=${baseId}>
                <div data-header>
                    ${this._navButton('previousYear')} ${this._navButton('previousMonth')}
                    <span data-title id=${titleId}>${formatMonthYear(this._active)}</span>
                    ${this._navButton('nextMonth')} ${this._navButton('nextYear')}
                </div>
                <table aria-labelledby=${titleId} role="grid">
                    <thead>
                        <tr>
                            ${WEEKDAYS.map(([short, long]) => html`<th abbr=${long} scope="col">${short}</th>`)}
                        </tr>
                    </thead>
                    <tbody id=${`${baseId}-grid`} @keydown=${this._onGridKeyDown}>
                        ${monthWeeks(this._active).map(
                            (week) =>
                                html`<tr>
                                    ${week.map((date) => this._day(date, value))}
                                </tr>`,
                        )}
                    </tbody>
                </table>
            </div>
        `;
    }
}

define('pttrn-calendar', PttrnCalendar);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-calendar': PttrnCalendar;
    }
}
