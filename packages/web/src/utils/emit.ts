/**
 * Dispatches a `pttrn-*` event the way every element here does: it bubbles and is composed, so listeners outside the
 * shadow root (and the parent element) see it.
 */
export function emit<Detail>(element: HTMLElement, name: `pttrn-${string}`, detail: Detail) {
    return element.dispatchEvent(new CustomEvent<Detail>(name, { bubbles: true, composed: true, detail }));
}
