/**
 * Places a floating element (a tooltip, popover, menu or listbox) next to the element it belongs to, the way the React
 * components do with Floating UI (`useFloating`): the requested placement, an offset, a flip to the other side when the
 * viewport has no room, an optional arrow aimed at the reference, and optionally the reference's width. Coordinates are
 * viewport-relative, for a floating element that is `position: fixed` (a popover in the top layer is).
 *
 * CSS anchor positioning would do this without script, but it is not in every browser yet and an anchor name does not
 * reach across a shadow boundary, so the elements use this instead.
 */
export type Side = 'top' | 'right' | 'bottom' | 'left';
export type Placement = Side | `${Side}-start` | `${Side}-end`;

export type PlaceOptions = {
    placement: Placement;
    /** The gap between the reference and the floating element, in pixels. */
    offset?: number;
    /** An element inside the floating element to aim at the reference's center. */
    arrow?: HTMLElement | null;
    /** The arrow's minimum distance from the floating element's corners. */
    arrowPadding?: number;
    /** Matches the floating element's width to the reference's. */
    matchWidth?: boolean;
};

export type PlaceResult = {
    /** The placement used, after any flip. */
    placement: Placement;
    x: number;
    y: number;
};

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

type Size = { width: number; height: number };

function coordinates(reference: DOMRect, floating: Size, placement: Placement, offset: number) {
    const [side, align] = placement.split('-') as [Side, 'start' | 'end' | undefined];
    if (side === 'top' || side === 'bottom') {
        const y = side === 'top' ? reference.top - floating.height - offset : reference.bottom + offset;
        const x =
            align === 'start'
                ? reference.left
                : align === 'end'
                  ? reference.right - floating.width
                  : reference.left + reference.width / 2 - floating.width / 2;
        return { x, y };
    }
    const x = side === 'left' ? reference.left - floating.width - offset : reference.right + offset;
    const y =
        align === 'start'
            ? reference.top
            : align === 'end'
              ? reference.bottom - floating.height
              : reference.top + reference.height / 2 - floating.height / 2;
    return { x, y };
}

/** How far a box at `x, y` would stick out of the viewport, summed over its four sides. */
function overflow({ x, y }: { x: number; y: number }, floating: Size) {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    return (
        Math.max(0, -x) +
        Math.max(0, x + floating.width - width) +
        Math.max(0, -y) +
        Math.max(0, y + floating.height - height)
    );
}

/** The requested placement, then the other side, then (for an aligned placement) the other alignment of each. */
function candidates(placement: Placement): Placement[] {
    const [side, align] = placement.split('-') as [Side, 'start' | 'end' | undefined];
    const sides = [side, OPPOSITE[side]];
    if (!align) return sides;
    const other = align === 'start' ? 'end' : 'start';
    return [...sides.map((s) => `${s}-${align}` as Placement), ...sides.map((s) => `${s}-${other}` as Placement)];
}

/**
 * Positions `floating` next to `reference` and returns the placement used. Call it while `floating` is rendered (after
 * `showPopover()`), so it has a size.
 */
export function place(reference: Element, floating: HTMLElement, options: PlaceOptions): PlaceResult {
    const { offset = 0, arrow, arrowPadding = 8, matchWidth = false } = options;
    const ref = reference.getBoundingClientRect();
    if (matchWidth) floating.style.width = `${ref.width}px`;
    const box = floating.getBoundingClientRect();
    const size = { width: box.width, height: box.height };

    let best = { placement: options.placement, ...coordinates(ref, size, options.placement, offset) };
    let least = overflow(best, size);
    for (const placement of candidates(options.placement)) {
        if (least === 0) break;
        const next = { placement, ...coordinates(ref, size, placement, offset) };
        const amount = overflow(next, size);
        if (amount < least) {
            best = next;
            least = amount;
        }
    }

    Object.assign(floating.style, { left: `${best.x}px`, top: `${best.y}px` });

    if (arrow) {
        const side = best.placement.split('-')[0] as Side;
        const clamp = (value: number, max: number) => Math.min(Math.max(value, arrowPadding), max - arrowPadding);
        const { width, height } = arrow.getBoundingClientRect();
        if (side === 'top' || side === 'bottom') {
            arrow.style.top = '';
            arrow.style.left = `${clamp(ref.left + ref.width / 2 - best.x - width / 2, size.width - width)}px`;
        } else {
            arrow.style.left = '';
            arrow.style.top = `${clamp(ref.top + ref.height / 2 - best.y - height / 2, size.height - height)}px`;
        }
    }

    return best;
}

/**
 * Calls `update` whenever the reference or the floating element could have moved or resized: scrolling anywhere,
 * resizing the window or either element. Returns the function that stops listening.
 */
export function autoUpdate(reference: Element, floating: HTMLElement, update: () => void) {
    let frame = 0;
    const schedule = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(reference);
    observer.observe(floating);
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        window.removeEventListener('scroll', schedule, { capture: true });
        window.removeEventListener('resize', schedule);
    };
}
