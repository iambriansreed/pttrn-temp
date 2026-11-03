import { PropertyDeclarations, html } from 'lit';
import { define } from '../../utils/define';
import { TooltipController, tooltipTemplate } from '../../utils/tooltip-controller';
import { PttrnTabListItemBase } from './tab-list';
import styles from './segmented-control-item.scss';

/**
 * One segment of a `pttrn-segmented-control`: the tab itself. With the control's `icons-only`, the label is hidden,
 * still names the segment, and shows as a tooltip while the segment is hovered or focused.
 *
 * @element pttrn-segmented-control-item
 * @slot icon - An SVG shown before the label while the segment is not selected.
 * @slot icon-selected - An SVG shown instead while the segment is selected.
 * @csspart tooltip - The tooltip of an icon-only segment.
 */
export class PttrnSegmentedControlItem extends PttrnTabListItemBase {
    static properties: PropertyDeclarations = {
        _iconsOnly: { type: Boolean, attribute: 'data-icons-only' },
    };

    static styles = styles;

    /** Set by the control (`data-icons-only`) when every segment has an icon and `icons-only` is on. */
    declare _iconsOnly: boolean;

    private readonly _tooltip = new TooltipController(this, {
        popover: () => this.renderRoot.querySelector<HTMLElement>('[data-pttrn="tooltip"]'),
    });

    constructor() {
        super();
        this._iconsOnly = false;
        this._tooltip.attach(this);
    }

    protected willUpdate() {
        this._tooltip.enabled = this._iconsOnly && !!this.label;
    }

    render() {
        if (!this._iconsOnly)
            return html`<span data-tab>${this.renderIcons()}<span data-label>${this.label}</span></span>`;
        // The label still names the tab (from its content); the tooltip repeats it for sighted users only.
        return html`<span data-tab>${this.renderIcons()}<span data-sr-only>${this.label}</span></span>
            <span aria-hidden="true">${tooltipTemplate(this.label)}</span>`;
    }
}

define('pttrn-segmented-control-item', PttrnSegmentedControlItem);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-segmented-control-item': PttrnSegmentedControlItem;
    }
}
