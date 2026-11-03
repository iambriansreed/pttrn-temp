import { LitElement, PropertyValues, css } from 'lit';
import { define } from '../../utils/define';

/**
 * One option of a `pttrn-select`. It renders nothing itself: the select reads its attributes and draws the option in
 * its own list, so the combobox, the list and the options share one shadow root (`aria-activedescendant` and
 * `aria-controls` cannot cross a shadow boundary). Content in the `leading` and `trailing` slots is copied into the
 * option, and into the control while the option is selected.
 *
 * @element pttrn-select-item
 * @slot leading - An icon, image or avatar before the label.
 * @slot trailing - An icon, tag or text after the label.
 */
export class PttrnSelectItem extends LitElement {
    static properties = {
        value: { type: String, reflect: true },
        label: { type: String, reflect: true },
        subText: { type: String, attribute: 'sub-text', reflect: true },
        disabled: { type: Boolean, reflect: true },
    };

    static styles = css`
        :host {
            display: none;
        }
    `;

    /** The value the select takes when this option is chosen. */
    declare value: string;
    /** The text of the option. */
    declare label: string;
    /** A second line under the label. */
    declare subText: string;
    /** Keeps the option from being chosen; the arrow keys skip it. */
    declare disabled: boolean;

    constructor() {
        super();
        this.value = '';
        this.label = '';
        this.subText = '';
        this.disabled = false;
    }

    protected updated(changed: PropertyValues) {
        super.updated(changed);
        // The select reads the options from their attributes; tell it to draw them again.
        (this.parentElement as { requestUpdate?: () => void } | null)?.requestUpdate?.();
    }

    render() {
        return null;
    }
}

define('pttrn-select-item', PttrnSelectItem);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-select-item': PttrnSelectItem;
    }
}
