import cancelIcon from '@ptrn/icons/Cancel.svg';
import { PropertyValues, html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { define } from '../../utils/define';
import { FIELD_IDS, FieldControl } from '../../utils/field-control';
import { icon } from '../../utils/icon';
import styles from './input.scss';

/**
 * An input that allows users to enter text, numbers or symbols in a singular line.
 *
 * The input needs a name: `label` (the visible label a Field gives the React Input) or `aria-label`. It is a form
 * control: it submits `name` and `value` with its form, mirrors the native input's validity, and goes back to its
 * `value` attribute on form reset.
 *
 * @fires {CustomEvent<{ value: string }>} pttrn-change - After the user types or clears the field. `detail.value` is
 *   the new value.
 * @fires {Event} change - With `pttrn-change`, so code that listens for the native event works too.
 * @element pttrn-input
 * @slot leading - Shown before the input: a symbol, an icon or a button.
 * @slot trailing - Shown after the input.
 */
export class PttrnInput extends FieldControl {
    static properties = {
        value: { type: String },
        placeholder: { type: String },
        type: { type: String },
        size: { type: String, reflect: true },
        autocomplete: { type: String },
        hideClearButton: { type: Boolean, attribute: 'hide-clear-button' },
        _hasLeading: { state: true },
        _hasTrailing: { state: true },
    };

    static styles = styles;

    /** The current value. The `value` attribute is the default value, which a form reset goes back to. */
    declare value: string;
    /** Shown while the input is empty. */
    declare placeholder: string;
    /** The type of the native input. */
    declare type: 'number' | 'password' | 'text';
    /** The size of the field. */
    declare size: 'large' | 'medium' | 'small';
    /** Whether the browser may offer to fill the field. */
    declare autocomplete: 'off' | 'on';
    /** Hides the button that clears the field. Keep it unless there is a reason not to. */
    declare hideClearButton: boolean;
    declare _hasLeading: boolean;
    declare _hasTrailing: boolean;

    constructor() {
        super();
        this.value = '';
        this.placeholder = '';
        this.type = 'text';
        this.size = 'medium';
        this.autocomplete = 'off';
        this.hideClearButton = false;
        this._hasLeading = false;
        this._hasTrailing = false;
    }

    protected get _validityAnchor() {
        return this.renderRoot?.querySelector<HTMLInputElement>('[data-main-input]') ?? null;
    }

    protected _formValue() {
        return this.value;
    }

    protected _resetValue() {
        this.value = this.getAttribute('value') ?? '';
    }

    protected _restoreValue(state: string) {
        this.value = state;
    }

    protected willUpdate(changed: PropertyValues) {
        super.willUpdate(changed);
        if (this.value === null || this.value === undefined) this.value = '';
    }

    private _onInput(event: Event) {
        this.value = (event.target as HTMLInputElement).value;
        this._emitChange(this.value);
    }

    private _clear() {
        this.value = '';
        this._emitChange(this.value);
        this._validityAnchor?.focus();
    }

    private _onSlotChange(event: Event, key: '_hasLeading' | '_hasTrailing') {
        this[key] = (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
    }

    render() {
        const disabled = this._isDisabled;
        const value = String(this.value ?? '');
        const showClearButton = !this.hideClearButton && !this.readOnly && !disabled && value.length > 0;
        const aria = this._controlAria;

        return this._renderField(html`
            <div
                data-pttrn="input"
                data-size=${this.size}
                ?data-disabled=${disabled}
                ?data-empty=${!value.length}
                ?data-invalid=${this._isInvalid}
                ?data-readonly=${this.readOnly}
                ?data-show-clear-button=${showClearButton}
            >
                <span data-leading ?hidden=${!this._hasLeading}>
                    <slot name="leading" @slotchange=${(e: Event) => this._onSlotChange(e, '_hasLeading')}></slot>
                </span>
                <input
                    aria-describedby=${aria.describedBy}
                    aria-errormessage=${aria.errorMessage}
                    aria-invalid=${aria.invalid}
                    aria-label=${aria.label}
                    autocomplete=${this.autocomplete}
                    data-main-input
                    id=${FIELD_IDS.control}
                    name=${this.name || nothing}
                    placeholder=${this.placeholder || ' '}
                    type=${this.type}
                    .value=${live(value)}
                    ?disabled=${disabled}
                    ?readonly=${this.readOnly}
                    ?required=${this.required}
                    @input=${this._onInput}
                />
                <span data-trailing ?hidden=${!this._hasTrailing}>
                    <slot name="trailing" @slotchange=${(e: Event) => this._onSlotChange(e, '_hasTrailing')}></slot>
                </span>
                ${
                    showClearButton
                        ? html`<button
                              aria-label="Clear"
                              data-button
                              data-clear-button
                              data-size=${this.size}
                              data-variant="tertiary"
                              type="button"
                              @click=${this._clear}
                          >
                              <span aria-hidden="true" data-button-icon>${icon(cancelIcon)}</span>
                              <span aria-hidden="true" data-touch-target></span>
                          </button>`
                        : nothing
                }
            </div>
        `);
    }
}

define('pttrn-input', PttrnInput);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-input': PttrnInput;
    }
}
