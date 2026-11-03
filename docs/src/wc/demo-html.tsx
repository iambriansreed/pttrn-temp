import { cloneElement, createElement, isValidElement, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { isIconName } from 'src/utils/icons';

/**
 * The SVG markup of an icon from `@ptrn/icons`, with a `slot` attribute, for the HTML a Web Component user writes. The
 * demo state holds icon names, or icon elements inside item arrays; a name loads the icon's module (the same chunk
 * `SvgIcon` loads for the preview) and renders it to markup. Unknown names give an empty string, as an invalid icon
 * renders nothing in React.
 */
export async function iconHtml(name: unknown, slot = 'icon'): Promise<string> {
    // `width: null` drops the default `width="24"` the React icon sets; the element sizes the icon.
    const props = { slot: slot || undefined, width: null } as Record<string, unknown>;
    if (isValidElement(name)) return renderToStaticMarkup(cloneElement(name, props));
    if (typeof name !== 'string' || !isIconName(name)) return '';
    const module = await import(`../../../packages/icons/${name}.js`);
    const Svg = module[`Svg${name}`];
    return Svg ? renderToStaticMarkup(createElement(Svg, props)) : '';
}

/** A React icon element from the demo state, with `slot` set so it lands in the element's slot. */
export function slotted(node: ReactNode, slot = 'icon') {
    return isValidElement(node) ? cloneElement(node, { slot } as Record<string, unknown>) : null;
}

/** An HTML boolean attribute in JSX: present (`''`) when on, absent when off, never `"false"`. */
export const flag = (value: unknown) => (value ? '' : undefined);

export const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

export const escapeText = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/**
 * The attribute list of a tag, from name/value pairs: `true` writes the bare name, a string or number writes
 * `name="value"`, and `false`, `undefined`, `null` or `''` leave it out.
 */
export function attrs(entries: Record<string, unknown>) {
    const list = Object.entries(entries)
        .filter(([, value]) => value !== false && value !== undefined && value !== null && value !== '')
        .map(([key, value]) => (value === true ? key : `${key}="${escapeAttr(String(value))}"`));
    return list.length ? ` ${list.join(' ')}` : '';
}
