import schedule from '@ptrn/icons/Schedule.svg';
import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { define } from '../../utils/define';
import { emit } from '../../utils/emit';
import { uniqueId } from '../../utils/id';
import { autoUpdate, place } from '../../utils/floating';
import { TooltipController, tooltipTemplate } from '../../utils/tooltip-controller';
import {
    BOUNDS,
    HOUR_OPTIONS,
    MERIDIEM_OPTIONS,
    MINUTE_OPTIONS,
    bound,
    partsToValue,
    segmentText,
    valueToParts,
    type Meridiem,
    type Segment,
} from './time';
import styles from './time-picker.scss';

export type TimePickerChangeDetail = { value: string };
export type TimePickerSize = 'large' | 'medium' | 'small';

const SCHEDULE = unsafeSVG(schedule.replace('<svg ', '<svg aria-hidden="true" width="24" '));
const SEGMENTS: Segment[] = ['hours', 'minutes', 'meridiem'];
const OPTIONS: Record<Segment, string[]> = { hours: HOUR_OPTIONS, minutes: MINUTE_OPTIONS, meridiem: MERIDIEM_OPTIONS };
/** The gap between the field and the popup, as React's `useFloating` offset. */
const POPUP_OFFSET = 4;

/** The key as the React handlers name it: the code, with "Shift+" in front while Shift is held. */
const keyCode = (event: KeyboardEvent) =>
    event.shiftKey && !event.code.startsWith('Shift') ? `Shift+${event.code}` : event.code;

/** Selects a segment's text a tick later, so the next digit replaces it. */
const selectAll = (element: Element | null | undefined) => {
    if (!element) return;
    setTimeout(() => window.getSelection()?.selectAllChildren(element), 10);
};

type Internals = ElementInternals & { ariaDescribedByElements?: Element[] | null };

/**
 * An input field that allows a customer to type in a time, as hours, minutes and AM or PM, or to choose one from lists
 * in a popup. Its value is a 24-hour "HH:mm" string.
 *
 * It is a form control: in a form it submits its value under its `name`, a `<label for>` pointing at it focuses the
 * hours, a form reset restores the `value` attribute and a disabled fieldset disables it. The element itself is the
 * group: name it with `aria-label` ("Time picker" by default) and describe it with `aria-describedby`; with no
 * `aria-describedby`, an `aria-errormessage` id describes it instead. The segments are spinbuttons ("hours", "minutes",
 * "meridiem") that take digits, A and P, the arrow keys and Backspace. The toggle is a combobox that opens a modal
 * "Select time" dialog with three listboxes; choosing a meridiem, Escape or a click outside closes it and returns focus
 * to the toggle. `invalid` marks every segment `aria-invalid`.
 *
 * React to Web Component mapping:
 *
 * | React               | Web Component                  | Note                                                     |
 * | ------------------- | ------------------------------ | -------------------------------------------------------- |
 * | `value`             | `value` attribute and property | "HH:mm"; the attribute is the default a reset restores.  |
 * | `onChange`          | `pttrn-change` event           | `detail.value`. The element also sets `value`.           |
 * | `name`              | `name` attribute               | Submitted with the form through ElementInternals.        |
 * | `id`                | `id` attribute                 | A `<label for>` focuses the hours.                       |
 * | `disabled`          | `disabled` attribute           |                                                          |
 * | `readOnly`          | `readonly` attribute           |                                                          |
 * | `invalid`           | `invalid` attribute            |                                                          |
 * | `size`              | `size` attribute               | `small`, `medium` or `large`.                            |
 * | `aria-label`        | `aria-label` attribute         | On the element, which is the group.                      |
 * | `aria-describedby`  | `aria-describedby` attribute   | On the element.                                          |
 * | `aria-errormessage` | `aria-errormessage` attribute  | Describes the group when there is no `aria-describedby`. |
 *
 * @fires {CustomEvent<{ value: string }>} pttrn-change - When the user changes the time, with the new "HH:mm" value (''
 *   while the hours or minutes are cleared).
 * @element pttrn-time-picker
 */
export class PttrnTimePicker extends LitElement {
    static formAssociated = true;

    static shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, delegatesFocus: true };

    static properties = {
        value: { type: String },
        name: { type: String, reflect: true },
        disabled: { type: Boolean, reflect: true },
        readOnly: { type: Boolean, attribute: 'readonly', reflect: true },
        invalid: { type: Boolean, reflect: true },
        size: { type: String, reflect: true },
        _open: { state: true },
        _formDisabled: { state: true },
        _activeOptions: { state: true },
    };

    static styles = styles;

    static get observedAttributes() {
        return [...super.observedAttributes, 'aria-errormessage'];
    }

    /** The time as a 24-hour "HH:mm" string. Empty shows 12:00 AM; anything else that is not a time shows "--". */
    declare value: string;
    /** The name the value is submitted under in a form. */
    declare name: string;
    /** Prevents editing and opening, and takes the field out of the tab order. */
    declare disabled: boolean;
    /** Shows the value without letting it change. */
    declare readOnly: boolean;
    /** Marks the field and each segment invalid. */
    declare invalid: boolean;
    /** The field height and text size. */
    declare size: TimePickerSize | undefined;
    declare _open: boolean;
    declare _formDisabled: boolean;
    declare _activeOptions: Record<Segment, string>;

    private readonly _internals: Internals;
    private readonly _generatedId = uniqueId('pttrn-time-picker');
    private readonly _onDocumentPointerDown = (event: Event) => {
        const path = event.composedPath();
        if (!path.includes(this._popup as EventTarget) && !path.includes(this._toggle as EventTarget)) {
            this._setOpen(false);
        }
    };
    private _stopPlacing: (() => void) | null = null;
    private readonly _tooltip = new TooltipController(this, {
        popover: () => this.renderRoot.querySelector<HTMLElement>('[data-pttrn="tooltip"]'),
    });

    constructor() {
        super();
        this._internals = this.attachInternals() as Internals;
        this._internals.role = 'group';
        this._internals.ariaLabel = 'Time picker';
        this.value = '';
        this.name = '';
        this.disabled = false;
        this.readOnly = false;
        this.invalid = false;
        this.size = undefined;
        this._open = false;
        this._formDisabled = false;
        this._activeOptions = { hours: '01', minutes: '00', meridiem: 'AM' };
    }

    /** The form this element belongs to, as on a native control. */
    get form() {
        return this._internals.form;
    }

    private get _locked() {
        return this.disabled || this._formDisabled || this.readOnly;
    }

    /** The picker's id, or a generated one: the segment, popup and option ids start with it, as in React. */
    private get _id() {
        return this.id || this._generatedId;
    }

    private get _menuId() {
        return `${this._id}-time-picker-menu`;
    }

    /** By id rather than a selector: the ids start with the element's own id, which may not be a valid selector. */
    private _byId(id: string) {
        return (this.renderRoot as ShadowRoot).getElementById(id);
    }

    private get _popup() {
        return this.renderRoot.querySelector<HTMLElement>('[role="dialog"]');
    }

    private get _toggle() {
        return this.renderRoot.querySelector<HTMLElement>('[role="combobox"]');
    }

    attributeChangedCallback(name: string, old: string | null, value: string | null) {
        super.attributeChangedCallback(name, old, value);
        if (name === 'aria-errormessage') this._describe();
    }

    connectedCallback() {
        super.connectedCallback();
        // The role is on the element as well as in its internals, so tools that read attributes (axe, test locators)
        // see the group that the aria-label and aria-describedby on it belong to.
        if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
        this._describe();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._listen(false);
    }

    protected firstUpdated() {
        // The toggle shows its label as a tooltip while hovered or focused, as the React icon-only Button does.
        this._tooltip.attach(this._toggle);
    }

    /** An `aria-errormessage` id describes the group, as React puts it in place of aria-describedby. */
    private _describe() {
        const id = this.getAttribute('aria-errormessage');
        const root = this.getRootNode() as Document | ShadowRoot;
        const message = id && 'getElementById' in root ? root.getElementById(id) : null;
        this._internals.ariaDescribedByElements = message ? [message] : null;
    }

    formResetCallback() {
        this.value = this.getAttribute('value') ?? '';
    }

    formDisabledCallback(disabled: boolean) {
        this._formDisabled = disabled;
        if (disabled) this._setOpen(false);
    }

    formStateRestoreCallback(state: string | null) {
        this.value = state ?? '';
    }

    protected willUpdate(changed: PropertyValues<this>) {
        if (changed.has('value')) this._internals.setFormValue(this.value || null, this.value);
    }

    protected updated(changed: PropertyValues<this>) {
        // The segments are contenteditable, so their text is set here rather than rendered, as in React.
        const parts = valueToParts(this.value || '00:00');
        for (const kind of SEGMENTS) {
            const segment = this._segmentElement(kind);
            const text = segmentText(kind, parts[kind]);
            if (segment && segment.textContent !== text) segment.textContent = text;
        }
        this._describe();

        if (changed.has('_open') && this._open) {
            const popup = this._popup;
            popup?.showPopover();
            this._listen(true);
            for (const kind of SEGMENTS) {
                this._byId(this._optionId(kind, this._activeOptions[kind]))?.scrollIntoView({ block: 'nearest' });
            }
            this._listbox('hours')?.focus();
        }
    }

    /**
     * While open: the popup sits under the field from its left edge, flipping above when there is no room, as React's
     * floating-ui places it, and a press outside it closes it.
     */
    private _listen(on: boolean) {
        this._stopPlacing?.();
        this._stopPlacing = null;
        document.removeEventListener('mousedown', this._onDocumentPointerDown, true);
        const popup = this._popup;
        if (!on || !popup) return;
        const position = () => place(this, popup, { placement: 'bottom-start', offset: POPUP_OFFSET });
        position();
        this._stopPlacing = autoUpdate(this, popup, position);
        document.addEventListener('mousedown', this._onDocumentPointerDown, true);
    }

    private _segmentElement(kind: Segment) {
        return this.renderRoot.querySelector<HTMLElement>(`[data-input][data-type="${kind}"]`);
    }

    private _listbox(kind: Segment) {
        return this.renderRoot.querySelector<HTMLElement>(`[role="listbox"][data-type="${kind}"]`);
    }

    private _optionId(kind: Segment, value: string) {
        return `${this._id}-${kind}-${value}`;
    }

    private _setOpen(open: boolean) {
        const wasOpen = this._open;
        if (open && !wasOpen) {
            // Each listbox starts on the chosen option, or the first.
            const parts = valueToParts(this.value || '00:00');
            this._activeOptions = {
                hours: parts.hours && HOUR_OPTIONS.includes(parts.hours) ? parts.hours : HOUR_OPTIONS[0],
                minutes: parts.minutes && MINUTE_OPTIONS.includes(parts.minutes) ? parts.minutes : MINUTE_OPTIONS[0],
                meridiem: parts.meridiem,
            };
        }
        this._open = open;
        if (!open && wasOpen) {
            this._listen(false);
            this._toggle?.focus();
        }
    }

    private _toggleOpen() {
        if (this._locked) return;
        this._setOpen(!this._open);
    }

    /** Sets one part of the time, from the current value, and reports the new value. */
    private _change(kind: Segment, part: string | null) {
        const parts = valueToParts(this.value || '00:00');
        const next = { ...parts, [kind]: part || undefined };
        const value = partsToValue(next.hours, next.minutes, (next.meridiem || 'AM') as Meridiem);
        this.value = value;
        emit<TimePickerChangeDetail>(this, 'pttrn-change', { value });
    }

    private _neighbor(element: HTMLElement, step: 1 | -1) {
        const inputs = [...this.renderRoot.querySelectorAll<HTMLElement>('[data-input]')];
        return inputs[inputs.indexOf(element) + step] ?? null;
    }

    private _onSegmentKeyDown(event: KeyboardEvent, kind: Segment) {
        const element = event.currentTarget as HTMLElement;
        switch (keyCode(event)) {
            case 'ArrowRight':
                this._neighbor(element, 1)?.focus();
                event.preventDefault();
                return;
            case 'ArrowLeft':
                this._neighbor(element, -1)?.focus();
                event.preventDefault();
                return;
            case 'ArrowUp':
                this._increment(element, kind, 1);
                event.preventDefault();
                return;
            case 'ArrowDown':
                this._increment(element, kind, -1);
                event.preventDefault();
                return;
            case 'Enter':
                // contenteditable would insert a line break.
                element.blur();
                event.preventDefault();
                return;
            case 'Escape':
                element.blur();
                return;
            case 'Backspace':
                this._change(kind, null);
                event.preventDefault();
                return;
            case 'Tab':
            case 'Shift+Tab':
                return;
        }

        // Every other key is handled here, not by the editable text.
        event.preventDefault();

        if (kind === 'meridiem') {
            const key = event.key.toUpperCase();
            if (key === 'A' || key === 'P') {
                this._change('meridiem', `${key}M`);
                this._neighbor(element, 1)?.focus();
                selectAll(element);
            }
            return;
        }

        if (!/^\d$/.test(event.key)) return;

        let number = Number(event.key);
        const current = element.textContent;
        // A 1 may begin 10, 11 or 12, and a minute below 6 may take a second digit.
        const addToExisting =
            (kind === 'hours' && current === '01' && number < 3) || (kind === 'minutes' && Number(current) < 6);
        if (addToExisting) number = Number(`${current}${number}`);
        else if (number === 0) return;

        number = bound(number, BOUNDS[kind]);
        const text = String(number).padStart(2, '0');
        this._change(kind, text);
        element.textContent = text;

        // The digits can only mean this number, so the segment is complete.
        if ((kind === 'hours' && number > 2) || (kind === 'minutes' && number > 5)) {
            const next = this._neighbor(element, 1);
            next?.focus();
            selectAll(next);
        } else {
            selectAll(element);
        }
    }

    private _increment(element: HTMLElement, kind: Segment, step: number) {
        const current = element.textContent;
        if (kind === 'meridiem') {
            this._change('meridiem', current === 'AM' ? 'PM' : 'AM');
            return;
        }
        const text = String(bound(Number(current) + step, BOUNDS[kind], true)).padStart(2, '0');
        this._change(kind, text);
        element.textContent = text;
    }

    private _select(kind: Segment, value: string) {
        this._change(kind, value);
        if (kind === 'meridiem') {
            this._setOpen(false);
            setTimeout(() => this._toggle?.focus(), 10);
            return;
        }
        const next = kind === 'hours' ? 'minutes' : 'meridiem';
        setTimeout(() => this._listbox(next)?.focus(), 10);
    }

    private _onListboxKeyDown(event: KeyboardEvent, kind: Segment) {
        const options = OPTIONS[kind];
        const code = keyCode(event);
        const step = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 }[code];
        if (step) {
            event.preventDefault();
            const index = options.indexOf(this._activeOptions[kind]);
            const next = options[(index + step + options.length) % options.length];
            this._activeOptions = { ...this._activeOptions, [kind]: next };
            this._byId(this._optionId(kind, next))?.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
                inline: 'nearest',
            });
            return;
        }
        if (code === 'Enter' || code === 'Space') {
            event.preventDefault();
            this._select(kind, this._activeOptions[kind]);
        }
    }

    /** Tab and Shift+Tab stay among the three listboxes while the popup is open; Escape closes it. */
    private _onPopupKeyDown(event: KeyboardEvent) {
        if (event.code === 'Escape') {
            this._setOpen(false);
            return;
        }
        if (event.code !== 'Tab') return;
        event.preventDefault();
        const lists = SEGMENTS.map((kind) => this._listbox(kind));
        const index = lists.findIndex((list) => list === this.shadowRoot?.activeElement);
        const next = (index + (event.shiftKey ? -1 : 1) + lists.length) % lists.length;
        lists[index === -1 ? 0 : next]?.focus();
    }

    private _segment(kind: Segment, part: string | undefined) {
        const disabled = this.disabled || this._formDisabled;
        const editable = !disabled && !this.readOnly;
        return html`<span
            aria-disabled=${disabled ? 'true' : 'false'}
            aria-invalid=${this.invalid ? 'true' : nothing}
            aria-label=${kind}
            aria-readonly=${this.readOnly ? 'true' : nothing}
            aria-valuemax=${kind === 'hours' ? 12 : kind === 'minutes' ? 59 : nothing}
            aria-valuemin=${kind === 'hours' ? 1 : kind === 'minutes' ? 0 : nothing}
            aria-valuetext=${part ? segmentText(kind, part) : 'Empty'}
            contenteditable=${editable ? 'true' : 'false'}
            data-input
            data-type=${kind}
            data-value=${part || nothing}
            id=${`${this._id}-${kind}`}
            inputmode=${kind === 'meridiem' ? 'text' : 'numeric'}
            role="spinbutton"
            spellcheck="false"
            tabindex=${editable ? 0 : -1}
            @beforeinput=${(event: InputEvent) => event.preventDefault()}
            @blur=${() => window.getSelection()?.removeAllRanges()}
            @keydown=${(event: KeyboardEvent) => this._onSegmentKeyDown(event, kind)}
        ></span>`;
    }

    private _toggleButton() {
        const label = `${this._open ? 'Close' : 'Open'} Time Picker`;
        return html`<span
            aria-controls=${this._open ? this._menuId : nothing}
            aria-disabled=${this._locked ? 'true' : nothing}
            aria-expanded=${this._open ? 'true' : 'false'}
            aria-haspopup="dialog"
            aria-label=${label}
            data-button
            role="combobox"
            tabindex=${this._locked ? -1 : 0}
            @click=${this._toggleOpen}
            @keydown=${(event: KeyboardEvent) => {
                if (event.code !== 'Enter' && event.code !== 'Space') return;
                event.preventDefault();
                this._toggleOpen();
            }}
        >
            <span aria-hidden="true" data-button-icon>${SCHEDULE}</span
            ><span aria-hidden="true" data-touch-target></span>
        </span>`;
    }

    private _listboxTemplate(kind: Segment, selected: string | undefined) {
        const active = this._activeOptions[kind];
        return html`<div
            aria-activedescendant=${this._optionId(kind, active)}
            aria-label=${`Select ${kind}`}
            data-scroll-column=${kind}
            data-type=${kind}
            role="listbox"
            tabindex="0"
            @click=${(event: Event) => {
                const value = (event.target as HTMLElement).dataset.value;
                if (value) this._select(kind, value);
            }}
            @keydown=${(event: KeyboardEvent) => this._onListboxKeyDown(event, kind)}
        >
            ${OPTIONS[kind].map(
                (option) =>
                    html`<span
                        aria-label=${option}
                        aria-selected=${option === selected ? 'true' : 'false'}
                        ?data-active=${option === active}
                        data-value=${option}
                        id=${this._optionId(kind, option)}
                        role="option"
                        >${option}</span
                    >`,
            )}
        </div>`;
    }

    private _popupTemplate(parts: ReturnType<typeof valueToParts>) {
        return html`<div
            aria-label="Select time"
            aria-modal="true"
            data-menu
            id=${this._menuId}
            popover="manual"
            role="dialog"
            tabindex="-1"
            @keydown=${this._onPopupKeyDown}
        >
            <div data-scroll-values>${SEGMENTS.map((kind) => this._listboxTemplate(kind, parts[kind]))}</div>
        </div>`;
    }

    render() {
        const parts = valueToParts(this.value || '00:00');
        return html`
            <div
                ?data-disabled=${this.disabled || this._formDisabled}
                ?data-invalid=${this.invalid}
                data-name=${this.name || nothing}
                ?data-open=${this._open}
                data-pttrn="time-picker"
                ?data-readonly=${this.readOnly}
                data-size=${this.size || nothing}
                data-value=${this.value || nothing}
                @keydown=${(event: KeyboardEvent) => {
                    if (event.code === 'Escape') this._setOpen(false);
                }}
            >
                ${this._segment('hours', parts.hours)}
                <span aria-hidden="true">:</span>
                ${this._segment('minutes', parts.minutes)} ${this._segment('meridiem', parts.meridiem)}
                ${this._toggleButton()}
            </div>
            <span aria-hidden="true">${tooltipTemplate(`${this._open ? 'Close' : 'Open'} Time Picker`)}</span>
            ${this._open ? this._popupTemplate(parts) : nothing}
        `;
    }
}

define('pttrn-time-picker', PttrnTimePicker);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-time-picker': PttrnTimePicker;
    }
}
