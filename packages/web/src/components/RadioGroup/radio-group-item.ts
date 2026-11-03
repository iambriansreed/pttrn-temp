import { LitElement, PropertyValues, css } from 'lit';
import { define } from '../../utils/define';

/**
 * One option of a `pttrn-radio-group`. It renders nothing itself: the group draws every option as a native radio in its
 * own shadow root, so the radios form one keyboard group.
 *
 * @element pttrn-radio-group-item
 */
export class PttrnRadioGroupItem extends LitElement {
    static properties = {
        value: { type: String, reflect: true },
        label: { type: String, reflect: true },
        description: { type: String, reflect: true },
        disabled: { type: Boolean, reflect: true },
    };

    static styles = css`
        :host {
            display: none;
        }
    `;

    /** The value the group takes when this option is chosen. */
    declare value: string;
    /** The text of the option. */
    declare label: string;
    /** A second line under the label. */
    declare description: string;
    /** Prevents choosing this option. */
    declare disabled: boolean;

    constructor() {
        super();
        this.value = '';
        this.label = '';
        this.description = '';
        this.disabled = false;
    }

    protected updated(changed: PropertyValues) {
        super.updated(changed);
        // The group reads the options from their attributes; tell it to draw them again.
        (this.parentElement as { requestUpdate?: () => void } | null)?.requestUpdate?.();
    }

    render() {
        return null;
    }
}

define('pttrn-radio-group-item', PttrnRadioGroupItem);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-radio-group-item': PttrnRadioGroupItem;
    }
}
