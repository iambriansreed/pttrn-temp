import { LitElement, html } from 'lit';
import { define } from '../../utils/define';
import styles from './card.scss';

/**
 * Cards are often rectangular and contain various content, such as text, images, icons, multimedia, and interactive
 * elements.
 *
 * They are similar in size and shape to playing cards and are intended to encourage users to click or tap to view more
 * details.
 *
 * React prop to Web Component mapping:
 *
 * - `children` → the default slot.
 * - `variant` → `variant` attribute.
 * - Other props (`style`, `role`, aria-labelledby, `data-*`) and `innerRef` → the element itself, which is the card: set
 *   attributes on it and hold a reference to it.
 *
 * @element pttrn-card
 * @slot - The content of the card.
 */
export class PttrnCard extends LitElement {
    static properties = {
        variant: { type: String, reflect: true },
    };

    static styles = styles;

    /** How the card's edge appears: a shadow (`elevated`) or a border (`outlined`). */
    declare variant: 'elevated' | 'outlined';

    constructor() {
        super();
        this.variant = 'elevated';
    }

    render() {
        return html`<slot></slot>`;
    }
}

define('pttrn-card', PttrnCard);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-card': PttrnCard;
    }
}
