import { expect, test } from '@playwright/test';
import { COLOR_THEMES } from '@ptrn/react/utils/uiContext';

import { webComponents } from '../../src/wc/names';
import { componentsWithDemo, gotoUrl } from '../utils';

/**
 * Visual regression: a screenshot of every component's main example in every theme, and of the Web Component tab where
 * one exists, compared with the baselines committed in `__screenshots__/`. A difference fails the test and the report
 * shows expected, actual and diff side by side.
 *
 * The baselines are rendered on Linux (CI's platform). Update them with `npm run test:visual:update` on Linux, or with
 * the "Update visual baselines" workflow, which uploads a fresh set as an artifact to commit. PTTRN_THEME narrows the
 * run to one theme.
 */
const requested = process.env.PTTRN_THEME;
const themes = requested ? COLOR_THEMES.filter((theme) => theme === requested) : [...COLOR_THEMES];

if (requested && themes.length === 0) {
    throw new Error(`PTTRN_THEME=${requested} is not a theme. Known themes: ${COLOR_THEMES.join(', ')}`);
}

const RENDER = '[data-main-example] [data-example-render]';

for (const theme of themes) {
    test.describe(`theme: ${theme}`, () => {
        for (const component of componentsWithDemo) {
            const frameworks = webComponents.includes(component.name) ? ['react', 'web-component'] : ['react'];

            for (const framework of frameworks) {
                const label = framework === 'react' ? component.name : `${component.name} (Web Component)`;

                test(`${label} looks the same`, async ({ page }) => {
                    await gotoUrl(page, `/${component.slug}?theme=${theme}&framework=${framework}`);

                    await expect(page.locator('html'), 'the page applied the requested theme').toHaveAttribute(
                        'data-uswds-theme',
                        theme,
                    );

                    const render = page.locator(RENDER).first();
                    await render.waitFor();
                    // Fonts load asynchronously and the demo may animate in; settle before the shot.
                    await page.evaluate(() => document.fonts.ready);
                    await page.waitForTimeout(250);

                    await expect(render).toHaveScreenshot(`${component.slug}-${framework}-${theme}.png`);
                });
            }
        }
    });
}
