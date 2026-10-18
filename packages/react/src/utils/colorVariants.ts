/**
 * The USWDS theme color families. A component with `data-color="<variant>"` uses that family's lighter shade as its
 * background and darker shade as its text (see `src/styles/_color-variants.scss`).
 */
export const COLOR_VARIANTS = [
    'base',
    'primary',
    'secondary',
    'accent-cool',
    'accent-warm',
    'info',
    'success',
    'warning',
    'error',
] as const;
export type ColorVariant = (typeof COLOR_VARIANTS)[number];
