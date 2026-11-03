import circleFill from '@ptrn/icons/CircleFill.svg';
import { PropertyValues, html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { define } from '../../utils/define';
import { FIELD_IDS, FieldControl } from '../../utils/field-control';
import { icon } from '../../utils/icon';
import styles from './otp-input.scss';

const MAX_LENGTH = 10;

/**
 * A row of input fields that are used to input a temporary secure pin code sent to the customer.
 *
 * Each cell takes one character: digits, or letters too when `alphanumeric`. Typing moves to the next cell and
 * Backspace on an empty one moves back; pasting fills the cells from the focused one, keeping only the characters the
 * input accepts ("123-456" fills six cells). Only the filled cells and the next empty one are tab stops. The group and
 * every cell are named from `aria-label` (or `label`), "OTP input" without either, a cell adding its position: "OTP
 * input digit 3". It is a form control: it submits `name` and the code with its form, `required` blocks submission
 * until every cell is filled, and a form reset goes back to the `value` attribute.
 *
 * @fires {CustomEvent<{ value: string }>} pttrn-change - When the last cell fills: `detail.value` is the whole code.
 *   Not before.
 * @fires {Event} change - With `pttrn-change`, so code that listens for the native event works too.
 * @element pttrn-otp-input
 */
export class PttrnOTPInput extends FieldControl {
    static properties = {
        value: { type: String },
        length: { type: Number },
        alphanumeric: { type: Boolean, reflect: true },
        secure: { type: Boolean, reflect: true },
        size: { type: String, reflect: true },
        _values: { state: true },
    };

    static styles = styles;

    /** The code. The `value` attribute is the default (React's `defaultValue`), which a form reset goes back to. */
    declare value: string;
    /** The number of cells, up to 10. */
    declare length: number;
    /** Accepts letters as well as digits, with a text keyboard on touch screens instead of a numeric one. */
    declare alphanumeric: boolean;
    /** Masks the characters, drawing a dot over each filled cell. */
    declare secure: boolean;
    /** The size of the cells. */
    declare size: 'large' | 'medium' | 'small';
    /** One entry per cell, as React keeps them: its length marks the next cell to fill. */
    declare _values: string[];

    constructor() {
        super();
        this.value = '';
        this.length = 6;
        this.alphanumeric = false;
        this.secure = false;
        this.size = 'medium';
        this._values = [];
    }

    private get _length() {
        const length = Math.floor(Number(this.length));
        return Number.isFinite(length) && length > 0 ? Math.min(length, MAX_LENGTH) : 6;
    }

    private get _cells() {
        return [...this.renderRoot.querySelectorAll<HTMLInputElement>('[data-digit]')];
    }

    private get _code() {
        return this._values.join('').trim();
    }

    private get _name() {
        return this.ariaLabel || this.label || 'OTP input';
    }

    protected willUpdate(changed: PropertyValues) {
        super.willUpdate(changed);
        if (changed.has('value') && String(this.value ?? '') !== this._code) {
            this._values = String(this.value ?? '')
                .split('')
                .slice(0, this._length);
        }
    }

    protected get _validityAnchor() {
        const cells = this._cells;
        return cells.find((cell) => !cell.validity.valid) ?? cells[0] ?? null;
    }

    protected _formValue() {
        return this._code;
    }

    protected _resetValue() {
        this.value = this.getAttribute('value') ?? '';
        this._values = this.value.split('').slice(0, this._length);
    }

    protected _restoreValue(state: string) {
        this.value = state;
    }

    private _accepts(character: string) {
        return this.alphanumeric ? /^[0-9a-z]$/i.test(character) : /^[0-9]$/.test(character);
    }

    /** Stores the cells, keeps `value` in step and reports the code once every cell is filled. */
    private _setValues(values: string[]) {
        this._values = values;
        this.value = this._code;
        if (this._code.length === this._length) this._emitChange(this._code);
    }

    /** A cell can take focus when it is the first, is filled, comes before a filled one, or is the next to fill. */
    private _canFocus(index: number) {
        const values = this._values;
        return index === 0 || !!values[index] || !!values[index + 1] || index === values.length;
    }

    private _focus(index: number) {
        this._cells[index]?.focus();
    }

    private _onInput(event: Event, index: number) {
        const cell = event.target as HTMLInputElement;
        const character = cell.value;
        // The keydown filter cannot see every character (a virtual keyboard or an IME sends no readable key), so the
        // cell checks what it receives too, and puts its value back when it does not accept it.
        if (character && !this._accepts(character)) {
            cell.value = this._values[index] || '';
            return;
        }
        const values = [...this._values];
        values[index] = character;
        this._setValues(values);
        if (character) this._focus(index + 1);
    }

    private _onKeyDown(event: KeyboardEvent, index: number) {
        // A single character typed without Ctrl, Meta or Alt (so shortcuts like paste get through). Shift is not exempt:
        // Shift+A types "A", and some layouts type digits with it.
        if (
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey &&
            !this.alphanumeric &&
            !/^[0-9]$/.test(event.key)
        ) {
            event.preventDefault();
            return;
        }
        // The keys below act without Shift, as in React (Shift+Backspace is not Backspace).
        if (event.shiftKey) return;

        const cells = this._cells;
        switch (event.key) {
            case 'Backspace': {
                const values = [...this._values];
                if (cells[index]?.value) {
                    values[index] = '';
                    this._setValues(values);
                    this._focus(index);
                } else if (index > 0) {
                    values[index - 1] = '';
                    this._setValues(values);
                    this._focus(index - 1);
                }
                break;
            }
            case 'ArrowUp':
            case 'ArrowLeft':
                this._focus(index - 1);
                break;
            case 'ArrowDown':
            case 'ArrowRight':
                // Only past a filled cell.
                this._focus(cells[index]?.value ? index + 1 : index);
                break;
            default:
                return;
        }
        event.preventDefault();
        event.stopPropagation();
    }

    /** A press on a cell past the next one to fill lands on that one instead. */
    private _onMouseDown(event: MouseEvent, index: number) {
        if (this._canFocus(index)) return;
        event.preventDefault();
        this._focus(this._values.length);
    }

    private _onPaste(event: ClipboardEvent, index: number) {
        event.preventDefault();
        // Codes are often copied with spaces or dashes ("123-456"); keep only the characters the input accepts.
        const pasted = (event.clipboardData?.getData('text') ?? '').replace(
            this.alphanumeric ? /[^0-9a-z]/gi : /[^0-9]/g,
            '',
        );
        const length = this._length;
        const values = [...this._values];
        for (let i = 0; i < pasted.length && index + i < length; i++) values[index + i] = pasted[i];
        this._setValues(values);
        this._focus(Math.min(index + pasted.length, length - 1));
    }

    private _renderCell(index: number) {
        const aria = this._controlAria;
        const first = index === 0;
        const focusable = this._canFocus(index);
        const disabled = this._isDisabled;
        return html`<input
            aria-describedby=${first ? aria.describedBy : nothing}
            aria-errormessage=${first ? aria.errorMessage : nothing}
            aria-invalid=${first ? aria.invalid : nothing}
            aria-label=${`${this._name} digit ${index + 1}`}
            autocomplete="off"
            data-digit
            data-index=${index}
            data-main-input
            ?data-not-selectable=${!focusable}
            id=${first ? FIELD_IDS.control : nothing}
            inputmode=${this.alphanumeric ? 'text' : 'numeric'}
            maxlength="1"
            name=${this.name ? (first ? this.name : `${this.name}-${index}`) : nothing}
            tabindex=${focusable ? 0 : -1}
            type=${this.secure ? 'password' : 'text'}
            .value=${live(this._values[index] || '')}
            ?disabled=${disabled}
            ?readonly=${this.readOnly}
            ?required=${this.required}
            @focus=${(event: FocusEvent) =>
                requestAnimationFrame(() => (event.target as HTMLInputElement | null)?.select())}
            @input=${(event: Event) => this._onInput(event, index)}
            @keydown=${(event: KeyboardEvent) => this._onKeyDown(event, index)}
            @mousedown=${(event: MouseEvent) => this._onMouseDown(event, index)}
            @paste=${(event: ClipboardEvent) => this._onPaste(event, index)}
        />`;
    }

    render() {
        const length = this._length;
        const indexes = Array.from({ length }, (_, index) => index);
        const group = html`<div
            aria-label=${this._name}
            data-pttrn="otp-input"
            data-size=${this.size || 'medium'}
            role="group"
            ?data-disabled=${this._isDisabled}
            ?data-invalid=${this._isInvalid}
            ?data-readonly=${this.readOnly}
            ?data-secure=${this.secure}
        >
            <span
                data-digits
                role="group"
                @mousedown=${(event: MouseEvent) => {
                    // A press between the cells does nothing.
                    if ((event.target as HTMLElement).tagName !== 'INPUT') event.preventDefault();
                }}
            >
                ${indexes.map((index) => this._renderCell(index))}
            </span>
            ${
                this.secure
                    ? html`<span data-digits data-secure-dots>
                          ${indexes.map(
                              (index) =>
                                  html`<span data-dot
                                      >${this._values[index]?.trim() ? icon(circleFill) : nothing}</span
                                  >`,
                          )}
                      </span>`
                    : nothing
            }
        </div>`;
        return this._renderField(group);
    }
}

define('pttrn-otp-input', PttrnOTPInput);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-otp-input': PttrnOTPInput;
    }
}
