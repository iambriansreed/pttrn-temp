import { html, nothing, type ReactiveController, type ReactiveControllerHost } from 'lit';
import { uniqueId } from './id';

/** The gap between the trigger and the tooltip, the room the tail needs (8 px in @ptrn/react). */
const OFFSET = 8;
/** How close the tail may come to a corner of the tooltip. */
const TAIL_PADDING = 8;

type Host = ReactiveControllerHost & HTMLElement;

/**
 * The tooltip a control shows for itself, for the elements that have a `tooltip` attribute (Button, Fab). It renders in
 * the host's own shadow root, beside the trigger, so `aria-labelledby` and `aria-describedby` can point at it (an id
 * cannot be referenced across a shadow boundary), and it opens in the top layer (`popover="manual"`), so no clipping
 * ancestor or stacking context hides it. It is placed above the trigger and flips below when there is no room, like
 * `<Tooltip placement="top">` in @ptrn/react. Style it with `@use '../../styles/tooltip';`.
 *
 * This is a private piece of those elements, not the `pttrn-tooltip` element.
 */
export class TooltipController implements ReactiveController {
    /** The tooltip's id, for the trigger's `aria-labelledby` or `aria-describedby`. */
    readonly id = uniqueId('pttrn-tooltip');

    private _trigger: HTMLElement | null = null;
    private readonly _host: Host;

    constructor(host: Host) {
        this._host = host;
        host.addController(this);
    }

    hostDisconnected() {
        this.hide();
    }

    /** Wire these to the trigger: `@mouseover=${tooltip.show} @mouseleave=${tooltip.hide} @focus=… @blur=…`. */
    readonly show = (event: Event) => {
        const tooltip = this._element();
        if (!tooltip) return;
        this._trigger = event.currentTarget as HTMLElement;
        if (!tooltip.matches(':popover-open')) tooltip.showPopover();
        this._place();
        window.addEventListener('scroll', this._place, { capture: true, passive: true });
        window.addEventListener('resize', this._place, { passive: true });
    };

    readonly hide = () => {
        window.removeEventListener('scroll', this._place, { capture: true });
        window.removeEventListener('resize', this._place);
        const tooltip = this._element();
        if (tooltip?.matches(':popover-open')) tooltip.hidePopover();
        this._trigger = null;
    };

    /** The tooltip itself. Render it next to the trigger, and only when there is a label. */
    render(label: string) {
        if (!label) return nothing;
        return html`<div data-pttrn="tooltip" id=${this.id} popover="manual" role="tooltip">
            <span data-text>${label}</span>
            <span aria-hidden="true" data-arrow></span>
        </div>`;
    }

    private _element() {
        return this._host.shadowRoot?.getElementById(this.id) ?? null;
    }

    private readonly _place = () => {
        const tooltip = this._element();
        const trigger = this._trigger;
        if (!tooltip || !trigger) return;

        const anchor = trigger.getBoundingClientRect();
        const { width, height } = tooltip.getBoundingClientRect();
        const viewport = document.documentElement.clientWidth;

        const placement = anchor.top - OFFSET - height < 0 ? 'bottom' : 'top';
        const top = placement === 'top' ? anchor.top - OFFSET - height : anchor.bottom + OFFSET;
        const centered = anchor.left + anchor.width / 2 - width / 2;
        const left = Math.min(Math.max(centered, 0), Math.max(viewport - width, 0));
        const tail = Math.min(
            Math.max(anchor.left + anchor.width / 2 - left, TAIL_PADDING),
            Math.max(width - TAIL_PADDING, TAIL_PADDING),
        );

        tooltip.dataset.placement = placement;
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.style.setProperty('--tail-x', `${tail}px`);
    };
}
