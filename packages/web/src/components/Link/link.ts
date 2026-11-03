import chevron from '@ptrn/icons/ChevronRight.svg';
import linkIcon from '@ptrn/icons/Link.svg';
import external from '@ptrn/icons/OpenInNew.svg';
import { LitElement, html, nothing } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { define } from '../../utils/define';
import styles from './link.scss';

const ICONS: Record<string, string> = { chevron, external, link: linkIcon };

/**
 * This is the standalone link component. Inline links can use the native `a` element.
 *
 * React to Web Component: `label`, `href`, `size`, `variant`, `target` and `disabled` are attributes of the same name,
 * and `trailingIcon` is `trailing-icon`. The anchor is inside the element, so it is focused, followed with Enter and
 * named by its label as a native link is.
 *
 * An external link (`trailing-icon="external"`) opens in a new tab and says so: "(opens in a new tab)" is part of its
 * accessible name. The icon is decorative.
 *
 * @element pttrn-link
 */
export class PttrnLink extends LitElement {
    static properties = {
        label: { type: String },
        href: { type: String },
        trailingIcon: { type: String, attribute: 'trailing-icon' },
        size: { type: String },
        variant: { type: String },
        target: { type: String },
        disabled: { type: Boolean, reflect: true },
    };

    static styles = styles;

    /** The text of the link. */
    declare label: string;
    /** Where the link goes. */
    declare href: string;
    /** An icon after the label. `external` also opens the link in a new tab. */
    declare trailingIcon: 'chevron' | 'external' | 'link' | undefined;
    /** The size of the text. */
    declare size: 'base' | 'large' | 'small';
    /**
     * `subtle` is the body text color, for links that are not primary actions such as footer menus; `subtle-inverse` is
     * for dark backgrounds.
     */
    declare variant: 'default' | 'subtle-inverse' | 'subtle';
    /** Where the link opens. An external link always opens in a new tab. */
    declare target: '_blank' | '_parent' | '_self' | '_top';
    /** Greys the link out and stops pointer clicks, as React's does. */
    declare disabled: boolean;

    constructor() {
        super();
        this.label = '';
        this.href = '';
        this.trailingIcon = undefined;
        this.size = 'base';
        this.variant = 'default';
        this.target = '_self';
        this.disabled = false;
    }

    render() {
        const icon = this.trailingIcon ? ICONS[this.trailingIcon] : undefined;
        const isExternal = this.trailingIcon === 'external';
        return html`<a
            data-pttrn="link"
            data-size=${this.size && this.size !== 'base' ? this.size : nothing}
            ?data-subtle=${this.variant === 'subtle'}
            ?data-subtle-inverse=${this.variant === 'subtle-inverse'}
            data-trailing-icon=${icon ? this.trailingIcon! : nothing}
            ?disabled=${this.disabled}
            href=${this.href || nothing}
            target=${isExternal ? '_blank' : this.target || '_self'}
            ><span>${this.label}</span>${
                isExternal ? html`<span data-sr-only> (opens in a new tab)</span>` : nothing
            }${icon ? html`<span aria-hidden="true" data-link-icon>${unsafeSVG(icon)}</span>` : nothing}</a
        >`;
    }
}

define('pttrn-link', PttrnLink);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-link': PttrnLink;
    }
}
