import chevronLeft from '@ptrn/icons/ChevronLeft.svg';
import chevronRight from '@ptrn/icons/ChevronRight.svg';
import { LitElement, html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { announce } from '../../utils/announce';
import { define } from '../../utils/define';
import { emit } from '../../utils/emit';
import '../Tooltip/tooltip';
import styles from './pagination.scss';

/** Past this many pages a page number field replaces the page buttons. */
const INPUT_TYPE_THRESHOLD = 7;

export type PaginationChangeDetail = { value: number };

/**
 * A navigation component that allows customers to move between a range of listed content within a page into smaller
 * multiple micro pages.
 *
 * Previous and next, with a button per page or, past seven pages, a page number field. Every change sets `value`, fires
 * `pttrn-change` and is announced as "Page N of M". The element is the group: name it with `aria-label`. With one page
 * nothing renders.
 *
 * React to Web Component mapping:
 *
 * - `numPages` → `num-pages`
 * - `value` → `value`
 * - `onChange` → the `pttrn-change` event
 * - Aria attributes (`aria-label`) → on the element, which is the group
 *
 * @fires {CustomEvent<{ value: number }>} pttrn-change - After the user moves to another page. `detail.value` is the
 *   new page; the element's `value` is already updated.
 * @element pttrn-pagination
 */
export class PttrnPagination extends LitElement {
    static properties = {
        numPages: { type: Number, attribute: 'num-pages' },
        value: { type: Number, reflect: true },
        _field: { state: true },
    };

    static styles = styles;

    /** The number of pages. With one page nothing renders. */
    declare numPages: number;
    /** The current page, counted from 1. */
    declare value: number;
    /** The text in the page number field. */
    declare _field: string;

    constructor() {
        super();
        this.numPages = 2;
        this.value = 1;
        this._field = '1';
    }

    /** Whether the element set its own role, so it removes only that one. */
    private _ownRole = false;

    protected willUpdate(changed: Map<string, unknown>) {
        if (changed.has('value')) this._field = String(this.value);
    }

    protected updated() {
        // The element is the group while it renders anything; with one page it renders nothing, as React does.
        const rendered = this.numPages > 1;
        if (rendered && !this.hasAttribute('role')) {
            this.setAttribute('role', 'group');
            this._ownRole = true;
        } else if (!rendered && this._ownRole) {
            this.removeAttribute('role');
            this._ownRole = false;
        }
    }

    private _go(page: number) {
        if (page === this.value) return;
        this.value = page;
        emit<PaginationChangeDetail>(this, 'pttrn-change', { value: page });
        announce(`Page ${page} of ${this.numPages}`);
    }

    /** Goes to the page typed in the field, clamped to the range; anything that is not a number restores the field. */
    private _submitField() {
        const parsed = parseInt(this._field, 10);
        if (isNaN(parsed)) {
            this._field = String(this.value);
            return;
        }
        const next = Math.min(Math.max(parsed, 1), this.numPages);
        this._field = String(next);
        this._go(next);
    }

    private _arrow(direction: 'previous' | 'next') {
        const target = direction === 'previous' ? this.value - 1 : this.value + 1;
        const disabled = target < 1 || target > this.numPages;
        const label =
            direction === 'previous'
                ? this.value === 1
                    ? 'First page'
                    : `Previous page (${target})`
                : this.value === this.numPages
                  ? 'Last page'
                  : `Next page (${target})`;
        return html`<pttrn-tooltip label=${label} placement="top">
            <button
                data-size="small"
                data-variant="tertiary"
                type="button"
                ?disabled=${disabled}
                @click=${() => !disabled && this._go(target)}
            >
                <span aria-hidden="true" data-button-icon
                    >${unsafeSVG(direction === 'previous' ? chevronLeft : chevronRight)}</span
                ><span aria-hidden="true" data-touch-target></span>
            </button>
        </pttrn-tooltip>`;
    }

    private _pages() {
        return Array.from({ length: this.numPages }, (_, index) => {
            const page = index + 1;
            const current = page === this.value;
            return html`<button
                aria-current=${current ? 'page' : nothing}
                aria-label=${`Page ${page}`}
                data-page
                data-size="small"
                data-variant=${current ? 'primary' : 'tertiary'}
                type="button"
                @click=${() => this._go(page)}
            >
                <span data-button-label>${page}</span><span aria-hidden="true" data-touch-target></span>
            </button>`;
        });
    }

    private _form() {
        return html`<form
            data-input-form
            @submit=${(event: SubmitEvent) => {
                event.preventDefault();
                this._submitField();
            }}
        >
            <div data-input>
                <input
                    aria-label="Page number"
                    autocomplete="off"
                    data-main-input
                    name="page-number"
                    placeholder=" "
                    type="number"
                    .value=${live(this._field)}
                    @blur=${() => this._submitField()}
                    @input=${(event: InputEvent) => (this._field = (event.target as HTMLInputElement).value)}
                />
            </div>
            <span>of ${this.numPages}</span>
        </form>`;
    }

    render() {
        if (!(this.numPages > 1)) return nothing;
        return html`
            ${this._arrow('previous')} ${this.numPages > INPUT_TYPE_THRESHOLD ? this._form() : this._pages()}
            ${this._arrow('next')}
        `;
    }
}

define('pttrn-pagination', PttrnPagination);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-pagination': PttrnPagination;
    }
}
