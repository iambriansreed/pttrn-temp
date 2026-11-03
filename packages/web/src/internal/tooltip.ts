import { html, type ReactiveController, type ReactiveControllerHost } from 'lit';
import { uniqueId } from '../utils/id';

/** The gap between the trigger and the tooltip, with the tail showing: 8px, as React's Tooltip. */
const OFFSET = 8;

/**
 * A private tooltip for elements whose trigger lives in their own shadow root (the Avatar's name, a truncated Tag
 * label). It renders in that shadow root, so the trigger's `aria-labelledby` reaches it, and opens in the top layer
 * (the Popover API), so no overflow, transform or stacking context of the page clips it. It looks and behaves like
 * React's Tooltip: shown on hover and focus, above the trigger unless there is no room, then below.
 *
 * Style it with `styles/_tooltip.scss`, render `controller.render(label)` in the shadow root and spread
 * `controller.trigger` onto the trigger's event bindings.
 */
export class TooltipController implements ReactiveController {
    readonly id = uniqueId('pttrn-tooltip');
    open = false;

    constructor(
        private readonly host: ReactiveControllerHost & HTMLElement,
        /** The element the tooltip points at, once rendered. */
        private readonly anchor: () => HTMLElement | null | undefined,
    ) {
        host.addController(this);
    }

    show = () => {
        if (this.open) return;
        this.open = true;
        // Follow the anchor while open, as React's Tooltip does through floating-ui's autoUpdate.
        window.addEventListener('scroll', this._follow, { capture: true, passive: true });
        window.addEventListener('resize', this._follow, { passive: true });
        this.host.requestUpdate();
    };

    hide = () => {
        if (!this.open) return;
        this.open = false;
        this._unfollow();
        this.host.requestUpdate();
    };

    hostDisconnected() {
        this.open = false;
        this._unfollow();
    }

    private _follow = () => this.host.requestUpdate();

    private _unfollow() {
        window.removeEventListener('scroll', this._follow, { capture: true });
        window.removeEventListener('resize', this._follow);
    }

    hostUpdated() {
        const tip = this.host.shadowRoot?.getElementById(this.id);
        const anchor = this.anchor();
        if (!tip) return;
        const popover = 'showPopover' in tip;
        if (!this.open || !anchor) {
            if (popover && tip.matches(':popover-open')) tip.hidePopover();
            return;
        }
        if (popover && !tip.matches(':popover-open')) tip.showPopover();
        this._place(tip, anchor);
    }

    /** Above the anchor and centered on it, kept inside the viewport; below when there is no room above. */
    private _place(tip: HTMLElement, anchor: HTMLElement) {
        const target = anchor.getBoundingClientRect();
        const { width, height } = tip.getBoundingClientRect();
        const above = target.top - height - OFFSET;
        const placement = above >= 0 ? 'top' : 'bottom';
        const top = placement === 'top' ? above : target.bottom + OFFSET;
        const center = target.left + target.width / 2;
        const left = Math.min(
            Math.max(0, center - width / 2),
            Math.max(0, document.documentElement.clientWidth - width),
        );
        tip.dataset.placement = placement;
        tip.style.top = `${top}px`;
        tip.style.left = `${left}px`;
        tip.style.setProperty('--arrow-x', `${center - left}px`);
    }

    /** The tooltip, hidden until shown. */
    render(label: string) {
        return html`<div ?data-open=${this.open} data-pttrn="tooltip" id=${this.id} popover="manual" role="tooltip">
            <span data-text>${label}</span><span aria-hidden="true" data-arrow></span>
        </div>`;
    }
}
