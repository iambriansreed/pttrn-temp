import { html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { define } from '../../utils/define';
import { FieldControl } from '../../utils/field-control';
import { uniqueId } from '../../utils/id';
import styles from './radio-group.scss';
import './radio-group-item';

type Option = { value: string; label: string; description: string; disabled: boolean };

/**
 * A group of radios that allows users to choose one or more items from a list or turn an feature on or off.
 *
 * Each option is a `pttrn-radio-group-item` child; the group draws them all as native radios sharing one name in its
 * own shadow root, so Tab enters on the chosen radio and the arrow keys move the choice, skipping disabled options.
 * Name the group with `aria-label`, or with `label`, which renders the RadioGroupField parts: a fieldset named by its
 * legend, with `helper-text` or `error-message` under the options. It is a form control: it submits `name` and the
 * chosen value with its form, `required` blocks submission until an option is chosen, and a form reset goes back to the
 * `value` attribute.
 *
 * @fires {CustomEvent<{ value: string }>} pttrn-change - After the user chooses an option. `detail.value` is its value.
 * @fires {Event} change - With `pttrn-change`, so code that listens for the native event works too.
 * @element pttrn-radio-group
 * @slot - `pttrn-radio-group-item` elements, one per option.
 */
export class PttrnRadioGroup extends FieldControl {
    static properties = {
        value: { type: String },
    };

    static styles = styles;

    /** The value of the chosen option. The `value` attribute is the default, which a form reset goes back to. */
    declare value: string;

    /** The radios need a shared name to form a keyboard group, even when the element has none. */
    private readonly _fallbackName = uniqueId('pttrn-radio-group');

    constructor() {
        super();
        this.value = '';
    }

    private get _options(): Option[] {
        return [...this.children]
            .filter((child) => child.localName === 'pttrn-radio-group-item')
            .map((item) => ({
                value: item.getAttribute('value') ?? '',
                label: item.getAttribute('label') ?? '',
                description: item.getAttribute('description') ?? '',
                disabled: item.hasAttribute('disabled'),
            }));
    }

    protected get _validityAnchor() {
        return this.renderRoot?.querySelector<HTMLInputElement>('input[type="radio"]') ?? null;
    }

    protected _formValue() {
        return this._options.some((option) => option.value === this.value) ? this.value : null;
    }

    protected _resetValue() {
        this.value = this.getAttribute('value') ?? '';
    }

    protected _restoreValue(state: string) {
        this.value = state;
    }

    private _onChange(event: Event) {
        const radio = event.target as HTMLInputElement;
        if (!radio.checked) return;
        this.value = radio.value;
        this._emitChange(this.value);
    }

    private _renderOption(option: Option, name: string) {
        const disabled = this._isDisabled || option.disabled;
        const aria = this._controlAria;
        return html`<label
            data-pttrn="list-item"
            data-pttrn-owner="radio-option"
            data-width="hug"
            ?data-disabled=${disabled}
        >
            <span data-leading>
                <span data-pttrn="radio">
                    <input
                        aria-describedby=${aria.describedBy}
                        aria-errormessage=${aria.errorMessage}
                        aria-label=${option.description ? `${option.label} - ${option.description}` : option.label}
                        name=${name}
                        type="radio"
                        .checked=${live(option.value === this.value)}
                        .value=${option.value}
                        ?data-invalid=${this._isInvalid}
                        ?disabled=${disabled}
                        ?required=${this.required}
                        @change=${this._onChange}
                    />
                    <span aria-hidden="true"></span>
                </span>
            </span>
            <span data-item-label>
                <span data-text data-truncated>${option.label}</span>
                ${option.description ? html`<span data-sub-text>${option.description}</span>` : nothing}
            </span>
        </label>`;
    }

    render() {
        const aria = this._controlAria;
        const name = this.name || this._fallbackName;
        const group = html`<div
            aria-describedby=${aria.describedBy}
            aria-errormessage=${aria.errorMessage}
            aria-invalid=${aria.invalid}
            aria-label=${aria.label}
            data-pttrn="radio-group"
            role="radiogroup"
        >
            ${this._options.map((option) => this._renderOption(option, name))}
        </div>`;

        // The options are read from the children; the hidden slot only reports when they change.
        return html`${this._renderField(group, { fieldset: true })}<slot
                hidden
                @slotchange=${() => this.requestUpdate()}
            ></slot>`;
    }
}

define('pttrn-radio-group', PttrnRadioGroup);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-radio-group': PttrnRadioGroup;
    }
}
