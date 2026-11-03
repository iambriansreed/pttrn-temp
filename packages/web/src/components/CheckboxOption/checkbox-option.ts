import { html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { PttrnCheckbox } from '../Checkbox/checkbox';
import { checkboxBox } from '../../utils/checkbox-box';
import { define } from '../../utils/define';
import styles from './checkbox-option.scss';

/**
 * A control that allows users to choose one or more items from a list or turn an feature on or off.
 *
 * If only a checkbox is needed, consider using the pttrn-checkbox element directly.
 *
 * React prop to Web Component mapping:
 *
 * - `label`, `description` → attributes of the same name. The checkbox is named by the label, and by the label and the
 *   description together when there is one.
 * - The props of Checkbox (`checked`, `indeterminate`, `disabled`, `invalid`, `required`, `name`, `value`, `onChange`) →
 *   as on pttrn-checkbox: the same attributes, the `pttrn-change` and `change` events, and the form participation.
 * - `style` → the element's own `style`.
 *
 * @fires {CustomEvent<{ checked: boolean }>} pttrn-change - After the user toggles the checkbox. `detail.checked` is
 *   the new state.
 * @fires {Event} change - After the user toggles the checkbox, as a native checkbox fires it.
 * @element pttrn-checkbox-option
 */
export class PttrnCheckboxOption extends PttrnCheckbox {
    static properties = {
        ...PttrnCheckbox.properties,
        label: { type: String },
        description: { type: String },
    };

    static styles = styles;

    /** The label of the option, and the accessible name of the checkbox. */
    declare label: string;
    /** A second line under the label, added to the accessible name. */
    declare description: string;

    constructor() {
        super();
        this.label = '';
        this.description = '';
    }

    render() {
        const name = this.description ? `${this.label} - ${this.description}` : this.label;
        return html`<label
            data-disabled=${ifDefined(this._isDisabled ? '' : undefined)}
            data-pttrn="list-item"
            data-pttrn-owner="checkbox-option"
            data-width="hug"
        >
            <span data-leading>
                <span data-pttrn="checkbox">
                    ${this._renderInput(this.accessibleLabel || name)} ${checkboxBox(this.checked, this.indeterminate)}
                </span>
            </span>
            <span data-item-label>
                <span data-text data-truncated>${this.label}</span>
                ${this.description ? html`<span data-sub-text>${this.description}</span>` : nothing}
            </span>
        </label>`;
    }
}

define('pttrn-checkbox-option', PttrnCheckboxOption);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-checkbox-option': PttrnCheckboxOption;
    }
}
