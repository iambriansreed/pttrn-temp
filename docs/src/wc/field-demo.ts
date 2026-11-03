import { RefObject, useEffect, useRef } from 'react';

/**
 * Helpers shared by the demos of the `@ptrn/web` form controls (Input, Textarea, Password and the rest): the props
 * table state as attributes, the HTML for it, and the `pttrn-change` event fed back to the demo state.
 */

export type Attributes = Record<string, number | string | undefined>;

export const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

export const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** On for `''`, off for `undefined`: an HTML boolean attribute is present or absent. */
export const flag = (on: unknown) => (on ? '' : undefined);

/**
 * The attributes every field control shares, from the React props: `readOnly` becomes `readonly`, and the ids (`id`,
 * `aria-describedby`, `aria-errormessage`) are left out because they cannot cross the shadow boundary.
 */
export function fieldAttributes(props: Record<string, unknown>): Attributes {
    const text = (value: unknown) => (typeof value === 'string' && value ? value : undefined);
    return {
        'aria-label': text(props['aria-label']),
        name: text(props.name),
        size: text(props.size),
        disabled: flag(props.disabled),
        readonly: flag(props.readOnly),
        required: flag(props.required),
        invalid: flag(props.invalid),
    };
}

/** The defined attributes, without the `undefined` ones React would otherwise skip anyway. */
export const defined = (attributes: Attributes) =>
    Object.fromEntries(Object.entries(attributes).filter(([, value]) => value !== undefined)) as Record<
        string,
        number | string
    >;

/** `<tag a="1" b>inner</tag>` for the attributes that are set. */
export function elementHtml(tag: string, attributes: Attributes, inner = '') {
    const attrs = Object.entries(defined(attributes)).map(([key, value]) =>
        value === '' ? key : `${key}="${escapeAttr(String(value))}"`,
    );
    return `<${tag}${attrs.length ? ` ${attrs.join(' ')}` : ''}>${inner}</${tag}>`;
}

/** Calls `handler` with each `name` event the element fires. React 18 cannot listen to custom events through props. */
export function useElementEvent<E extends Event>(
    name: string,
    handler: ((event: E) => void) | undefined,
): RefObject<HTMLElement> {
    const ref = useRef<HTMLElement>(null);
    const latest = useRef(handler);
    latest.current = handler;
    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const listener = (event: Event) => latest.current?.(event as E);
        element.addEventListener(name, listener);
        return () => element.removeEventListener(name, listener);
    }, [name]);
    return ref;
}

export const USAGE_DESCRIPTION =
    'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. The element is a form control: inside a `<form>` it submits its `name` and value, takes part in validation and resets with the form. Give it a `label` (with `helper-text` or `error-message`), or an `aria-label` when there is no visible label.';
