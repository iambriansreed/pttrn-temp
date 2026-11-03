import person from '@ptrn/icons/Person.svg';
import { LitElement, html, nothing } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { avatarInitials, type PttrnAvatar } from '../Avatar/avatar';
import { define } from '../../utils/define';
import { uniqueId } from '../../utils/id';
import styles from './avatar-group.scss';

/** The gap between the overflow button and its menu: 4px, as React's AvatarGroup. */
const OFFSET = 4;

/** The avatar attributes that show in the overflow menu; a change to one updates it. */
const ITEM_ATTRIBUTES = ['name', 'image', 'initials', 'color', 'show-icon'];

/**
 * A small avatar circle for a menu item, drawn here rather than as a nested pttrn-avatar: the item's label already
 * names the person, so the circle is decorative, and in this shadow root its aria-hidden reaches all of it.
 */
const menuAvatar = (avatar: PttrnAvatar) => {
    const initials = avatar.image || avatar.showIcon ? undefined : avatarInitials(avatar.name ?? '', avatar.initials);
    const content = avatar.image
        ? html`<img alt="" src=${avatar.image} />`
        : avatar.showIcon
          ? html`<span data-icon>${unsafeSVG(person)}</span>`
          : html`<span data-initials>${initials}</span>`;
    return html`<div aria-hidden="true" data-color=${avatar.color || 'base'} data-pttrn="avatar" data-size="small">
        ${content}
    </div>`;
};

/**
 * AvatarGroup component displays a group of avatars.
 *
 * React to Web Component: `size`, `max` and `variant` are attributes of the same name, and the `items` array is child
 * `pttrn-avatar` elements. The group gives each the group's size and puts it in the tab order so its tooltip can show.
 * Past `max`, the rest fold into a "+N" button that opens a menu of their names.
 *
 * Each menu item is named by the person's name from its text; React sets that name as aria-label, which axe flags next
 * to the visible initials (label in name), and the decorative avatar beside it is hidden.
 *
 * The overflow button is a menu button (aria-haspopup, aria-expanded, aria-controls) named "+N more avatars". Enter,
 * Space or ArrowDown open the menu with focus on its first person; ArrowUp and ArrowDown move through it, wrapping;
 * Escape closes it and returns focus to the button; a click outside or tabbing away closes it.
 *
 * @element pttrn-avatar-group
 * @slot - `pttrn-avatar` elements, one per person.
 */
export class PttrnAvatarGroup extends LitElement {
    static shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, slotAssignment: 'manual' };

    static properties = {
        size: { type: String },
        max: { type: Number },
        variant: { type: String },
        _active: { state: true },
    };

    static styles = styles;

    /** The size of every avatar in the group. */
    declare size:
        'large' | 'medium' | 'small' | 'x-large' | 'x-small' | 'xx-large' | 'xxx-large' | 'xxxx-large' | 'xxxxx-large';
    /** How many avatars show before the rest fold into the overflow menu. 3 to 5 reads best. */
    declare max: number;
    /** Overlapping avatars, or avatars spread apart. */
    declare variant: 'spread' | 'stacked';
    /** The index of the focused menu item; -1 while the menu is closed. */
    declare _active: number;

    private readonly _menuId = uniqueId('pttrn-avatar-overflow-menu');
    private readonly _observer = new MutationObserver(() => this.requestUpdate());

    constructor() {
        super();
        this.size = 'small';
        this.max = 5;
        this.variant = 'stacked';
        this._active = -1;
    }

    connectedCallback() {
        super.connectedCallback();
        this._observer.observe(this, { childList: true, subtree: true, attributeFilter: ITEM_ATTRIBUTES });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._observer.disconnect();
        this._close();
    }

    private get _open() {
        return this._active >= 0;
    }

    private _avatars() {
        return [...this.children].filter((child): child is PttrnAvatar => child.localName === 'pttrn-avatar');
    }

    private _button() {
        return this.shadowRoot?.querySelector<HTMLButtonElement>('[data-pttrn-owner="avatar-overflow"]');
    }

    private _menu() {
        return this.shadowRoot?.getElementById(this._menuId);
    }

    private _openMenu() {
        this._active = 0;
        document.addEventListener('mousedown', this._onOutsideClick);
        document.addEventListener('keydown', this._onOutsideTab);
    }

    private _close() {
        this._active = -1;
        document.removeEventListener('mousedown', this._onOutsideClick);
        document.removeEventListener('keydown', this._onOutsideTab);
    }

    /** A press outside the button and the menu closes the menu. */
    private _onOutsideClick = (event: MouseEvent) => {
        const path = event.composedPath();
        if (path.includes(this._button()!) || path.includes(this._menu()!)) return;
        this._close();
    };

    /** Tabbing out of the button and the menu closes the menu. */
    private _onOutsideTab = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return;
        setTimeout(() => {
            const focused = this.shadowRoot?.activeElement;
            if (!focused || !(focused === this._button() || this._menu()?.contains(focused))) this._close();
        }, 0);
    };

    private _onButtonClick() {
        if (this._open) this._close();
        else this._openMenu();
    }

    private _onButtonKeyDown(event: KeyboardEvent) {
        if (event.key === 'ArrowDown' && !this._open) {
            event.preventDefault();
            this._openMenu();
        }
    }

    private _onMenuKeyDown(event: KeyboardEvent, count: number) {
        const moves: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 };
        if (event.key in moves) {
            this._active = (this._active + moves[event.key] + count) % count;
        } else if (event.key === 'Escape') {
            this._close();
            this._button()?.focus();
        } else return;
        event.preventDefault();
        event.stopPropagation();
    }

    protected updated() {
        const size = this.size || 'small';
        const avatars = this._avatars();
        const shown = avatars.slice(0, Math.max(0, Math.min(this.max ?? 5, avatars.length)));
        // Each avatar takes the group's size and joins the tab order, as React's group renders them.
        for (const avatar of shown) {
            avatar.size = size;
            avatar.focusable = true;
        }
        this.shadowRoot?.querySelector('slot')?.assign(...shown);

        const menu = this._menu();
        const button = this._button();
        if (!menu || !button) return;
        if ('showPopover' in menu && !menu.matches(':popover-open')) menu.showPopover();
        this._place(menu, button);
        menu.querySelector<HTMLElement>(`[data-index="${this._active}"]`)?.focus();
    }

    /** Below the button and aligned with its start, kept inside the viewport; above when there is no room below. */
    private _place(menu: HTMLElement, button: HTMLElement) {
        const target = button.getBoundingClientRect();
        const { width, height } = menu.getBoundingClientRect();
        const below = target.bottom + OFFSET;
        const top = below + height <= window.innerHeight ? below : Math.max(0, target.top - OFFSET - height);
        const left = Math.min(target.left, Math.max(0, document.documentElement.clientWidth - width));
        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;
    }

    render() {
        const avatars = this._avatars();
        if (!avatars.length) return html`<slot></slot>`;

        // A removed attribute leaves the property null; it still means the default.
        const size = this.size || 'small';
        const max = Math.min(this.max ?? 5, avatars.length);
        const overflow = avatars.slice(Math.max(0, max));
        const count = overflow.length;
        const more = `more avatar${count > 1 ? 's' : ''}`;

        return html`<div
                data-max=${max}
                data-pttrn="avatar-group"
                data-size=${size}
                data-variant=${this.variant || 'stacked'}
            >
                <div data-wrap>
                    <slot></slot>${
                        count
                            ? html`<button
                                  aria-controls=${this._open ? this._menuId : nothing}
                                  aria-expanded=${this._open}
                                  aria-haspopup="menu"
                                  data-pttrn="avatar"
                                  data-pttrn-owner="avatar-overflow"
                                  data-size=${size}
                                  type="button"
                                  @click=${this._onButtonClick}
                                  @keydown=${this._onButtonKeyDown}
                              >
                                  <span data-overflow-count>+${count}</span><span data-sr-only> ${more}</span>
                              </button>`
                            : nothing
                    }
                </div>
            </div>
            ${
                count && this._open
                    ? html`<div
                          aria-label=${`${count} ${more}`}
                          data-pttrn-utility="menu"
                          id=${this._menuId}
                          popover="manual"
                          role="menu"
                          @keydown=${(event: KeyboardEvent) => this._onMenuKeyDown(event, count)}
                      >
                          ${overflow.map(
                              (avatar, index) =>
                                  html`<div
                                      data-index=${index}
                                      data-pttrn="list-item"
                                      role="menuitem"
                                      tabindex=${this._active === index ? 0 : -1}
                                  >
                                      <span data-leading>${menuAvatar(avatar)}</span>
                                      <span data-item-label><span data-text>${avatar.name}</span></span>
                                  </div>`,
                          )}
                      </div>`
                    : nothing
            }`;
    }
}

define('pttrn-avatar-group', PttrnAvatarGroup);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-avatar-group': PttrnAvatarGroup;
    }
}
