import { LitElement, html, type PropertyValues } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { checkboxBox } from '../../utils/checkbox-box';
import { define } from '../../utils/define';
import { emit } from '../../utils/emit';
import { isClickOnHost, labelsText } from '../../utils/form-control';
import styles from './checkbox.scss';

export type CheckboxChangeDetail = { checked: boolean };

/**
 * A control that allows users to choose one or more items from a list or turn an feature on or off. This is the base
 * element and if used directly you must label it. This will more often be used in the pttrn-checkbox-option or
 * pttrn-checkbox-group element.
 *
 * React prop to Web Component mapping:
 *
 * - `checked`, `indeterminate`, `disabled`, `invalid`, `required`, `name`, `value` → attributes of the same name. The
 *   element is form associated: in a `<form>` it submits `value` under `name` while checked, blocks submission while
 *   required and unchecked, resets with the form and follows a disabled fieldset.
 * - The aria-label prop → the aria-label attribute on the element, passed to the inner checkbox; a `<label for>` or a
 *   wrapping `<label>` names it too.
 * - `onChange(checked, event)` → the `pttrn-change` event (`detail.checked`) and a `change` event, after the user toggles
 *   it. The element keeps its own state, as a native checkbox does, and a user toggle clears `indeterminate`.
 *
 * @fires {CustomEvent<{ checked: boolean }>} pttrn-change - After the user toggles the checkbox. `detail.checked` is
 *   the new state.
 * @fires {Event} change - After the user toggles the checkbox, as a native checkbox fires it.
 * @element pttrn-checkbox
 */
export class PttrnCheckbox extends LitElement {
    static formAssociated = true;

    static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

    static properties = {
        checked: { type: Boolean, reflect: true },
        indeterminate: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true },
        invalid: { type: Boolean, reflect: true },
        required: { type: Boolean, reflect: true },
        name: { type: String, reflect: true },
        value: { type: String },
        accessibleLabel: { type: String, attribute: 'aria-label' },
        _formDisabled: { state: true },
        _labelsText: { state: true },
    };

    static styles = styles;

    /** Whether the checkbox is checked. */
    declare checked: boolean;
    /** Shows the checkbox as partly checked (assistive technology reports mixed), over `checked`. */
    declare indeterminate: boolean;
    /** Disables the checkbox. It leaves the tab order and does not toggle. */
    declare disabled: boolean;
    /** Marks the checkbox invalid (aria-invalid) and draws it in the error color. */
    declare invalid: boolean;
    /** The checkbox must be checked for its form to submit. */
    declare required: boolean;
    /** The name the value is submitted under in a form. */
    declare name: string;
    /** The value submitted while the checkbox is checked. */
    declare value: string;
    /** The accessible name, from the aria-label attribute. */
    declare accessibleLabel: string | undefined;
    declare _formDisabled: boolean;
    declare _labelsText: string;

    protected readonly _internals: ElementInternals;
    private _defaultChecked: boolean | undefined;

    constructor() {
        super();
        this.checked = false;
        this.indeterminate = false;
        this.disabled = false;
        this.invalid = false;
        this.required = false;
        this.name = '';
        this.value = 'on';
        this.accessibleLabel = undefined;
        this._formDisabled = false;
        this._labelsText = '';
        this._internals = this.attachInternals();
        this.addEventListener('click', (event) => {
            if (isClickOnHost(this, event) && !this._isDisabled) this._input?.click();
        });
        this.addEventListener('focusin', () => this._readLabels());
    }

    /** The form the element belongs to. */
    get form() {
        return this._internals.form;
    }

    /** The validity of the element in its form: `valueMissing` while required and unchecked. */
    get validity() {
        return this._internals.validity;
    }

    protected get _input() {
        return this.shadowRoot?.querySelector('input') ?? null;
    }

    protected get _isDisabled() {
        return this.disabled || this._formDisabled;
    }

    connectedCallback() {
        super.connectedCallback();
        // The markup's checked state is the one a form reset goes back to, as a native checkbox's checked attribute is.
        this._defaultChecked ??= this.hasAttribute('checked');
    }

    formResetCallback() {
        this.checked = !!this._defaultChecked;
    }

    formDisabledCallback(disabled: boolean) {
        this._formDisabled = disabled;
    }

    formStateRestoreCallback(state: string | null) {
        this.checked = state === 'on';
    }

    firstUpdated() {
        this._readLabels();
    }

    willUpdate(changed: PropertyValues<this>) {
        if (changed.has('checked') || changed.has('value')) {
            this._internals.setFormValue(this.checked ? this.value : null, this.checked ? 'on' : 'off');
        }
    }

    updated() {
        // The inner checkbox knows when a required box is missing and has the browser's own message for it.
        const input = this._input;
        if (input) this._internals.setValidity(input.validity, input.validationMessage, input);
    }

    private _readLabels() {
        this._labelsText = labelsText(this._internals);
    }

    protected _onChange(event: Event) {
        const input = event.target as HTMLInputElement;
        this.checked = input.checked;
        this.indeterminate = input.indeterminate;
        emit<CheckboxChangeDetail>(this, 'pttrn-change', { checked: this.checked });
        this.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /** The native checkbox, named by `ariaLabel`. */
    protected _renderInput(ariaLabel: string) {
        return html`<input
            aria-invalid=${ifDefined(this.invalid ? 'true' : undefined)}
            aria-label=${ifDefined(ariaLabel || undefined)}
            data-indeterminate=${ifDefined(this.indeterminate ? '' : undefined)}
            name=${ifDefined(this.name || undefined)}
            type="checkbox"
            value=${this.value}
            .checked=${live(this.checked)}
            .indeterminate=${live(this.indeterminate)}
            ?disabled=${this._isDisabled}
            ?required=${this.required}
            @change=${this._onChange}
        />`;
    }

    render() {
        return html`<span data-pttrn="checkbox">
            ${this._renderInput(this.accessibleLabel || this._labelsText)}
            ${checkboxBox(this.checked, this.indeterminate)}
        </span>`;
    }
}

define('pttrn-checkbox', PttrnCheckbox);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-checkbox': PttrnCheckbox;
    }
}
