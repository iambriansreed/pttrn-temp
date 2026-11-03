import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { txtStyle } from './txt-variants';

/**
 * The SkeletonText placeholder: a busy status labelled "Loading" with one bar per line, sized to the text variant.
 * Shared by `pttrn-skeleton-text` and `pttrn-txt`; its styles are `styles/_skeleton-text.scss`.
 */
export function skeletonText(lines: number, variant: string) {
    const { size, lineHeight } = txtStyle(variant);
    const count = Math.max(1, Math.floor(Number(lines)) || 0);
    return html`<div
        aria-busy="true"
        aria-label="Loading"
        data-animated
        data-pttrn="skeleton-text"
        role="status"
        style=${styleMap({ '--text-height': size, '--text-margin': `calc(${lineHeight} - ${size})` })}
    >
        ${Array.from({ length: count }, () => html`<div data-line></div>`)}
    </div>`;
}
