import { LitElement, PropertyValues, css } from 'lit';
import { define } from '../../utils/define';

/**
 * One result a `pttrn-search-bar` can offer. It renders nothing itself: the search bar draws the results that match the
 * query in its own list.
 *
 * @element pttrn-search-bar-item
 */
export class PttrnSearchBarItem extends LitElement {
    static properties = {
        label: { type: String, reflect: true },
    };

    static styles = css`
        :host {
            display: none;
        }
    `;

    /** The text of the result, matched against the query and given to the field when chosen. */
    declare label: string;

    constructor() {
        super();
        this.label = '';
    }

    protected updated(changed: PropertyValues) {
        super.updated(changed);
        // The search bar reads the items from their attributes; tell it to draw them again.
        (this.parentElement as { requestUpdate?: () => void } | null)?.requestUpdate?.();
    }

    render() {
        return null;
    }
}

define('pttrn-search-bar-item', PttrnSearchBarItem);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-search-bar-item': PttrnSearchBarItem;
    }
}
