import cancelIcon from '@ptrn/icons/Cancel.svg';
import { PropertyDeclarations, PropertyValues, TemplateResult, html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { FIELD_IDS, FieldControl } from './field-control';
import { icon } from './icon';

type Content = TemplateResult | typeof nothing;

/** What an element built on the Input box puts in it. */
export type InputBoxOptions = {
    /** The type of the native input. */
    type: string;
    /** Before the input, in `[data-leading]`; hidden when `leadingHidden`. */
    leading?: Content;
    leadingHidden?: boolean;
    /** After the input, in `[data-trailing]`; hidden when `trailingHidden`. */
    trailing?: Content;
    trailingHidden?: boolean;
    /** Whether the clear button can show (it also needs a value and an editable field). */
    clearable?: boolean;
    autocomplete?: string;
    inputmode?: string;
    /** Combobox semantics for an input that controls a list (SearchBar). */
    combobox?: { controls?: string; expanded: boolean; activeDescendant?: string };
    /** `data-pttrn-owner` on the box, as the React Input's `owner`. */
    owner?: string;
    onKeyDown?: (event: KeyboardEvent) => void;
    onFocus?: (event: FocusEvent) => void;
};

/**
 * The React Input box (`[data-pttrn='input']`: leading content, the native input, trailing content and the clear
 * button) for the elements that are an Input in React: Input itself, and Password, SearchBar and InputPhone, which wrap
 * one. It keeps the string `value`, reports typing with `pttrn-change`, and is a form control through `FieldControl`.
 * Pair it with `src/styles/_input-box.scss`.
 */
export class InputBase extends FieldControl {
    static properties: PropertyDeclarations = {
        value: { type: String },
        placeholder: { type: String },
        size: { type: String, reflect: true },
    };

    /** The current value. The `value` attribute is the default value, which a form reset goes back to. */
    declare value: string;
    /** Shown while the input is empty. */
    declare placeholder: string;
    /** The size of the field. */
    declare size: 'large' | 'medium' | 'small';

    constructor() {
        super();
        this.value = '';
        this.placeholder = '';
        this.size = 'medium';
    }

    /** The native input. */
    protected get _input() {
        return this.renderRoot?.querySelector<HTMLInputElement>('[data-main-input]') ?? null;
    }

    protected get _validityAnchor() {
        return this._input;
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

    /** The value the user typed; an element that formats or filters it overrides this. */
    protected _onInput(event: Event) {
        this.value = (event.target as HTMLInputElement).value;
        this._emitChange(this.value);
    }

    protected _clear() {
        this.value = '';
        this._emitChange(this.value);
        this._input?.focus();
    }

    protected _renderInputBox(options: InputBoxOptions) {
        const disabled = this._isDisabled;
        const value = String(this.value ?? '');
        const showClearButton = !!options.clearable && !this.readOnly && !disabled && value.length > 0;
        const aria = this._controlAria;
        const combobox = options.combobox;

        return html`
            <div
                data-pttrn="input"
                data-pttrn-owner=${options.owner ?? nothing}
                data-size=${this.size}
                ?data-disabled=${disabled}
                ?data-empty=${!value.length}
                ?data-invalid=${this._isInvalid}
                ?data-readonly=${this.readOnly}
                ?data-show-clear-button=${showClearButton}
            >
                ${
                    options.leading === undefined
                        ? nothing
                        : html`<span data-leading ?hidden=${!!options.leadingHidden}>${options.leading}</span>`
                }
                <input
                    aria-activedescendant=${combobox?.activeDescendant ?? nothing}
                    aria-autocomplete=${combobox ? 'list' : nothing}
                    aria-controls=${combobox?.controls ?? nothing}
                    aria-describedby=${aria.describedBy}
                    aria-errormessage=${aria.errorMessage}
                    aria-expanded=${combobox ? String(combobox.expanded) : nothing}
                    aria-haspopup=${combobox ? 'listbox' : nothing}
                    aria-invalid=${aria.invalid}
                    aria-label=${aria.label}
                    autocomplete=${options.autocomplete ?? 'off'}
                    data-main-input
                    id=${FIELD_IDS.control}
                    inputmode=${options.inputmode ?? nothing}
                    name=${this.name || nothing}
                    placeholder=${this.placeholder || ' '}
                    role=${combobox ? 'combobox' : nothing}
                    spellcheck=${combobox ? 'false' : nothing}
                    type=${options.type}
                    .value=${live(value)}
                    ?disabled=${disabled}
                    ?readonly=${this.readOnly}
                    ?required=${this.required}
                    @focus=${options.onFocus}
                    @input=${this._onInput}
                    @keydown=${options.onKeyDown}
                />
                ${
                    options.trailing === undefined
                        ? nothing
                        : html`<span data-trailing ?hidden=${!!options.trailingHidden}>${options.trailing}</span>`
                }
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
        `;
    }
}
