import { execSync } from 'child_process';
import fs from 'fs';

import { AxeBuilder } from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import { COLOR_THEMES } from '@ptrn/react/utils/uiContext';

import { gotoUrl, components } from '../utils';

for (const component of components) {
    for (const theme of COLOR_THEMES) {
        test(`${component.name} / ${theme} should not have automatically detectable accessibility violations`, async ({
            page,
        }) => {
            await gotoUrl(page, `/${component.slug}?theme=${theme}`);

            const renderSelector = '[data-main-example] [data-example-render]';
            await page.locator(renderSelector).first().waitFor();

            const accessibilityScanResults = await new AxeBuilder({ page }).include(renderSelector).analyze();

            const violationsPath = `./src/accessibility-violations/${component.slug}-${theme}.ts`;

            if (accessibilityScanResults.violations.length > 0) {
                fs.writeFileSync(
                    violationsPath,
                    `export const violations = ${JSON.stringify(accessibilityScanResults.violations, null, 2)}`,
                );
                execSync(`npx prettier --write "${violationsPath}"`, { stdio: 'inherit' });
                execSync(`npx eslint --fix "${violationsPath}"`, { stdio: 'inherit' });
            } else {
                if (fs.existsSync(violationsPath)) fs.unlinkSync(violationsPath);
            }

            expect(accessibilityScanResults.violations).toEqual([]);

            console.info(`Pass ${component.name}`);
        });
    }
}
