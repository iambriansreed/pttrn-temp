import searchIcon from '@ptrn/icons/Search.svg';
import { PropertyValues, html, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { styleMap } from 'lit/directives/style-map.js';
import { define } from '../../utils/define';
import { icon } from '../../utils/icon';
import { InputBase } from '../../utils/input-base';
import styles from './search-bar.scss';
import './search-bar-item';

type Result = { id: string; label: string };

const MENU_ID = 'menu';
const NO_RESULTS_ID = 'no-results';

/**
 * An input field that allows customers to input search queries and retrieve results.
 *
 * The results are `pttrn-search-bar-item` children. Typing opens the ones whose label contains the query (any case),
 * with the first one active; ArrowDown opens them all from an empty field. The field is a combobox and focus never
 * leaves it: ArrowDown and ArrowUp move the active result, Enter chooses it and Escape closes the list until the next
 * keystroke, while ArrowLeft, ArrowRight and Space edit the text. A query without matches shows "No results found" and
 * announces it. The field needs a name: `aria-label`, or `label` for a visible one. It is a form control: it submits
 * `name` and the text with its form.
 *
 * @fires {CustomEvent<{ value: string; item?: { label: string } }>} pttrn-change - After the user types, clears the
 *   field or chooses a result. `detail.value` is the new text; `detail.item` is the result chosen, if any.
 * @fires {Event} change - With `pttrn-change`, so code that listens for the native event works too.
 * @element pttrn-search-bar
 * @slot - `pttrn-search-bar-item` elements, one per result.
 * @slot trailing - Shown after the input, before the clear button.
 */
export class PttrnSearchBar extends InputBase {
    static properties = {
        noResultsMessage: { type: String, attribute: 'no-results-message' },
        scrollLimit: { type: Number, attribute: 'scroll-limit' },
        _focused: { state: true },
        _dismissed: { state: true },
        _active: { state: true },
        _hasTrailing: { state: true },
        _announcements: { state: true },
    };

    static styles = styles;

    /** A second line under "No results found". */
    declare noResultsMessage: string;
    /** How many results show before the list scrolls. */
    declare scrollLimit: number | undefined;
    declare _focused: boolean;
    declare _dismissed: boolean;
    declare _active: string | null;
    declare _hasTrailing: boolean;
    declare _announcements: number;

    constructor() {
        super();
        this.placeholder = 'Search';
        this.noResultsMessage = '';
        this.scrollLimit = undefined;
        this._focused = false;
        this._dismissed = false;
        this._active = null;
        this._hasTrailing = false;
        this._announcements = 0;
    }

    private get _items(): Result[] {
        return [...this.children]
            .filter((child) => child.localName === 'pttrn-search-bar-item')
            .map((item, index) => ({ id: `result-${index}`, label: item.getAttribute('label') ?? '' }))
            .filter((item) => item.label);
    }

    private get _results() {
        const query = String(this.value ?? '')
            .trim()
            .toLowerCase();
        return this._items.filter((item) => !query || item.label.toLowerCase().includes(query));
    }

    private get _hasQuery() {
        return !!String(this.value ?? '').trim().length;
    }

    private get _noResults() {
        return this._hasQuery && this._results.length === 0;
    }

    /** The ids the arrow keys move through: the results, or the "No results found" row standing in for them. */
    private get _ids() {
        return this._noResults ? [NO_RESULTS_ID] : this._results.map((result) => result.id);
    }

    private get _open() {
        return this._active !== null;
    }

    /** Which row is active, from focus, dismissal and the query, as the React SearchBar works it out. */
    protected willUpdate(changed: PropertyValues) {
        super.willUpdate(changed);
        const ids = this._ids;
        if (!this._focused || this._dismissed) {
            this._active = null;
        } else if (this._noResults) {
            this._active = NO_RESULTS_ID;
        } else {
            if (this._active && !ids.includes(this._active)) this._active = ids[0] ?? null;
            if (!this._active) this._active = this._hasQuery ? (ids[0] ?? null) : null;
        }
        if (changed.has('value') && this._noResults) this._announcements += 1;
    }

    protected updated(changed: PropertyValues) {
        super.updated(changed);
        const menu = this.renderRoot.querySelector<HTMLElement>(`#${MENU_ID}`);
        if (menu) {
            const shown = menu.matches(':popover-open');
            if (this._open && !shown) menu.showPopover();
            if (!this._open && shown) menu.hidePopover();
        }
        if (changed.has('_active') && this._active) {
            this.renderRoot
                .querySelector(`#${this._active}`)
                ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        }
    }

    protected _onInput(event: Event) {
        this._dismissed = false;
        super._onInput(event);
    }

    protected _clear() {
        this._dismissed = false;
        super._clear();
    }

    private _move(step: 1 | -1) {
        const ids = this._ids;
        if (!ids.length) return;
        const index = this._active ? ids.indexOf(this._active) : -1;
        this._active = index < 0 ? ids[0] : ids[(index + step + ids.length) % ids.length];
    }

    private _choose(result: Result) {
        this.value = result.label;
        this._dismissed = true;
        this._active = null;
        this._emitChange(this.value, { item: { label: result.label } });
    }

    /** Up and Down move through the results (Down opens them); Enter and Escape act only while the list is open. */
    private _onKeyDown(event: KeyboardEvent) {
        const open = this._open;
        let handled = true;
        if (event.key === 'ArrowDown') {
            this._dismissed = false;
            this._move(1);
        } else if (event.key === 'ArrowUp') {
            if (open) this._move(-1);
        } else if (event.key === 'Enter' && open) {
            const result = this._results.find((entry) => entry.id === this._active);
            if (result) this._choose(result);
        } else if (event.key === 'Escape' && open) {
            this._dismissed = true;
            this._active = null;
        } else {
            handled = false;
        }
        if (handled) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    /** Leaving the field for anything outside the element closes the list. */
    private _onFocusOut(event: FocusEvent) {
        if (!this.renderRoot.contains(event.relatedTarget as Node | null)) this._focused = false;
    }

    private _renderResults() {
        const results = this._results;
        const limit = Number(this.scrollLimit);
        const scrolls = this._open && limit > 0 && limit <= results.length;
        const value = String(this.value ?? '');

        return html`<div
            aria-label="Search results"
            data-pttrn-owner="select"
            data-pttrn-utility="menu"
            id=${MENU_ID}
            popover="manual"
            role="listbox"
            style=${styleMap(
                scrolls ? { maxHeight: `calc((var(--usa-spacing-6) + var(--usa-spacing-05)) * ${limit})` } : {},
            )}
            tabindex="-1"
            @mousedown=${(event: MouseEvent) => event.preventDefault()}
        >
            ${
                this._active === NO_RESULTS_ID
                    ? html`<div
                          aria-disabled="true"
                          aria-selected="false"
                          data-pttrn="no-items-found"
                          id=${NO_RESULTS_ID}
                          role="option"
                      >
                          <div data-heading>No results found</div>
                          ${this.noResultsMessage ? html`<div data-message>${this.noResultsMessage}</div>` : nothing}
                      </div>`
                    : nothing
            }
            ${results.map(
                (result) =>
                    html`<div
                        aria-selected=${String(value === result.label)}
                        data-action
                        data-pttrn="list-item"
                        data-pttrn-owner="select"
                        id=${result.id}
                        role="option"
                        tabindex="-1"
                        ?data-active=${this._active === result.id}
                        @click=${() => this._choose(result)}
                    >
                        <span data-item-label><span data-text data-truncated>${result.label}</span></span>
                    </div>`,
            )}
        </div>`;
    }

    render() {
        const box = this._renderInputBox({
            type: 'text',
            autocomplete: 'off',
            clearable: true,
            owner: 'search-bar',
            leading: html`${icon(searchIcon)}`,
            trailing: html`<slot
                name="trailing"
                @slotchange=${(event: Event) =>
                    (this._hasTrailing = (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0)}
            ></slot>`,
            trailingHidden: !this._hasTrailing,
            combobox: {
                controls: this._open ? MENU_ID : undefined,
                expanded: this._open,
                activeDescendant: this._active ?? undefined,
            },
            onFocus: () => (this._focused = true),
            onKeyDown: (event) => this._onKeyDown(event),
        });

        return html`<div data-pttrn="search-bar" @focusout=${this._onFocusOut}>${this._renderField(box)}</div>
            ${this._renderResults()}
            ${keyed(
                this._announcements,
                html`<div aria-live="assertive" data-sr-only role="alert">
                    ${this._announcements && this._noResults ? 'No results found' : ''}
                </div>`,
            )}
            <slot hidden @slotchange=${() => this.requestUpdate()}></slot>`;
    }
}

define('pttrn-search-bar', PttrnSearchBar);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-search-bar': PttrnSearchBar;
    }
}
