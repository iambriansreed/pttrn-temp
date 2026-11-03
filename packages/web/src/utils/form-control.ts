/**
 * Helpers for the form-associated elements (Switch, Checkbox and their options), whose state and keyboard live in a
 * native checkbox inside the shadow root while the element itself takes part in the form through ElementInternals.
 */

/**
 * The text of the `<label>`s associated with the element (`<label for>` or a wrapping label). A label outside the
 * shadow root cannot name the inner checkbox, so the element passes this text to it as its aria-label.
 */
export function labelsText(internals: ElementInternals) {
    return [...(internals.labels ?? [])]
        .map((label) => label.textContent?.replace(/\s+/g, ' ').trim() ?? '')
        .filter(Boolean)
        .join(' ');
}

/**
 * Whether a click reached the element itself rather than its inner checkbox: a `<label>` for the element clicks the
 * element, and the element passes that on to the checkbox, as a label does for a native one.
 */
export function isClickOnHost(host: HTMLElement, event: Event) {
    return event.composedPath()[0] === host;
}
