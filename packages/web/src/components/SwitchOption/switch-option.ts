import { html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { PttrnSwitch } from '../Switch/switch';
import { define } from '../../utils/define';
import styles from './switch-option.scss';

/**
 * A control that allows users to choose one or more items from a list or turn an feature on or off.
 *
 * If only a switch is needed, consider using the pttrn-switch element directly.
 *
 * React prop to Web Component mapping:
 *
 * - `label`, `description` → attributes of the same name. The switch is named by the label, and by the label and the
 *   description together when there is one.
 * - The props of Switch (`checked`, `disabled`, `name`, `value`, `onChange`) → as on pttrn-switch: the same attributes,
 *   the `pttrn-change` and `change` events, and the form participation.
 * - `style` → the element's own `style`.
 *
 * @fires {CustomEvent<{ checked: boolean }>} pttrn-change - After the user toggles the switch. `detail.checked` is the
 *   new state.
 * @fires {Event} change - After the user toggles the switch, as a native checkbox fires it.
 * @element pttrn-switch-option
 */
export class PttrnSwitchOption extends PttrnSwitch {
    static properties = {
        ...PttrnSwitch.properties,
        label: { type: String },
        description: { type: String },
    };

    static styles = styles;

    /** The label of the option, and the accessible name of the switch. */
    declare label: string;
    /** A second line under the label, added to the accessible name. */
    declare description: string;

    constructor() {
        super();
        this.label = '';
        this.description = '';
    }

    render() {
        const disabled = this._isDisabled;
        const name = this.description ? `${this.label} - ${this.description}` : this.label;
        return html`<label
            data-disabled=${ifDefined(disabled ? '' : undefined)}
            data-pttrn="list-item"
            data-pttrn-owner="switch-option"
            data-width="hug"
        >
            <span data-leading>
                <span data-pttrn="switch">
                    <input
                        aria-disabled=${ifDefined(disabled ? 'true' : undefined)}
                        aria-label=${ifDefined(this.accessibleLabel || name || undefined)}
                        name=${ifDefined(this.name || undefined)}
                        role="switch"
                        type="checkbox"
                        value=${this.value}
                        .checked=${live(this.checked)}
                        ?disabled=${disabled}
                        @change=${this._onChange}
                    />
                    <span aria-hidden="true"></span>
                </span>
            </span>
            <span data-item-label>
                <span data-text data-truncated>${this.label}</span>
                ${this.description ? html`<span data-sub-text>${this.description}</span>` : nothing}
            </span>
        </label>`;
    }
}

define('pttrn-switch-option', PttrnSwitchOption);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-switch-option': PttrnSwitchOption;
    }
}
