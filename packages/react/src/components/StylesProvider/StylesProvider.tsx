import '@ptrn/styles/fonts.css';
import '@ptrn/styles/tokens.css';
import '@ptrn/styles/themes/project-theme.css';
import '@ptrn/styles/themes/project-theme-dark.css';
import '@ptrn/styles/themes/default.css';
import '-/styles/base.scss';
import { ReactElement } from 'react';

/**
 * Loads the USWDS fonts, design tokens, every USWDS theme and the base styles.
 *
 * The page uses the `default` theme until a `data-uswds-theme` attribute picks another one. UIProvider sets that
 * attribute on `<html>` from its `theme`.
 *
 * @example
 *     import { StylesProvider } from '@ptrn/react/StylesProvider';
 *
 *     <StylesProvider />;
 *
 * @name StylesProvider
 * @phase Utility
 */
export function StylesProvider(): ReactElement | null {
    return null;
}
