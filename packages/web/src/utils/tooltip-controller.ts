import { html, ReactiveController, ReactiveControllerHost } from 'lit';
import { autoUpdate, place, Side } from './floating';

export type TooltipControllerOptions = {
    /** The floating box, `tooltipTemplate()` rendered in the host's shadow root. */
    popover: () => HTMLElement | null | undefined;
    /** Where the tooltip shows; it flips to the opposite side when there is no room. Defaults to `top`. */
    placement?: () => Side;
    /** Whether the arrow shows, which sets the gap: 8px with it, 4px without. Defaults to true. */
    tail?: () => boolean;
};

/**
 * The floating box of a tooltip: a manual popover in the top layer. Style it with the `tooltip` mixin in
 * `src/styles/_tooltip.scss`. `text` is its content: the label, or a slot.
 */
export const tooltipTemplate = (text: unknown) =>
    html`<div data-pttrn="tooltip" part="tooltip" popover="manual">
        <span data-text>${text}</span><span aria-hidden="true" data-arrow></span>
    </div>`;

/**
 * Shows a tooltip next to its trigger while the trigger is hovered or focused, as the React Tooltip does: `mouseover`
 * and `focusin` show it, `mouseleave` and `focusout` hide it. `pttrn-tooltip` uses it for a slotted trigger, and
 * elements that are their own trigger (an icon-only segment) attach it to themselves.
 */
export class TooltipController implements ReactiveController {
    /** Set to false to keep the tooltip from showing. */
    enabled = true;
    private _trigger: Element | null = null;
    private _stopUpdates: (() => void) | null = null;
    private readonly _host: ReactiveControllerHost;
    private readonly _options: TooltipControllerOptions;

    constructor(host: ReactiveControllerHost, options: TooltipControllerOptions) {
        this._host = host;
        this._options = options;
        host.addController(this);
    }

    hostUpdated() {
        if (!this.enabled) this.hide();
        else if (this._stopUpdates) this._position();
    }

    hostDisconnected() {
        this.hide();
    }

    /** Listens to `trigger` (or stops listening, with null). */
    attach(trigger: Element | null) {
        if (trigger === this._trigger) return;
        if (this._trigger) {
            this.hide();
            this._trigger.removeEventListener('mouseover', this.show);
            this._trigger.removeEventListener('mouseleave', this.hide);
            this._trigger.removeEventListener('focusin', this.show);
            this._trigger.removeEventListener('focusout', this.hide);
        }
        this._trigger = trigger;
        trigger?.addEventListener('mouseover', this.show);
        trigger?.addEventListener('mouseleave', this.hide);
        trigger?.addEventListener('focusin', this.show);
        trigger?.addEventListener('focusout', this.hide);
    }

    readonly show = () => {
        const popover = this._options.popover();
        if (!this.enabled || !popover || !this._trigger || this._stopUpdates) return;
        popover.showPopover();
        this._position();
        this._stopUpdates = autoUpdate(this._trigger, popover, () => this._position());
    };

    readonly hide = () => {
        this._stopUpdates?.();
        this._stopUpdates = null;
        const popover = this._options.popover();
        if (popover?.matches(':popover-open')) popover.hidePopover();
    };

    private _position() {
        const popover = this._options.popover();
        if (!popover || !this._trigger) return;
        const tail = this._options.tail?.() ?? true;
        const { placement } = place(this._trigger, popover, {
            placement: this._options.placement?.() ?? 'top',
            offset: tail ? 8 : 4,
            arrow: popover.querySelector<HTMLElement>('[data-arrow]'),
        });
        popover.dataset.placement = placement.split('-')[0];
        popover.toggleAttribute('data-hide-tail', !tail);
    }
}
