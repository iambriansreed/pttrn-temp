import { LitElement, PropertyValues, css } from 'lit';
import { define } from '../../utils/define';

/**
 * One option of a `pttrn-checkbox-group`, the React `options` entry. It renders nothing itself: the group draws every
 * option as a native checkbox in its own shadow root, beside the field's helper text and error, so the aria references
 * between them stay inside one shadow root.
 *
 * @element pttrn-checkbox-group-item
 */
export class PttrnCheckboxGroupItem extends LitElement {
    static properties = {
        value: { type: String, reflect: true },
        label: { type: String, reflect: true },
        description: { type: String, reflect: true },
        disabled: { type: Boolean, reflect: true },
        checked: { type: Boolean, reflect: true },
    };

    static styles = css`
        :host {
            display: none;
        }
    `;

    /** The value the group holds, and submits, while this option is checked. */
    declare value: string;
    /** The text of the option. */
    declare label: string;
    /** A second line under the label. */
    declare description: string;
    /** Prevents toggling this option, and leaves it out of the select-all checkbox. */
    declare disabled: boolean;
    /** Whether the option is checked. The group sets it as the user toggles; the markup's state is the reset state. */
    declare checked: boolean;

    /** The `checked` attribute of the markup, which a form reset goes back to. */
    defaultChecked = false;

    constructor() {
        super();
        this.value = '';
        this.label = '';
        this.description = '';
        this.disabled = false;
        this.checked = false;
    }

    connectedCallback() {
        super.connectedCallback();
        if (!this.hasUpdated) this.defaultChecked = this.hasAttribute('checked');
    }

    protected updated(changed: PropertyValues) {
        super.updated(changed);
        // The group reads the options from these elements; tell it to draw them again.
        (this.parentElement as { requestUpdate?: () => void } | null)?.requestUpdate?.();
    }

    render() {
        return null;
    }
}

define('pttrn-checkbox-group-item', PttrnCheckboxGroupItem);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-checkbox-group-item': PttrnCheckboxGroupItem;
    }
}
