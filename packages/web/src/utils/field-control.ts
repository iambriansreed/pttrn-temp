import errorIcon from '@ptrn/icons/ErrorFill.svg';
import { LitElement, PropertyDeclarations, PropertyValues, TemplateResult, html, nothing } from 'lit';
import { emit } from './emit';
import { icon } from './icon';

/** The ids inside a field control's shadow root. Each shadow root is its own id scope, so they can be fixed. */
export const FIELD_IDS = {
    control: 'control',
    label: 'label',
    description: 'description',
    error: 'error',
} as const;

/** The `detail` of `pttrn-change`. */
export type FieldChangeDetail<Value = string> = { value: Value };

type ValidityAnchor = HTMLInputElement | HTMLTextAreaElement;

const VALIDITY_FLAGS = [
    'badInput',
    'customError',
    'patternMismatch',
    'rangeOverflow',
    'rangeUnderflow',
    'stepMismatch',
    'tooLong',
    'tooShort',
    'typeMismatch',
    'valueMissing',
] as const;

/**
 * The base of the `@ptrn/web` form controls (Input, Textarea, Password and the rest). It is the Web Component
 * counterpart of `FieldControlProps` plus the `Field` around it:
 *
 * - **Form participation.** A form-associated custom element (`ElementInternals`): it submits `name` and its value with a
 *   `<form>`, takes part in constraint validation by mirroring its native control's validity, follows a disabled
 *   `<fieldset>`, and goes back to its `value` attribute on form reset.
 * - **The field.** `label`, `helper-text`, `error-message` and `label-trailing` render the `Field` parts inside the same
 *   shadow root as the control, so the label, description and error message reach it (ids cannot cross a shadow
 *   boundary, so a `Field` or `<label>` outside the element cannot name the control inside it).
 * - **`aria-label`** on the element names the control, as the React prop does.
 *
 * Subclasses render their control with `_renderField()`, report their value with `_formValue()` and point
 * `_validityAnchor` at the native control whose validity the element mirrors.
 */
export class FieldControl extends LitElement {
    static formAssociated = true;

    static shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, delegatesFocus: true };

    static properties: PropertyDeclarations = {
        name: { type: String, reflect: true },
        disabled: { type: Boolean, reflect: true },
        readOnly: { type: Boolean, reflect: true, attribute: 'readonly' },
        required: { type: Boolean, reflect: true },
        invalid: { type: Boolean, reflect: true },
        label: { type: String },
        helperText: { type: String, attribute: 'helper-text' },
        errorMessage: { type: String, attribute: 'error-message' },
        labelTrailing: { type: String, attribute: 'label-trailing' },
        ariaLabel: { type: String, attribute: 'aria-label' },
        _formDisabled: { state: true },
    };

    /** The name the value is submitted under in a form. */
    declare name: string;
    /** Prevents interaction; the value is not submitted. A disabled `<fieldset>` around the element does the same. */
    declare disabled: boolean;
    /** The value can be read and submitted but not changed. */
    declare readOnly: boolean;
    /** A value is required before the form can be submitted. */
    declare required: boolean;
    /** Shows the error state and sets `aria-invalid`. Pair it with `error-message`. */
    declare invalid: boolean;
    /** A visible label above the control, the `Field` label. It names the control. */
    declare label: string;
    /** Text under the control that describes it, the `Field` helper text. Hidden while there is an error message. */
    declare helperText: string;
    /** An error shown under the control in place of the helper text; it marks the control invalid. */
    declare errorMessage: string;
    /** Text at the end of the label row, hidden from assistive technology. */
    declare labelTrailing: string;
    /** Names the control when there is no visible label. It takes precedence over `label`. */
    declare ariaLabel: string | null;
    declare _formDisabled: boolean;

    protected readonly _internals: ElementInternals;

    constructor() {
        super();
        this.name = '';
        this.disabled = false;
        this.readOnly = false;
        this.required = false;
        this.invalid = false;
        this.label = '';
        this.helperText = '';
        this.errorMessage = '';
        this.labelTrailing = '';
        this.ariaLabel = null;
        this._formDisabled = false;
        this._internals = this.attachInternals();
    }

    /** The form the element belongs to. */
    get form() {
        return this._internals.form;
    }

    /** The element's validity, mirrored from its native control. */
    get validity() {
        return this._internals.validity;
    }

    /** The browser's message for the current validity problem, or an empty string. */
    get validationMessage() {
        return this._internals.validationMessage;
    }

    /** Whether the element takes part in constraint validation. */
    get willValidate() {
        return this._internals.willValidate;
    }

    /** Checks validity and fires `invalid` when it fails, like a native control. */
    checkValidity() {
        return this._internals.checkValidity();
    }

    /** Checks validity and shows the browser's message when it fails, like a native control. */
    reportValidity() {
        return this._internals.reportValidity();
    }

    /** Disabled directly or by a disabled `<fieldset>`. */
    protected get _isDisabled() {
        return this.disabled || this._formDisabled;
    }

    /** Invalid directly or because there is an error message. */
    protected get _isInvalid() {
        return this.invalid || !!this.errorMessage;
    }

    formDisabledCallback(disabled: boolean) {
        this._formDisabled = disabled;
    }

    formResetCallback() {
        this._resetValue();
    }

    formStateRestoreCallback(state: string | File | FormData | null) {
        if (typeof state === 'string') this._restoreValue(state);
    }

    /** What the element submits: a string, `FormData` for several entries, or null for nothing. */
    protected _formValue(): string | FormData | null {
        return null;
    }

    /** Called on form reset: go back to the default value (the `value` attribute). */
    protected _resetValue() {}

    /** Called when the browser restores the form (back navigation, autofill). */
    protected _restoreValue(state: string) {
        void state;
    }

    /** The native control whose validity the element mirrors, if any. */
    protected get _validityAnchor(): ValidityAnchor | null {
        return null;
    }

    /** Fires `pttrn-change` (and `change`, for code that listens the native way) after a user-driven change. */
    protected _emitChange<Value>(value: Value) {
        emit<FieldChangeDetail<Value>>(this, 'pttrn-change', { value });
        this.dispatchEvent(new Event('change', { bubbles: true }));
    }

    protected updated(changed: PropertyValues) {
        super.updated(changed);
        this._internals.setFormValue(this._formValue());
        this._syncValidity();
    }

    protected _syncValidity() {
        const anchor = this._validityAnchor;
        if (!anchor || anchor.validity.valid) {
            this._internals.setValidity({});
            return;
        }
        const flags: ValidityStateFlags = {};
        for (const flag of VALIDITY_FLAGS) flags[flag] = anchor.validity[flag];
        this._internals.setValidity(flags, anchor.validationMessage, anchor);
    }

    /** The aria attributes the control carries: its name, description and error state. */
    protected get _controlAria() {
        return {
            label: this.ariaLabel || nothing,
            describedBy: this.helperText && !this.errorMessage ? FIELD_IDS.description : nothing,
            errorMessage: this.errorMessage ? FIELD_IDS.error : nothing,
            invalid: this._isInvalid ? 'true' : nothing,
        };
    }

    /** The label row: the label, " (Required)" and the trailing text. */
    protected _renderLabelContent() {
        return html`<span>${this.label}</span>${
                this.required ? html`<span data-required>${' (Required)'}</span>` : nothing
            }${
                this.labelTrailing ? html`<span aria-hidden="true" data-trailing>${this.labelTrailing}</span>` : nothing
            }`;
    }

    /** The error alert or the helper text under the control. */
    protected _renderMessage() {
        if (this.errorMessage) {
            return html`<div data-field-error id=${FIELD_IDS.error} role="alert">
                ${icon(errorIcon)}<span>${this.errorMessage}</span>
            </div>`;
        }
        if (this.helperText) {
            return html`<p data-field-description id=${FIELD_IDS.description}>${this.helperText}</p>`;
        }
        return nothing;
    }

    /**
     * The control inside the `Field` parts, when there are any. The label points at the native control with `for`, as
     * the React Field does. With `fieldset`, the parts are the React Fieldset instead: a fieldset named by a legend,
     * for a group of controls (RadioGroupField).
     */
    protected _renderField(control: TemplateResult, { fieldset = false }: { fieldset?: boolean } = {}) {
        if (!this.label && !this.helperText && !this.errorMessage) return control;
        if (fieldset) {
            return html`<div data-field>
                <fieldset role="group">
                    ${
                        this.label
                            ? html`<legend>
                                  <span data-field-label id=${FIELD_IDS.label}>${this._renderLabelContent()}</span>
                              </legend>`
                            : nothing
                    }
                    ${control} ${this._renderMessage()}
                </fieldset>
            </div>`;
        }
        return html`<div data-field role="group">
            ${
                this.label
                    ? html`<label data-field-label for=${FIELD_IDS.control} id=${FIELD_IDS.label}
                          >${this._renderLabelContent()}</label
                      >`
                    : nothing
            }
            ${control} ${this._renderMessage()}
        </div>`;
    }
}
