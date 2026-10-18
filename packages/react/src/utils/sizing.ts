/** Pixel values on the USWDS spacing scale, each with the `--usa-spacing-*` token that holds it. */
const USA_SPACING = {
    '0': '0',
    '4': '05',
    '8': '1',
    '12': '105',
    '16': '2',
    '20': '205',
    '24': '3',
    '32': '4',
    '40': '5',
    '48': '6',
    '56': '7',
    '64': '8',
    '72': '9',
    '80': '10',
    '120': '15',
} as const;

export const SIZING_VALUES = Object.keys(USA_SPACING) as SizingPixels[];

export type SizingPixels = keyof typeof USA_SPACING;

export function numToSizingVar(numStr?: string): string | undefined {
    if (numStr === undefined || ['auto', '0'].includes(numStr)) return numStr;

    if (!(numStr in USA_SPACING)) return undefined;

    return `var(--usa-spacing-${USA_SPACING[numStr as SizingPixels]})`;
}
