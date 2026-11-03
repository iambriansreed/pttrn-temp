import circle from '@ptrn/icons/Circle.svg?raw';
import diamond from '@ptrn/icons/Diamond.svg?raw';
import diamondFill from '@ptrn/icons/DiamondFill.svg?raw';
import square from '@ptrn/icons/Square.svg?raw';
import squareFill from '@ptrn/icons/SquareFill.svg?raw';
import { cloneElement, isValidElement, ReactNode } from 'react';

/**
 * Icon helpers for the demos of the tab lists (TabGroup, SegmentedControl), whose options carry icons. The live demo
 * receives icons as React elements; the HTML generator receives icon names and must answer synchronously, so it writes
 * out the raw SVG of the icons the presets use and points at the file for any other.
 */
const RAW: Record<string, string> = {
    Circle: circle,
    Diamond: diamond,
    DiamondFill: diamondFill,
    Square: square,
    SquareFill: squareFill,
};

/** A React icon from the demo state with `slot` set, so the SVG itself lands in the item's slot and takes its size. */
export function slottedIcon(icon: ReactNode, slot: string) {
    return isValidElement(icon) ? cloneElement(icon, { slot } as Record<string, unknown>) : null;
}

/** The HTML for an icon name in an item's `slot`, or an empty string when there is none. */
export function iconSlotHtml(icon: unknown, slot: string) {
    if (typeof icon !== 'string' || !icon) return '';
    const raw = RAW[icon];
    return raw
        ? raw.trim().replace('<svg', `<svg slot="${slot}"`)
        : `<!-- <svg slot="${slot}">: the raw SVG of @ptrn/icons/${icon}.svg -->`;
}
