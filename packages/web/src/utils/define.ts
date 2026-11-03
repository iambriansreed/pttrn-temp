import type { LitElement, PropertyDeclaration } from 'lit';

type ReactiveElementClass = CustomElementConstructor & {
    elementProperties?: Map<PropertyKey, PropertyDeclaration>;
};

/**
 * Registers a custom element unless the tag is already taken, so loading the package twice (for example the CDN bundle
 * plus a bundler build) does not throw.
 *
 * It also gives every element React's meaning for a removed attribute. Lit sets a property to null when its attribute
 * is removed, not back to the default the constructor gave it, so `variant` or `size` would render as nothing, where
 * React treats a prop going back to undefined as the default (and the docs demos do exactly that when a control is
 * cleared). The element is registered as a subclass that remembers each attribute-backed property's initial value and
 * restores it when the attribute goes away. Boolean attributes are left alone: absent already means false.
 */
export function define(tag: string, element: CustomElementConstructor) {
    if (customElements.get(tag)) return;

    const base = element as ReactiveElementClass;
    if (!base.elementProperties) {
        customElements.define(tag, element);
        return;
    }

    class WithDefaults extends (base as unknown as typeof LitElement) {
        private readonly _pttrnDefaults = new Map<string, [PropertyKey, unknown]>();

        constructor() {
            super();
            // The element's own constructor has run inside super(), so these are its defaults.
            for (const [key, options] of base.elementProperties!) {
                if (options.attribute === false || options.state || options.type === Boolean) continue;
                const attribute = typeof options.attribute === 'string' ? options.attribute : String(key).toLowerCase();
                this._pttrnDefaults.set(attribute, [key, (this as unknown as Record<PropertyKey, unknown>)[key]]);
            }
        }

        attributeChangedCallback(name: string, old: string | null, value: string | null) {
            super.attributeChangedCallback(name, old, value);
            const initial = value === null ? this._pttrnDefaults.get(name) : undefined;
            if (initial) (this as unknown as Record<PropertyKey, unknown>)[initial[0]] = initial[1];
        }
    }

    customElements.define(tag, WithDefaults);
}
