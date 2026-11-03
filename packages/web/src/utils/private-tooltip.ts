import { html } from 'lit';

/**
 * A private tooltip for the elements here that need one inside their own shadow root: an icon-only button's visible
 * label, or the full text of a truncated name. It matches the React Tooltip (an ink box with a tail, above its trigger,
 * below when there is no room) and renders in the top layer through the Popover API, as the React one renders in a
 * portal, so no `overflow` clips it. Style it with `@use '../../styles/private-tooltip'`.
 *
 * The trigger keeps its own accessible name; the tooltip only shows it. Call `showTooltip` on mouseenter and focus and
 * `hideTooltip` on mouseleave and blur.
 */
export function tooltip(id: string, label: string) {
    return html`<div data-tooltip id=${id} popover="manual" role="tooltip">
        <span data-text>${label}</span><span aria-hidden="true" data-arrow></span>
    </div>`;
}

/** The gap between the trigger and the tooltip, room for the tail. */
const OFFSET = 8;

function place(trigger: Element, tip: HTMLElement) {
    const target = trigger.getBoundingClientRect();
    const { width, height } = tip.getBoundingClientRect();
    const below = target.top - height - OFFSET < 0;
    const left = Math.min(
        Math.max(0, target.left + target.width / 2 - width / 2),
        document.documentElement.clientWidth - width,
    );
    tip.style.left = `${left}px`;
    tip.style.top = `${below ? target.bottom + OFFSET : target.top - height - OFFSET}px`;
    tip.dataset.placement = below ? 'bottom' : 'top';
    // The tail points at the middle of the trigger, wherever the box had to move.
    tip.style.setProperty('--arrow-left', `${target.left + target.width / 2 - left}px`);
}

const shown = new Map<HTMLElement, () => void>();

export function showTooltip(trigger: Element, tip: HTMLElement | null | undefined) {
    if (!tip || shown.has(tip) || !tip.isConnected) return;
    tip.showPopover();
    place(trigger, tip);
    const follow = () => place(trigger, tip);
    window.addEventListener('scroll', follow, { capture: true, passive: true });
    window.addEventListener('resize', follow, { passive: true });
    shown.set(tip, follow);
}

export function hideTooltip(tip: HTMLElement | null | undefined) {
    const follow = tip && shown.get(tip);
    if (!tip || !follow) return;
    window.removeEventListener('scroll', follow, { capture: true });
    window.removeEventListener('resize', follow);
    shown.delete(tip);
    if (tip.isConnected && tip.matches(':popover-open')) tip.hidePopover();
}
