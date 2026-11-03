import eventIcon from '@ptrn/icons/Event.svg';
import { html, nothing, type PropertyValues } from 'lit';
import { define } from '../../utils/define';
import { autoUpdate, place } from '../../utils/floating';
import { icon } from '../../utils/icon';
import { uniqueId } from '../../utils/id';
import { InputBase } from '../../utils/input-base';
import { TooltipController, tooltipTemplate } from '../../utils/tooltip-controller';
import type { CalendarChangeDetail } from '../Calendar/calendar';
import '../Calendar/calendar';
import { formatIsoDate, formatUsDate } from '../Calendar/dates';
import styles from './date-picker.scss';

/** The gap between the field and the calendar, as React's `useFloating` offset. */
const POPUP_OFFSET = 4;
const DEFAULT_LABEL = 'Enter or choose date';
const DEFAULT_PLACEHOLDER = 'mm/dd/yyyy';

/**
 * The date in text typed as about mm/dd/yyyy, as the React DatePicker reads it (`parseDate` in Calendar/utils.ts): a
 * one or two digit month and day and a two to four digit year, two digits meaning 20xx. Undefined for anything else,
 * including a day the month does not have.
 */
export function parseUsDate(text: string | null | undefined) {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(text ?? '');
    if (!match) return undefined;
    const [month, day] = [Number(match[1]), Number(match[2])];
    let year = Number(match[3]);
    if (year < 100) year += 2000;
    const date = new Date(2000, month - 1, day);
    date.setFullYear(year);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return undefined;
    return date;
}

/**
 * An input that allows a customer to type in a date as mm/dd/yyyy, or to choose one from a calendar that opens under
 * the field.
 *
 * It is a form control built on the same Input box as `pttrn-input`: it submits the text under its `name`, mirrors the
 * native input's validity (so `required` works), goes back to its `value` attribute on reset and follows a disabled
 * `<fieldset>`. The text field is named by `aria-label` ("Enter or choose date" without one or a `label`), and `label`,
 * `helper-text` and `error-message` render the Field parts. The toggle ("Toggle calendar") opens a modal "Choose Date"
 * dialog holding a `pttrn-calendar` on the month of the value, which takes focus; choosing a day closes it unless
 * `keep-open` is set. A click outside or Escape closes it too. Disabled or read-only, there is no toggle.
 *
 * React to Web Component mapping:
 *
 * | React                   | Web Component                           | Note                                                |
 * | ----------------------- | --------------------------------------- | --------------------------------------------------- |
 * | `value`                 | `value` attribute and property          | mm/dd/yyyy text; the attribute is the reset value.  |
 * | `onChange`              | `pttrn-change` event                    | `detail.value`, on typing and on choosing a day.    |
 * | `closeCalendarOnChange` | `keep-open` attribute                   | Inverted: a boolean attribute cannot default to on. |
 * | `placeholder`           | `placeholder` attribute                 | `mm/dd/yyyy` by default.                            |
 * | `aria-label`            | `aria-label` attribute                  | Names the text field.                               |
 * | `name`, `id`            | `name`, `id` attributes                 | A `<label for>` pointing at the element focuses it. |
 * | `disabled`, `readOnly`  | `disabled`, `readonly`                  |                                                     |
 * | `invalid`, `required`   | `invalid`, `required`                   |                                                     |
 * | `size`                  | `size` attribute                        |                                                     |
 * | Field around it         | `label`, `helper-text`, `error-message` | As on `pttrn-input`.                                |
 *
 * @fires {CustomEvent<{ value: string }>} pttrn-change - When the user types or chooses a day, with the text.
 * @fires {Event} change - With `pttrn-change`, so code that listens for the native event works too.
 * @element pttrn-date-picker
 */
export class PttrnDatePicker extends InputBase {
    static properties = {
        keepOpen: { type: Boolean, attribute: 'keep-open' },
        _open: { state: true },
    };

    static styles = styles;

    /** Keeps the calendar open after a day is chosen. By default choosing a day closes it. */
    declare keepOpen: boolean;
    declare _open: boolean;

    private readonly _generatedId = uniqueId('pttrn-date-picker');
    private _stopPlacing: (() => void) | null = null;
    private readonly _tooltip = new TooltipController(this, {
        popover: () => this.renderRoot.querySelector<HTMLElement>('[data-pttrn="tooltip"]'),
    });
    private readonly _onDocumentPointerDown = (event: Event) => {
        const path = event.composedPath();
        if (!path.includes(this._popup as EventTarget) && !path.includes(this._box as EventTarget))
            this._setOpen(false);
    };

    constructor() {
        super();
        this.placeholder = DEFAULT_PLACEHOLDER;
        this.keepOpen = false;
        this._open = false;
    }

    private get _popup() {
        return this.renderRoot.querySelector<HTMLElement>('[data-pttrn="calendar-popup"]');
    }

    /** The Input box, which the calendar opens under. */
    private get _box() {
        return this.renderRoot.querySelector<HTMLElement>('[data-pttrn="input"]');
    }

    private get _toggle() {
        return this.renderRoot.querySelector<HTMLElement>('[data-calendar-toggle]');
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._listen(false);
    }

    protected willUpdate(changed: PropertyValues) {
        super.willUpdate(changed);
        if (!this.placeholder) this.placeholder = DEFAULT_PLACEHOLDER;
        if (this._open && (this._isDisabled || this.readOnly)) this._open = false;
    }

    protected updated(changed: PropertyValues) {
        super.updated(changed);
        this._tooltip.attach(this._toggle);
        if (changed.has('_open')) {
            if (this._open) {
                this._popup?.showPopover();
                this._listen(true);
            } else {
                this._listen(false);
            }
        }
    }

    /**
     * While open: the calendar sits under the field, flipping above when there is no room, and a press outside closes
     * it.
     */
    private _listen(on: boolean) {
        this._stopPlacing?.();
        this._stopPlacing = null;
        document.removeEventListener('mousedown', this._onDocumentPointerDown, true);
        const popup = this._popup;
        const box = this._box;
        if (!on || !popup || !box) return;
        const position = () => place(box, popup, { placement: 'bottom-start', offset: POPUP_OFFSET });
        position();
        this._stopPlacing = autoUpdate(box, popup, position);
        document.addEventListener('mousedown', this._onDocumentPointerDown, true);
    }

    private _setOpen(open: boolean, returnFocus = false) {
        if (open && (this._isDisabled || this.readOnly)) return;
        this._open = open;
        if (!open && returnFocus) this.updateComplete.then(() => this._toggle?.focus());
    }

    private _onCalendarChange(event: CustomEvent<CalendarChangeDetail>) {
        // The calendar's own event stays inside: this element reports the text.
        event.stopPropagation();
        this.value = formatUsDate(event.detail.date);
        this._emitChange(this.value);
        if (!this.keepOpen) this._setOpen(false, true);
    }

    private _popupTemplate() {
        const selected = parseUsDate(this.value);
        return html`<div
            aria-label="Choose Date"
            aria-modal="true"
            data-pttrn="calendar-popup"
            popover="manual"
            role="dialog"
            @keydown=${(event: KeyboardEvent) => {
                if (event.code !== 'Escape') return;
                event.stopPropagation();
                this._setOpen(false, true);
            }}
            @pttrn-change=${this._onCalendarChange}
        >
            <pttrn-calendar
                focus-trap
                id=${`${this.id || this._generatedId}-calendar`}
                value=${selected ? formatIsoDate(selected) : ''}
            ></pttrn-calendar>
        </div>`;
    }

    render() {
        const locked = this._isDisabled || this.readOnly;
        // A medium tertiary icon Button whatever the field size, as in React, with its label as a tooltip.
        const toggle = html`<button
            aria-label="Toggle calendar"
            data-button
            data-calendar-toggle
            data-size="medium"
            data-variant="tertiary"
            type="button"
            @click=${() => this._setOpen(!this._open)}
        >
            <span aria-hidden="true" data-button-icon>${icon(eventIcon)}</span>
            <span aria-hidden="true" data-touch-target></span>
        </button>`;

        return html`<div data-pttrn="date-picker">
            ${this._renderField(
                this._renderInputBox({
                    type: 'text',
                    autocomplete: 'off',
                    // Named by aria-label, then label, then the React default.
                    fallbackLabel: DEFAULT_LABEL,
                    trailing: locked ? undefined : toggle,
                }),
            )}
            ${this._open ? this._popupTemplate() : nothing}
            <span aria-hidden="true">${tooltipTemplate('Toggle calendar')}</span>
        </div>`;
    }
}

define('pttrn-date-picker', PttrnDatePicker);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-date-picker': PttrnDatePicker;
    }
}
