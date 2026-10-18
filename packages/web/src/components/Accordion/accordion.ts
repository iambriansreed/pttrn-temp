import { LitElement, html } from 'lit';
import { define } from '../../utils/define';
import { AccordionToggleDetail, PtrnAccordionItem } from './accordion-item';
import styles from './accordion.scss';

/**
 * A vertical stack of collapsible panels that allows customers to expand or collapse each panel individually to reveal
 * or hide their content.
 *
 * @element ptrn-accordion
 * @slot - `ptrn-accordion-item` elements.
 */
export class PtrnAccordion extends LitElement {
    static properties = {
        multiple: { type: Boolean, reflect: true },
    };

    static styles = styles;

    /** Lets more than one panel stay open. By default opening a panel closes the others. */
    declare multiple: boolean;

    constructor() {
        super();
        this.multiple = false;
        this.addEventListener('ptrn-toggle', (event) => this._onToggle(event as CustomEvent<AccordionToggleDetail>));
    }

    private _onToggle(event: CustomEvent<AccordionToggleDetail>) {
        const item = event.target as PtrnAccordionItem;
        if (this.multiple || !event.detail.open || item.parentElement !== this) return;
        this.querySelectorAll<PtrnAccordionItem>(':scope > ptrn-accordion-item').forEach((other) => {
            if (other !== item) other.open = false;
        });
    }

    render() {
        return html`<slot></slot>`;
    }
}

define('ptrn-accordion', PtrnAccordion);

declare global {
    interface HTMLElementTagNameMap {
        'ptrn-accordion': PtrnAccordion;
    }
}
