import '@ptrn/styles/tokens.css';
import '@ptrn/styles/themes/project-theme.css';
import '@ptrn/styles/themes/project-theme-dark.css';
import '@ptrn/styles/themes/default.css';
import '-/styles/base.scss';
import { ReactElement } from 'react';

/**
 * Loads the design tokens, every USWDS theme and the base styles.
 *
 * It does not load the fonts: import `@ptrn/styles/fonts.css` once in the app's entry so the bundler ships the font
 * files, or link `@ptrn/styles/fonts.google.css` on a page without a bundler. Fonts injected at runtime cannot be
 * resolved by the browser.
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
