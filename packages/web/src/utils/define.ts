/**
 * Registers a custom element unless the tag is already taken, so loading the package twice (for example the CDN bundle
 * plus a bundler build) does not throw.
 */
export function define(tag: string, element: CustomElementConstructor) {
    if (!customElements.get(tag)) customElements.define(tag, element);
}
