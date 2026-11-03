import { PropertyDeclarations, html, nothing } from 'lit';
import { define } from '../../utils/define';
import { PttrnTabListItemBase } from '../SegmentedControl/tab-list';
import styles from './tab-group-item.scss';

/**
 * One tab of a `pttrn-tab-group`: the tab itself, with an optional icon and badge count.
 *
 * @element pttrn-tab-group-item
 * @slot icon - An SVG shown before the label while the tab is not selected.
 * @slot icon-selected - An SVG shown instead while the tab is selected.
 */
export class PttrnTabGroupItem extends PttrnTabListItemBase {
    static properties: PropertyDeclarations = {
        badge: { type: Number },
    };

    static styles = styles;

    /** A count shown in a badge after the label, unless the tab is disabled. Above 99 it reads 99+. */
    declare badge: number | undefined;

    constructor() {
        super();
        this.badge = undefined;
    }

    render() {
        const badge = this.badge && !this.disabled ? (this.badge > 99 ? '99+' : String(this.badge)) : '';
        return html`<span data-tab
            >${this.renderIcons()}<span data-label>${this.label}</span>${
                badge ? html`<sup data-badge>${badge}</sup>` : nothing
            }</span
        >`;
    }
}

define('pttrn-tab-group-item', PttrnTabGroupItem);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-tab-group-item': PttrnTabGroupItem;
    }
}
