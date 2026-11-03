import chevronRight from '@ptrn/icons/ChevronRight.svg';
import moreHoriz from '@ptrn/icons/MoreHoriz.svg';
import { LitElement, html, nothing } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { define } from '../../utils/define';
import { autoUpdate, place } from '../../utils/floating';
import { uniqueId } from '../../utils/id';
import '../Tooltip/tooltip';
import './breadcrumb-item';
import type { PttrnBreadcrumbItem } from './breadcrumb-item';
import styles from './breadcrumb.scss';

type Crumb = { label: string; href: string };

/** The chevron between crumbs, hidden from assistive technology as in React. */
const chevron = unsafeSVG(chevronRight.replace('<svg', '<svg aria-hidden="true"'));

/** More pages than this fold the middle ones into a menu. */
const FOLD_AFTER = 5;

/**
 * Used to indicate the current page's location within a navigational hierarchy.
 *
 * Every page but the last is a link; the last is the current page, as text marked `aria-current`. With more than five
 * pages the middle ones fold into a "Show N more pages" menu button. With fewer than two pages nothing renders.
 *
 * React to Web Component mapping:
 *
 * - `items` → `pttrn-breadcrumb-item` children, each with `label` and `href`
 * - `variant` → `variant` (`subtle`, `subtle-inverse`; the link color)
 * - `scrollLimit` → `scroll-limit`
 * - `id` → `id` on the element (the menu's id is internal)
 *
 * @element pttrn-breadcrumb
 * @slot - `pttrn-breadcrumb-item` elements, first page first.
 */
export class PttrnBreadcrumb extends LitElement {
    static properties = {
        variant: { type: String, reflect: true },
        scrollLimit: { type: Number, attribute: 'scroll-limit' },
        _items: { state: true },
        _open: { state: true },
        _active: { state: true },
    };

    static styles = styles;

    /** The color of the links: the default link color, `subtle` (body text) or `subtle-inverse` (for dark surfaces). */
    declare variant: 'default' | 'subtle' | 'subtle-inverse' | undefined;
    /** The most folded pages the overflow menu shows before it scrolls. */
    declare scrollLimit: number | undefined;
    declare _items: Crumb[];
    declare _open: boolean;
    /** The index of the focused page in the overflow menu. */
    declare _active: number;

    private readonly _menuId = uniqueId('pttrn-breadcrumb-menu');
    private _stopUpdates: (() => void) | null = null;
    private readonly _observer = new MutationObserver(() => this._readItems());

    constructor() {
        super();
        this.variant = undefined;
        this.scrollLimit = undefined;
        this._items = [];
        this._open = false;
        this._active = 0;
    }

    connectedCallback() {
        super.connectedCallback();
        this._observer.observe(this, { subtree: true, attributes: true, attributeFilter: ['label', 'href'] });
        this._readItems();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._observer.disconnect();
        this._close();
    }

    private _readItems() {
        this._items = [...this.querySelectorAll<PttrnBreadcrumbItem>(':scope > pttrn-breadcrumb-item')].map((item) => ({
            label: item.getAttribute('label') ?? '',
            href: item.getAttribute('href') ?? '',
        }));
    }

    private get _folded() {
        return this._items.length > FOLD_AFTER ? this._items.slice(1, -1) : [];
    }

    private get _button() {
        return this.renderRoot.querySelector<HTMLButtonElement>('[data-overflow]');
    }

    private get _menu() {
        return this.renderRoot.querySelector<HTMLElement>('[role="menu"]');
    }

    private _openMenu() {
        this._active = 0;
        this._open = true;
    }

    private _close(refocus = false) {
        if (!this._open) return;
        this._open = false;
        if (refocus) this._button?.focus();
    }

    protected updated(changed: Map<string, unknown>) {
        if (changed.has('_open')) {
            if (this._open) this._showMenu();
            else this._hideMenu();
        }
        if (this._open && (changed.has('_active') || changed.has('_open'))) {
            const item = this._menu?.querySelectorAll<HTMLElement>('[role="menuitem"]')[this._active];
            item?.focus();
            item?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
        if (this._open && !this._folded.length) this._open = false;
    }

    private _showMenu() {
        const menu = this._menu;
        const button = this._button;
        if (!menu || !button) return;
        menu.showPopover();
        const update = () => place(button, menu, { placement: 'bottom-start', offset: 4 });
        update();
        this._stopUpdates = autoUpdate(button, menu, update);
        document.addEventListener('mousedown', this._onDocumentMouseDown);
    }

    private _hideMenu() {
        this._stopUpdates?.();
        this._stopUpdates = null;
        document.removeEventListener('mousedown', this._onDocumentMouseDown);
    }

    /** A click outside the button and the menu closes the menu. */
    private readonly _onDocumentMouseDown = (event: MouseEvent) => {
        const path = event.composedPath();
        if (path.includes(this._menu as EventTarget) || path.includes(this._button as EventTarget)) return;
        this._close();
    };

    /** Tabbing away (focus leaving both the button and the menu) closes the menu. */
    private _onFocusOut(event: FocusEvent) {
        const next = event.relatedTarget as Node | null;
        if (next && (this._menu?.contains(next) || this._button?.contains(next))) return;
        this._close();
    }

    private _onButtonKeyDown(event: KeyboardEvent) {
        if (event.key === 'ArrowDown' && !this._open) {
            event.preventDefault();
            this._openMenu();
        }
    }

    private _onMenuKeyDown(event: KeyboardEvent) {
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
        if (step) {
            const count = this._folded.length;
            this._active = (this._active + step + count) % count;
        } else if (event.key === 'Escape') {
            this._close(true);
        } else {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
    }

    private _link({ label, href }: Crumb) {
        return html`<a
            data-link
            data-subtle=${this.variant === 'subtle' || nothing}
            data-subtle-inverse=${this.variant === 'subtle-inverse' || nothing}
            href=${href}
            target="_self"
            ><span>${label}</span></a
        >`;
    }

    private _overflow(folded: Crumb[]) {
        const label = `${folded.length} more pages`;
        const limit = Number(this.scrollLimit);
        const scrolls = limit > 0 && limit <= folded.length;
        return html`<li>
            <pttrn-tooltip label=${`Show ${label}`} placement="top">
                <button
                    aria-controls=${this._open ? this._menuId : nothing}
                    aria-expanded=${this._open}
                    aria-haspopup="menu"
                    data-overflow
                    data-size="small"
                    data-variant="tertiary"
                    type="button"
                    @click=${() => (this._open ? this._close() : this._openMenu())}
                    @focusout=${this._onFocusOut}
                    @keydown=${this._onButtonKeyDown}
                >
                    <span aria-hidden="true" data-button-icon>${unsafeSVG(moreHoriz)}</span>
                    <span aria-hidden="true" data-touch-target></span>
                </button>
            </pttrn-tooltip>
            ${
                this._open
                    ? html`<div
                          aria-label=${label}
                          id=${this._menuId}
                          popover="manual"
                          role="menu"
                          style=${scrolls ? `max-height: calc(var(--list-item-height) * ${limit})` : nothing}
                          @focusout=${this._onFocusOut}
                          @keydown=${this._onMenuKeyDown}
                      >
                          ${folded.map(
                              (item, index) =>
                                  html`<a
                                      data-action
                                      data-active=${index === this._active || nothing}
                                      data-list-item
                                      href=${item.href}
                                      role="menuitem"
                                      tabindex=${index === this._active ? 0 : -1}
                                      ><span data-item-label><span data-text>${item.label}</span></span></a
                                  >`,
                          )}
                      </div>`
                    : nothing
            }
            ${chevron}
        </li>`;
    }

    render() {
        const slot = html`<slot hidden @slotchange=${() => this._readItems()}></slot>`;
        const items = this._items;
        if (items.length < 2) return slot;

        const first = items[0];
        const last = items[items.length - 1];
        const folded = this._folded;

        return html`
            <nav aria-label="Breadcrumb" data-pttrn="breadcrumb">
                <ol>
                    <li>${this._link(first)}${chevron}</li>
                    ${
                        folded.length
                            ? this._overflow(folded)
                            : items.slice(1, -1).map((item) => html`<li>${this._link(item)}${chevron}</li>`)
                    }
                    <li aria-current="true"><span data-current>${last.label}</span></li>
                </ol>
            </nav>
            ${slot}
        `;
    }
}

define('pttrn-breadcrumb', PttrnBreadcrumb);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-breadcrumb': PttrnBreadcrumb;
    }
}
