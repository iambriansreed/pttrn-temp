import { LitElement, html, type PropertyValues } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { define } from '../../utils/define';
import { emit } from '../../utils/emit';
import { isClickOnHost, labelsText } from '../../utils/form-control';
import styles from './switch.scss';

export type SwitchChangeDetail = { checked: boolean };

/**
 * A control element that allows users to toggle between two states, typically representing on/off and inherits
 * immediate reaction in each state. This is the base element and if used directly you must label it. This will more
 * often be used in the pttrn-switch-option element.
 *
 * React prop to Web Component mapping:
 *
 * - `checked`, `disabled`, `name`, `value` → attributes of the same name. The element is form associated: in a `<form>`
 *   it submits `value` under `name` while checked, resets with the form and follows a disabled fieldset.
 * - The aria-label prop → the aria-label attribute on the element, passed to the inner switch; a `<label for>` or a
 *   wrapping `<label>` names it too.
 * - `onChange(checked, event)` → the `pttrn-change` event (`detail.checked`) and a `change` event, after the user toggles
 *   it. The element keeps its own state, as a native checkbox does.
 *
 * @fires {CustomEvent<{ checked: boolean }>} pttrn-change - After the user toggles the switch. `detail.checked` is the
 *   new state.
 * @fires {Event} change - After the user toggles the switch, as a native checkbox fires it.
 * @element pttrn-switch
 */
export class PttrnSwitch extends LitElement {
    static formAssociated = true;

    static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

    static properties = {
        checked: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true },
        name: { type: String, reflect: true },
        value: { type: String },
        accessibleLabel: { type: String, attribute: 'aria-label' },
        _formDisabled: { state: true },
        _labelsText: { state: true },
    };

    static styles = styles;

    /** Whether the switch is on. */
    declare checked: boolean;
    /** Disables the switch. It leaves the tab order and does not toggle. */
    declare disabled: boolean;
    /** The name the value is submitted under in a form. */
    declare name: string;
    /** The value submitted while the switch is on. */
    declare value: string;
    /** The accessible name, from the aria-label attribute. */
    declare accessibleLabel: string | undefined;
    declare _formDisabled: boolean;
    declare _labelsText: string;

    private readonly _internals: ElementInternals;
    private _defaultChecked: boolean | undefined;

    constructor() {
        super();
        this.checked = false;
        this.disabled = false;
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

    private _readLabels() {
        this._labelsText = labelsText(this._internals);
    }

    protected _onChange(event: Event) {
        this.checked = (event.target as HTMLInputElement).checked;
        emit<SwitchChangeDetail>(this, 'pttrn-change', { checked: this.checked });
        this.dispatchEvent(new Event('change', { bubbles: true }));
    }

    render() {
        const disabled = this._isDisabled;
        return html`<span data-pttrn="switch">
            <input
                aria-disabled=${ifDefined(disabled ? 'true' : undefined)}
                aria-label=${ifDefined(this.accessibleLabel || this._labelsText || undefined)}
                name=${ifDefined(this.name || undefined)}
                role="switch"
                type="checkbox"
                value=${this.value}
                .checked=${live(this.checked)}
                ?disabled=${disabled}
                @change=${this._onChange}
            />
            <span aria-hidden="true"></span>
        </span>`;
    }
}

define('pttrn-switch', PttrnSwitch);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-switch': PttrnSwitch;
    }
}
