/**
 * Whether a slot has content worth showing: an element, or text that is not only whitespace. The line breaks and
 * indentation around children in hand-written HTML are text nodes too, and they should not count.
 */
export function slotHasContent(slot: HTMLSlotElement) {
    return slot
        .assignedNodes({ flatten: true })
        .some((node) => node.nodeType === Node.ELEMENT_NODE || !!node.textContent?.trim());
}
