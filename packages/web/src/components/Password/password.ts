import { html } from 'lit';
import { define } from '../../utils/define';
import { InputBase } from '../../utils/input-base';
import styles from './password.scss';

/**
 * An input field that is specifically built with a show/hide toggle for entering security passwords.
 *
 * The toggle reads "Show", then "Hide", and is left out while the field is disabled or read-only. The field never
 * offers the clear button or autocomplete. It needs a name: `label` (the visible label a Field gives the React
 * Password) or `aria-label`. It is a form control: it submits `name` and `value` with its form, mirrors the native
 * input's validity, and goes back to its `value` attribute on form reset.
 *
 * @fires {CustomEvent<{ value: string }>} pttrn-change - After the user types. `detail.value` is the new value.
 * @fires {Event} change - With `pttrn-change`, so code that listens for the native event works too.
 * @element pttrn-password
 */
export class PttrnPassword extends InputBase {
    static properties = {
        _showing: { state: true },
    };

    static styles = styles;

    declare _showing: boolean;

    constructor() {
        super();
        this._showing = false;
    }

    private _toggle() {
        if (this._isDisabled || this.readOnly) return;
        this._showing = !this._showing;
    }

    render() {
        const locked = this._isDisabled || this.readOnly;
        const label = this._showing ? 'Hide' : 'Show';
        // The toggle is a medium tertiary Button whatever the field size, as in React.
        const toggle = html`<button
            aria-label=${label}
            data-button
            data-size="medium"
            data-toggle-visibility-button
            data-variant="tertiary"
            type="button"
            @click=${this._toggle}
        >
            <span data-button-label>${label}</span>
            <span aria-hidden="true" data-touch-target></span>
        </button>`;

        return this._renderField(
            this._renderInputBox({
                type: this._showing ? 'text' : 'password',
                autocomplete: 'off',
                owner: 'password',
                trailing: locked ? undefined : toggle,
            }),
        );
    }
}

define('pttrn-password', PttrnPassword);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-password': PttrnPassword;
    }
}
