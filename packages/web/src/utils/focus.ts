/**
 * Focus helpers that see through shadow roots and slots, for elements that hold focus inside themselves (Popover's
 * panel, Dialog, Modal) the way @ptrn/react does with focus-trap.
 */
const FOCUSABLE =
    'a[href], area[href], button, input, select, textarea, iframe, summary, [tabindex], [contenteditable=""], [contenteditable="true"]';

/** The element that has focus, inside any open shadow roots. */
export function deepActiveElement(): Element | null {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active;
}

const isVisible = (element: HTMLElement) =>
    typeof element.checkVisibility === 'function'
        ? element.checkVisibility({ visibilityProperty: true })
        : element.getClientRects().length > 0;

/**
 * The elements Tab reaches inside `root`, in the order of the flat tree: slotted content where it is slotted, and the
 * shadow roots of the elements inside.
 */
export function tabbables(root: Element | ShadowRoot): HTMLElement[] {
    const found: HTMLElement[] = [];
    const visit = (element: Element) => {
        if (
            element instanceof HTMLElement &&
            element.matches(FOCUSABLE) &&
            !element.matches(':disabled') &&
            element.tabIndex >= 0 &&
            isVisible(element)
        ) {
            found.push(element);
        }
        if (element instanceof HTMLSlotElement) {
            const assigned = element.assignedElements({ flatten: true });
            (assigned.length ? assigned : [...element.children]).forEach(visit);
        } else if (element.shadowRoot) {
            [...element.shadowRoot.children].forEach(visit);
        } else {
            [...element.children].forEach(visit);
        }
    };
    [...root.children].forEach(visit);
    return found;
}

/**
 * Keeps Tab and Shift+Tab inside `root`: call it from a keydown listener. Moves focus to the next or previous tabbable
 * element, wrapping at the ends, and returns true when it handled the key.
 */
export function trapTab(event: KeyboardEvent, root: Element | ShadowRoot) {
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return false;
    const list = tabbables(root);
    event.preventDefault();
    if (!list.length) return true;
    const index = list.indexOf(deepActiveElement() as HTMLElement);
    const next = event.shiftKey
        ? list[index <= 0 ? list.length - 1 : index - 1]
        : list[index === -1 || index === list.length - 1 ? 0 : index + 1];
    next.focus();
    return true;
}
