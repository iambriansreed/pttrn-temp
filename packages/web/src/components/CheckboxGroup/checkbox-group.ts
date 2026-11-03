import { html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { checkboxBox } from '../../utils/checkbox-box';
import { define } from '../../utils/define';
import { FieldControl } from '../../utils/field-control';
import { PttrnCheckboxGroupItem } from './checkbox-group-item';
import styles from './checkbox-group.scss';

type Option = { value: string; label: string; description: string; disabled: boolean; checked: boolean };

/** The name of the select-all checkbox when `select-all-label` gives none, as in React. */
const ALL_LABEL = 'All';

/**
 * A group of checkboxes that allows users to choose one or more items from a list or turn an feature on or off.
 *
 * Each option is a `pttrn-checkbox-group-item` child; the group draws them all as native checkboxes sharing one name in
 * its own shadow root. Name the group with `aria-label`, or with `label`, which renders the CheckboxGroupField parts: a
 * fieldset named by its legend, with `helper-text` or `error-message` under the options, which reach every checkbox. It
 * is a form control: it submits each checked value under `name` with its form, `required` blocks submission until an
 * option is checked, and a form reset goes back to the items' `checked` attributes.
 *
 * React prop to Web Component mapping:
 *
 * - `options` → `pttrn-checkbox-group-item` children (`value`, `label`, `description`, `disabled`).
 * - `value` → the `checked` attribute of the items, or the `value` property (an array) from script.
 * - `selectAll` → `select-all`; `selectAllProps` → `select-all-label` and `select-all-description`.
 * - `name`, `disabled`, `invalid`, `required`, aria-label → attributes of the same name.
 * - `onChange(values)` → the `pttrn-change` event (`detail.value` is the new array) and a `change` event.
 * - CheckboxGroupField's `label`, `helperText`, `errorMessage`, `labelTrailing` → `label`, `helper-text`,
 *   `error-message`, `label-trailing` on this element.
 *
 * @fires {CustomEvent<{ value: string[] }>} pttrn-change - After the user toggles an option or the select-all checkbox.
 *   `detail.value` is the values now checked.
 * @fires {Event} change - With `pttrn-change`, so code that listens for the native event works too.
 * @element pttrn-checkbox-group
 * @slot - `pttrn-checkbox-group-item` elements, one per option.
 */
export class PttrnCheckboxGroup extends FieldControl {
    static properties = {
        selectAll: { type: Boolean, reflect: true, attribute: 'select-all' },
        selectAllLabel: { type: String, attribute: 'select-all-label' },
        selectAllDescription: { type: String, attribute: 'select-all-description' },
    };

    static styles = styles;

    /** Adds an "All" checkbox before the options: checked when every enabled option is, mixed when some are. */
    declare selectAll: boolean;
    /** The label of the select-all checkbox. */
    declare selectAllLabel: string;
    /** A description under the select-all label. */
    declare selectAllDescription: string;

    constructor() {
        super();
        this.selectAll = false;
        this.selectAllLabel = ALL_LABEL;
        this.selectAllDescription = '';
    }

    /** The values of the checked options. Setting it checks exactly the options whose values it lists. */
    get value(): string[] {
        return this._items.filter((item) => item.checked).map((item) => item.value);
    }

    set value(values: string[]) {
        const chosen = new Set(values ?? []);
        for (const item of this._items) item.checked = chosen.has(item.value);
        this.requestUpdate();
    }

    private get _items() {
        return [...this.children].filter(
            (child): child is PttrnCheckboxGroupItem => child.localName === 'pttrn-checkbox-group-item',
        );
    }

    private get _options(): Option[] {
        return this._items.map((item) => ({
            value: item.value ?? '',
            label: item.label ?? '',
            description: item.description ?? '',
            disabled: !!item.disabled,
            checked: !!item.checked,
        }));
    }

    protected _formValue() {
        const values = this.value;
        if (!this.name || !values.length) return null;
        const data = new FormData();
        for (const value of values) data.append(this.name, value);
        return data;
    }

    protected _resetValue() {
        for (const item of this._items) item.checked = item.defaultChecked;
        this.requestUpdate();
    }

    formStateRestoreCallback(state: string | File | FormData | null) {
        if (state instanceof FormData) this.value = state.getAll(this.name).map(String);
    }

    /** Required means at least one option is checked; the first enabled checkbox carries the browser's message. */
    protected _syncValidity() {
        const first = this.renderRoot?.querySelector<HTMLInputElement>('input[data-option]:not(:disabled)');
        if (!this.required || this.value.length || !first) {
            this._internals.setValidity({});
            return;
        }
        this._internals.setValidity({ valueMissing: true }, first.validationMessage || 'Check an option.', first);
    }

    private _toggle(option: Option, checked: boolean) {
        const item = this._items.find((candidate) => candidate.value === option.value);
        if (item) item.checked = checked;
        this._changed();
    }

    private _toggleAll(checked: boolean) {
        // The React select-all chooses every enabled option, or none.
        for (const item of this._items) item.checked = checked && !item.disabled;
        this._changed();
    }

    private _changed() {
        this.requestUpdate();
        this._emitChange(this.value);
    }

    private _renderCheckbox({
        checked,
        disabled,
        indeterminate = false,
        label,
        description,
        value,
        option,
        onChange,
    }: {
        checked: boolean;
        disabled: boolean;
        indeterminate?: boolean;
        label: string;
        description: string;
        value: string;
        option: boolean;
        onChange: (checked: boolean) => void;
    }) {
        const aria = this._controlAria;
        return html`<label
            data-pttrn="list-item"
            data-pttrn-owner="checkbox-option"
            data-width="hug"
            ?data-disabled=${disabled}
        >
            <span data-leading>
                <span data-pttrn="checkbox">
                    <input
                        aria-errormessage=${aria.errorMessage}
                        aria-invalid=${aria.invalid}
                        aria-label=${description ? `${label} - ${description}` : label}
                        name=${this.name || nothing}
                        type="checkbox"
                        .checked=${live(checked)}
                        .indeterminate=${live(indeterminate)}
                        .value=${value}
                        ?data-indeterminate=${indeterminate}
                        ?data-option=${option}
                        ?data-select-all=${!option}
                        ?disabled=${disabled}
                        ?required=${option && this.required}
                        @change=${(event: Event) => onChange((event.target as HTMLInputElement).checked)}
                    />
                    ${checkboxBox(checked, indeterminate)}
                </span>
            </span>
            <span data-item-label>
                <span data-text data-truncated>${label}</span>
                ${description ? html`<span data-sub-text>${description}</span>` : nothing}
            </span>
        </label>`;
    }

    render() {
        const aria = this._controlAria;
        const options = this._options;
        const available = options.filter((option) => !option.disabled);
        const count = options.filter((option) => option.checked).length;

        const group = html`<div
            aria-describedby=${aria.describedBy}
            aria-label=${aria.label}
            data-pttrn="checkbox-group"
            role="group"
        >
            ${
                this.selectAll
                    ? this._renderCheckbox({
                          checked: !!count && count === available.length,
                          indeterminate: !!count && count < available.length,
                          disabled: this._isDisabled,
                          label: this.selectAllLabel || ALL_LABEL,
                          description: this.selectAllDescription,
                          value: 'all',
                          option: false,
                          onChange: (checked) => this._toggleAll(checked),
                      })
                    : nothing
            }
            ${options.map((option) =>
                this._renderCheckbox({
                    ...option,
                    disabled: this._isDisabled || option.disabled,
                    option: true,
                    onChange: (checked) => this._toggle(option, checked),
                }),
            )}
        </div>`;

        // The options are read from the children; the hidden slot only reports when they change.
        return html`${this._renderField(group, { fieldset: true })}<slot
                hidden
                @slotchange=${() => this.requestUpdate()}
            ></slot>`;
    }
}

define('pttrn-checkbox-group', PttrnCheckboxGroup);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-checkbox-group': PttrnCheckboxGroup;
    }
}
