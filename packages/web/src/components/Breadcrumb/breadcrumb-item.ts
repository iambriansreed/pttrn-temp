import { LitElement } from 'lit';
import { define } from '../../utils/define';

/**
 * One page of a `pttrn-breadcrumb` trail. It renders nothing itself: the breadcrumb reads its `label` and `href` and
 * draws the trail, so the links, the overflow menu and the button that opens it share one shadow root.
 *
 * @element pttrn-breadcrumb-item
 */
export class PttrnBreadcrumbItem extends LitElement {
    static properties = {
        label: { type: String, reflect: true },
        href: { type: String, reflect: true },
    };

    /** The text of the crumb. */
    declare label: string;
    /** Where the crumb leads. The last item is the current page and is not a link. */
    declare href: string;

    constructor() {
        super();
        this.label = '';
        this.href = '';
    }

    createRenderRoot() {
        // Nothing to render, and no shadow root: the item is data for its breadcrumb and hidden by it.
        return this;
    }
}

define('pttrn-breadcrumb-item', PttrnBreadcrumbItem);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-breadcrumb-item': PttrnBreadcrumbItem;
    }
}
