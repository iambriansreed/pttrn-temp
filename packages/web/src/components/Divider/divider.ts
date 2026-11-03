import { LitElement, html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { define } from '../../utils/define';
import styles from './divider.scss';

const insetToVariable = (insetProp: number | string) => {
    const inset = Number(insetProp);
    if (Number.isNaN(inset) || inset < 1 || inset > 12) return '0px';
    return `calc(var(--usa-spacing-05) * ${inset})`;
};

/**
 * Horizontal thin lines that separates grouped content in a list or other containers with an optional section/group
 * label.
 *
 * Vertical thin lines that separates grouped content or other visual elements within a container.
 *
 * React to Web Component: `orientation`, `thickness` and `inset` are attributes of the same name. `padding` defaults to
 * true in React, and an HTML boolean attribute cannot, so it is `hide-padding` here.
 *
 * The line is decorative: a separator hidden from assistive technology, as in React. Grouping that matters to a
 * listener comes from headings or list structure.
 *
 * @element pttrn-divider
 */
export class PttrnDivider extends LitElement {
    static properties = {
        orientation: { type: String },
        thickness: { type: String },
        hidePadding: { type: Boolean, attribute: 'hide-padding' },
        inset: { type: Number },
    };

    static styles = styles;

    /** The direction of the line. A vertical line fills the height of its row. */
    declare orientation: 'horizontal' | 'vertical';
    /** The weight of the line. A heavy line also has more padding and round ends. */
    declare thickness: 'heavy' | 'light';
    /** Removes the space on either side of the line. */
    declare hidePadding: boolean;
    /**
     * Shortens the line at both ends, from 0 to 12 in steps of the USWDS half unit (`--usa-spacing-05`, 4px): left and
     * right when horizontal, top and bottom when vertical. Any other value means no inset.
     */
    declare inset: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

    constructor() {
        super();
        this.orientation = 'horizontal';
        this.thickness = 'light';
        this.hidePadding = false;
        this.inset = 0;
    }

    render() {
        // A removed attribute leaves the property null; it still means the default.
        const orientation = this.orientation || 'horizontal';
        return html`<div
            aria-hidden="true"
            aria-orientation=${orientation}
            data-orientation=${orientation}
            ?data-hide-padding=${this.hidePadding}
            data-pttrn="divider"
            data-thickness=${this.thickness || 'light'}
            role="separator"
            style=${styleMap({ '--inset': insetToVariable(this.inset) })}
        ></div>`;
    }
}

define('pttrn-divider', PttrnDivider);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-divider': PttrnDivider;
    }
}
