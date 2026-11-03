import chevronLeft from '@ptrn/icons/ChevronLeft.svg';
import chevronRight from '@ptrn/icons/ChevronRight.svg';
import { LitElement, html } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { define } from '../../utils/define';
import { uniqueId } from '../../utils/id';
import { hideTooltip, showTooltip, tooltip } from '../../utils/private-tooltip';
import styles from './carousel.scss';

const icon = (svg: string) => unsafeSVG(svg.replace('<svg ', '<svg aria-hidden="true" width="24" '));
const ICONS = { previous: icon(chevronLeft), next: icon(chevronRight) };

/** A swipe moves a slide once the finger travels this far. */
const MIN_SWIPE_DISTANCE = 50;
/** The page indicator shows at most this many dots, shrinking the ones at the edges of a longer run. */
const MAX_DOT_COUNT = 5;

type DotSize = 'medium' | 'small' | 'x-small';

/** The dots of the page indicator, as the React PageControl picks them. */
function dots(currentIndex: number, total: number) {
    if (total <= MAX_DOT_COUNT) return Array.from({ length: total }, (_, i) => ({ pageIndex: i, size: 'medium' }));
    const start = Math.max(0, Math.min(currentIndex - 2, total - MAX_DOT_COUNT));
    return Array.from({ length: MAX_DOT_COUNT }, (_, i) => {
        const pageIndex = start + i;
        let size: DotSize = 'medium';
        if (i === 0 && pageIndex > 0) size = 'x-small';
        if (i === 1 && pageIndex > 1) size = 'small';
        if (i === 3 && pageIndex < total - 2) size = 'small';
        if (i === 4 && pageIndex < total - 1) size = 'x-small';
        return { pageIndex, size };
    });
}

/**
 * A carousel for displaying a horizontal row of items with navigation controls: one slide active at a time, moved with
 * the buttons, the arrow keys or a swipe.
 *
 * Each child element is a slide. The carousel is a region named by `label` with the role description "carousel"; each
 * slide is a group named "Slide N of M" with the role description "slide", and only the active one is in the tab order.
 * Moving to a slide focuses it and scrolls it into view (smoothly, unless the user prefers reduced motion), and a
 * polite live region announces it. The page indicator is an image named "Page N of M".
 *
 * React to Web Component mapping:
 *
 * | React       | Web Component          | Note                                                  |
 * | ----------- | ---------------------- | ----------------------------------------------------- |
 * | `children`  | child elements         | One slide each.                                       |
 * | `label`     | `label` attribute      | Names the region; `carousel` by default.              |
 * | `itemWidth` | `item-width` attribute | A CSS width, or a number of pixels; `80%` by default. |
 * | `gap`       | `gap` attribute        | Pixels between slides; 16 by default.                 |
 * | `style`     | `style` attribute      | On the element itself.                                |
 *
 * @element pttrn-carousel
 * @slot - The slides, one per child element.
 */
export class PttrnCarousel extends LitElement {
    static shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, slotAssignment: 'manual' };

    static properties = {
        label: { type: String },
        itemWidth: { type: String, attribute: 'item-width' },
        gap: { type: Number },
        _index: { state: true },
        _count: { state: true },
    };

    static styles = styles;

    /** The name of the carousel region. */
    declare label: string;
    /** The width of each slide: a CSS width, a percentage of the carousel, or a number of pixels. */
    declare itemWidth: string;
    /** The gap between slides in pixels. */
    declare gap: number;
    declare _index: number;
    declare _count: number;

    private readonly _previousTipId = uniqueId('pttrn-carousel-previous');
    private readonly _nextTipId = uniqueId('pttrn-carousel-next');
    private readonly _observer = new MutationObserver(() => this._countSlides());
    private _touchStart: number | null = null;
    private _touchEnd: number | null = null;

    constructor() {
        super();
        this.label = 'carousel';
        this.itemWidth = '80%';
        this.gap = 16;
        this._index = 0;
        this._count = 0;
    }

    connectedCallback() {
        super.connectedCallback();
        this._observer.observe(this, { childList: true });
        this._countSlides();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._observer.disconnect();
        this.renderRoot.querySelectorAll<HTMLElement>('[data-tooltip]').forEach((tip) => hideTooltip(tip));
    }

    private _countSlides() {
        this._count = this.children.length;
        this.requestUpdate();
    }

    protected updated() {
        // Each child goes in its own slide wrapper.
        const slots = this.renderRoot.querySelectorAll<HTMLSlotElement>('[data-item-wrapper] slot');
        const children = [...this.children];
        slots.forEach((slot, index) => slot.assign(...(children[index] ? [children[index]] : [])));
        if (this._index > Math.max(0, this._count - 1)) this._index = Math.max(0, this._count - 1);
    }

    private _move(direction: 'next' | 'previous') {
        const next = Math.max(0, Math.min(this._count - 1, this._index + (direction === 'next' ? 1 : -1)));
        this._index = next;
        const slide = this.renderRoot.querySelectorAll<HTMLElement>('[data-item-wrapper]')[next];
        slide?.focus();
        slide?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    private _onKeyDown = {
        handleEvent: (event: KeyboardEvent) => {
            if (event.shiftKey || (event.code !== 'ArrowLeft' && event.code !== 'ArrowRight')) return;
            event.preventDefault();
            event.stopPropagation();
            this._move(event.code === 'ArrowRight' ? 'next' : 'previous');
        },
        // On the way down, so an arrow pressed inside a slide moves the carousel too, as in React.
        capture: true,
    };

    private _onTouchStart(event: TouchEvent) {
        this._touchEnd = null;
        this._touchStart = event.targetTouches[0].clientX;
    }

    private _onTouchMove(event: TouchEvent) {
        this._touchEnd = event.targetTouches[0].clientX;
    }

    private _onTouchEnd() {
        if (this._touchStart === null || this._touchEnd === null) return;
        const distance = this._touchStart - this._touchEnd;
        if (distance > MIN_SWIPE_DISTANCE) this._move('next');
        else if (distance < -MIN_SWIPE_DISTANCE) this._move('previous');
    }

    private _tip(id: string) {
        return this.renderRoot.querySelector<HTMLElement>(`#${id}`);
    }

    private _button(direction: 'next' | 'previous', disabled: boolean) {
        const tipId = direction === 'next' ? this._nextTipId : this._previousTipId;
        const show = (event: Event) => showTooltip(event.currentTarget as Element, this._tip(tipId));
        const hide = () => hideTooltip(this._tip(tipId));
        return html`<button
                aria-label=${direction === 'next' ? 'Next Slide' : 'Previous Slide'}
                data-size="medium"
                data-variant="tertiary"
                ?disabled=${disabled}
                type="button"
                @blur=${hide}
                @click=${() => this._move(direction)}
                @focus=${show}
                @mouseenter=${show}
                @mouseleave=${hide}
            >
                <span aria-hidden="true" data-button-icon>${ICONS[direction]}</span
                ><span aria-hidden="true" data-touch-target></span>
            </button>
            ${tooltip(tipId, direction === 'next' ? 'Next' : 'Previous')}`;
    }

    private _pageControl(current: number, total: number) {
        if (total < 2) return null;
        return html`<span aria-label=${`Page ${current} of ${total}`} data-page-control role="img">
            ${dots(current - 1, total).map(
                ({ pageIndex, size }) =>
                    html`<span
                        aria-hidden="true"
                        ?data-active=${pageIndex + 1 === current}
                        data-dot=${pageIndex}
                        data-size=${size}
                        role="presentation"
                    ></span>`,
            )}
        </span>`;
    }

    render() {
        const total = this._count;
        const index = Math.min(this._index, Math.max(0, total - 1));
        const width = /^\d+(\.\d+)?$/.test(String(this.itemWidth).trim()) ? `${this.itemWidth}px` : this.itemWidth;
        const style = `--gap: ${this.gap || 16}px; --item-width: ${width || '80%'}`;

        return html`
            <div
                aria-label=${this.label || 'carousel'}
                aria-roledescription="carousel"
                data-pttrn="carousel"
                role="region"
                style=${style}
            >
                <div data-items-container>
                    <div
                        data-items-track
                        @keydown=${this._onKeyDown}
                        @touchend=${this._onTouchEnd}
                        @touchmove=${this._onTouchMove}
                        @touchstart=${this._onTouchStart}
                    >
                        ${Array.from(
                            { length: total },
                            (_, i) =>
                                html`<div
                                    aria-label=${`Slide ${i + 1} of ${total}`}
                                    aria-roledescription="slide"
                                    ?data-active=${i === index}
                                    data-item-wrapper
                                    role="group"
                                    tabindex=${i === index ? 0 : -1}
                                >
                                    <slot></slot>
                                </div>`,
                        )}
                    </div>
                </div>
                <div data-controls>
                    ${this._button('previous', index === 0)} ${this._pageControl(index + 1, total)}
                    ${this._button('next', index === total - 1)}
                </div>
                <span aria-live="polite" data-sr-only>${`Slide ${index + 1} of ${total}`}</span>
            </div>
        `;
    }
}

define('pttrn-carousel', PttrnCarousel);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-carousel': PttrnCarousel;
    }
}
