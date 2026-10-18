import { AxeBuilder } from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import { COLOR_THEMES } from '@ptrn/react/utils/uiContext';

import { gotoUrl, componentsWithDemo } from '../utils';

/**
 * The accessibility matrix: axe-core on every component's main example in every theme.
 *
 * PTTRN_THEME narrows the run to one theme so CI can run the themes as parallel jobs. Each test asserts the theme the
 * page actually applied before scanning, so a broken query string fails loudly instead of scanning the default theme
 * for every row of the matrix.
 */
const requested = process.env.PTTRN_THEME;
const themes = requested ? COLOR_THEMES.filter((theme) => theme === requested) : [...COLOR_THEMES];

if (requested && themes.length === 0) {
    throw new Error(`PTTRN_THEME=${requested} is not a theme. Known themes: ${COLOR_THEMES.join(', ')}`);
}

for (const theme of themes) {
    test.describe(`theme: ${theme}`, () => {
        for (const component of componentsWithDemo) {
            test(`${component.name} has no automatically detectable accessibility violations`, async ({
                page,
            }, testInfo) => {
                await gotoUrl(page, `/${component.slug}?theme=${theme}`);

                await expect(page.locator('html'), 'the page applied the requested theme').toHaveAttribute(
                    'data-uswds-theme',
                    theme,
                );

                const renderSelector = '[data-main-example] [data-example-render]';
                await page.locator(renderSelector).first().waitFor();

                const results = await new AxeBuilder({ page }).include(renderSelector).analyze();

                if (results.violations.length > 0) {
                    await testInfo.attach(`axe-violations-${component.slug}-${theme}.json`, {
                        body: JSON.stringify(results.violations, null, 2),
                        contentType: 'application/json',
                    });
                }

                expect(results.violations).toEqual([]);
            });
        }
    });
}
