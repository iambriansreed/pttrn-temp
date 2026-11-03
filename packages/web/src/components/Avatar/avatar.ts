import person from '@ptrn/icons/Person.svg';
import { LitElement, html, nothing } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { TooltipController } from '../../internal/tooltip';
import { define } from '../../utils/define';
import styles from './avatar.scss';

/** Up to two initials, given or taken from the first letters of the first two words of the name. */
export function avatarInitials(name: string, initials?: string) {
    const fromName = name
        ? name
              .split(' ')
              .map((word) => word.charAt(0))
              .slice(0, 2)
              .join('')
              .toUpperCase()
        : '';
    return (initials || fromName).slice(0, 2) || undefined;
}

/**
 * An avatar is a visual representation of a user or entity. It can be used to display an initials, icon, or image.
 *
 * React to Web Component: `name`, `size`, `color`, `initials`, `image`, `focusable` and `disabled` are attributes of
 * the same name, and `showIcon` and `hideTooltip` are `show-icon` and `hide-tooltip`. React makes an avatar a button
 * when it has `onClick`; an element cannot tell that a listener exists, so here the `clickable` attribute makes it a
 * button, and a click, or Enter or Space on it, fires the native `click` event on the element.
 *
 * The image, else the person icon, else the initials show, all hidden from assistive technology: the name is the
 * avatar's accessible name, read from its tooltip while one shows. A clickable avatar showing initials is named
 * "<initials>, <name>" and described by the tooltip, so the visible initials are part of its name.
 *
 * @element pttrn-avatar
 */
export class PttrnAvatar extends LitElement {
    static properties = {
        name: { type: String },
        size: { type: String },
        color: { type: String },
        initials: { type: String },
        showIcon: { type: Boolean, attribute: 'show-icon' },
        image: { type: String },
        hideTooltip: { type: Boolean, attribute: 'hide-tooltip' },
        focusable: { type: Boolean },
        clickable: { type: Boolean },
        disabled: { type: Boolean, reflect: true },
    };

    static styles = styles;

    /** The name of the person or entity, read by assistive technology and shown in the tooltip. */
    declare name: string;
    /** The size of the avatar. */
    declare size:
        'large' | 'medium' | 'small' | 'x-large' | 'x-small' | 'xx-large' | 'xxx-large' | 'xxxx-large' | 'xxxxx-large';
    /** The color of the avatar, one of the USWDS theme color families. */
    declare color:
        'accent-cool' | 'accent-warm' | 'base' | 'error' | 'info' | 'primary' | 'secondary' | 'success' | 'warning';
    /**
     * Up to two initials to show. By default they are the first letters of the first two words of the name: one for a
     * single-word name.
     */
    declare initials: string;
    /** Shows the person icon instead of the initials. An image wins over both. */
    declare showIcon: boolean;
    /** The URL of an image to show instead of the icon or initials. */
    declare image: string;
    /** Leaves out the tooltip with the name. */
    declare hideTooltip: boolean;
    /** Lets keyboard users reach an avatar that is not clickable, so its tooltip can show. */
    declare focusable: boolean;
    /** Makes the avatar a button: focusable, and a click, Enter or Space fires `click` on the element. */
    declare clickable: boolean;
    /** Dims the avatar, and keeps a clickable one from being clicked or focused. */
    declare disabled: boolean;

    private readonly _tooltip = new TooltipController(this, () =>
        this.shadowRoot?.querySelector<HTMLElement>('[data-pttrn="avatar"]'),
    );

    constructor() {
        super();
        this.name = '';
        this.size = 'small';
        this.color = 'base';
        this.initials = '';
        this.showIcon = false;
        this.image = '';
        this.hideTooltip = false;
        this.focusable = false;
        this.clickable = false;
        this.disabled = false;
    }

    /** A disabled avatar swallows the click before it leaves the shadow root, so no listener sees it. */
    private _onClick(event: MouseEvent) {
        if (!this.disabled) return;
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    /** Enter and Space activate a clickable avatar, as they do a button. */
    private _onKeyDown(event: KeyboardEvent) {
        if (!this.clickable || this.disabled || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        (event.currentTarget as HTMLElement).click();
    }

    render() {
        const name = this.name ?? '';
        const initials = this.image || this.showIcon ? undefined : avatarInitials(name, this.initials ?? '');

        let content;
        if (this.image) content = html`<img alt=${name} aria-hidden="true" src=${this.image} />`;
        else if (this.showIcon) content = html`<span aria-hidden="true" data-icon>${unsafeSVG(person)}</span>`;
        else if (initials) content = html`<span aria-hidden="true" data-initials>${initials}</span>`;
        if (!content) return nothing;

        const interactive = this.clickable;
        const tooltip = !this.hideTooltip && !!name;
        // A clickable avatar that shows initials carries them in its name (WCAG 2.5.3, Label in Name); its tooltip then
        // describes it. Otherwise the tooltip is the name.
        const initialsInName = interactive && !!initials;
        const label = initialsInName ? `${initials}, ${name}` : name;
        const tabIndex = interactive ? (this.disabled ? undefined : 0) : this.focusable ? 0 : undefined;

        return html`<div
                aria-describedby=${tooltip && initialsInName ? this._tooltip.id : nothing}
                aria-disabled=${this.disabled ? 'true' : nothing}
                aria-label=${label}
                aria-labelledby=${tooltip && !initialsInName ? this._tooltip.id : nothing}
                aria-roledescription="person"
                data-color=${this.color || 'base'}
                data-pttrn="avatar"
                data-size=${this.size || 'small'}
                role=${interactive ? 'button' : 'img'}
                tabindex=${tabIndex ?? nothing}
                @blur=${tooltip ? this._tooltip.hide : nothing}
                @click=${this._onClick}
                @focus=${tooltip ? this._tooltip.show : nothing}
                @keydown=${this._onKeyDown}
                @mouseleave=${tooltip ? this._tooltip.hide : nothing}
                @mouseover=${tooltip ? this._tooltip.show : nothing}
            >
                ${content}
            </div>
            ${tooltip ? this._tooltip.render(name) : nothing}`;
    }
}

define('pttrn-avatar', PttrnAvatar);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-avatar': PttrnAvatar;
    }
}
