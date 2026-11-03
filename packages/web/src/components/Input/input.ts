import { html } from 'lit';
import { define } from '../../utils/define';
import { InputBase } from '../../utils/input-base';
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
export class PttrnInput extends InputBase {
    static properties = {
        type: { type: String },
        autocomplete: { type: String },
        hideClearButton: { type: Boolean, attribute: 'hide-clear-button' },
        _hasLeading: { state: true },
        _hasTrailing: { state: true },
    };

    static styles = styles;

    /** The type of the native input. */
    declare type: 'number' | 'password' | 'text';
    /** Whether the browser may offer to fill the field. */
    declare autocomplete: 'off' | 'on';
    /** Hides the button that clears the field. Keep it unless there is a reason not to. */
    declare hideClearButton: boolean;
    declare _hasLeading: boolean;
    declare _hasTrailing: boolean;

    constructor() {
        super();
        this.type = 'text';
        this.autocomplete = 'off';
        this.hideClearButton = false;
        this._hasLeading = false;
        this._hasTrailing = false;
    }

    private _onSlotChange(event: Event, key: '_hasLeading' | '_hasTrailing') {
        this[key] = (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
    }

    render() {
        return this._renderField(
            this._renderInputBox({
                type: this.type,
                autocomplete: this.autocomplete,
                clearable: !this.hideClearButton,
                leading: html`<slot
                    name="leading"
                    @slotchange=${(e: Event) => this._onSlotChange(e, '_hasLeading')}
                ></slot>`,
                leadingHidden: !this._hasLeading,
                trailing: html`<slot
                    name="trailing"
                    @slotchange=${(e: Event) => this._onSlotChange(e, '_hasTrailing')}
                ></slot>`,
                trailingHidden: !this._hasTrailing,
            }),
        );
    }
}

define('pttrn-input', PttrnInput);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-input': PttrnInput;
    }
}
