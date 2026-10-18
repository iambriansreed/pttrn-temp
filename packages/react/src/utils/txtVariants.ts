/**
 * The Txt variants, each built from the USWDS type tokens in @ptrn/styles. USWDS has no line-height tokens, so line
 * heights are pixel values.
 */
export const TXT_STYLES = {
    'body-base': {
        weight: 400,
        size: 'var(--usa-font-size-sans-5)',
        lineHeight: '24px',
        family: 'var(--usa-font-family-body)',
    },
    'body-large': {
        weight: 400,
        size: 'var(--usa-font-size-sans-7)',
        lineHeight: '28px',
        family: 'var(--usa-font-family-body)',
    },
    'body-small': {
        weight: 400,
        size: 'var(--usa-font-size-sans-3)',
        lineHeight: '20px',
        family: 'var(--usa-font-family-body)',
    },
    'body-x-small': {
        weight: 400,
        size: 'var(--usa-font-size-sans-1)',
        lineHeight: '16px',
        family: 'var(--usa-font-family-body)',
    },
    'labels-base': {
        weight: 500,
        size: 'var(--usa-font-size-sans-5)',
        lineHeight: '24px',
        family: 'var(--usa-font-family-ui)',
    },
    'labels-large': {
        weight: 500,
        size: 'var(--usa-font-size-sans-7)',
        lineHeight: '28px',
        family: 'var(--usa-font-family-ui)',
    },
    'labels-small': {
        weight: 500,
        size: 'var(--usa-font-size-sans-3)',
        lineHeight: '20px',
        family: 'var(--usa-font-family-ui)',
    },
    'labels-x-small': {
        weight: 500,
        size: 'var(--usa-font-size-sans-1)',
        lineHeight: '16px',
        family: 'var(--usa-font-family-ui)',
    },
    'display-regular-large': {
        weight: 400,
        size: 'var(--usa-font-size-sans-17)',
        lineHeight: '88px',
        family: 'var(--usa-font-family-heading)',
    },
    'display-regular-medium': {
        weight: 400,
        size: 'var(--usa-font-size-sans-16)',
        lineHeight: '72px',
        family: 'var(--usa-font-family-heading)',
    },
    'display-regular-small': {
        weight: 400,
        size: 'var(--usa-font-size-sans-15)',
        lineHeight: '60px',
        family: 'var(--usa-font-family-heading)',
    },
    'display-semibold-large': {
        weight: 600,
        size: 'var(--usa-font-size-sans-16)',
        lineHeight: '72px',
        family: 'var(--usa-font-family-heading)',
    },
    'display-semibold-medium': {
        weight: 600,
        size: 'var(--usa-font-size-sans-15)',
        lineHeight: '60px',
        family: 'var(--usa-font-family-heading)',
    },
    'display-semibold-small': {
        weight: 600,
        size: 'var(--usa-font-size-sans-14)',
        lineHeight: '48px',
        family: 'var(--usa-font-family-heading)',
    },
    'heading-h1': {
        weight: 600,
        size: 'var(--usa-font-size-sans-14)',
        lineHeight: '48px',
        family: 'var(--usa-font-family-heading)',
    },
    'heading-h2': {
        weight: 600,
        size: 'var(--usa-font-size-sans-12)',
        lineHeight: '40px',
        family: 'var(--usa-font-family-heading)',
    },
    'heading-h3': {
        weight: 600,
        size: 'var(--usa-font-size-sans-11)',
        lineHeight: '36px',
        family: 'var(--usa-font-family-heading)',
    },
    'heading-h4': {
        weight: 600,
        size: 'var(--usa-font-size-sans-10)',
        lineHeight: '32px',
        family: 'var(--usa-font-family-heading)',
    },
    'heading-h5': {
        weight: 600,
        size: 'var(--usa-font-size-sans-8)',
        lineHeight: '28px',
        family: 'var(--usa-font-family-heading)',
    },
    'heading-h6': {
        weight: 500,
        size: 'var(--usa-font-size-sans-7)',
        lineHeight: '24px',
        family: 'var(--usa-font-family-heading)',
    },
    'subheader-medium': {
        weight: 400,
        size: 'var(--usa-font-size-sans-8)',
        lineHeight: '28px',
        family: 'var(--usa-font-family-heading)',
    },
    'subheader-large': {
        weight: 400,
        size: 'var(--usa-font-size-sans-10)',
        lineHeight: '32px',
        family: 'var(--usa-font-family-heading)',
    },
    'subheader-x-large': {
        weight: 400,
        size: 'var(--usa-font-size-sans-11)',
        lineHeight: '36px',
        family: 'var(--usa-font-family-heading)',
    },
    'subheader-xx-large': {
        weight: 400,
        size: 'var(--usa-font-size-sans-12)',
        lineHeight: '40px',
        family: 'var(--usa-font-family-heading)',
    },
    'subheader-xxx-large': {
        weight: 400,
        size: 'var(--usa-font-size-sans-12)',
        lineHeight: '40px',
        family: 'var(--usa-font-family-heading)',
    },
} as const;

export const TXT_VARIANTS = Object.keys(TXT_STYLES) as TxtVariant[];
export type TxtVariant = keyof typeof TXT_STYLES;

/** The CSS `font` shorthand for a Txt variant. */
export function txtFont(variant: TxtVariant) {
    const { weight, size, lineHeight, family } = TXT_STYLES[variant];
    return `${weight} ${size} / ${lineHeight} ${family}`;
}
