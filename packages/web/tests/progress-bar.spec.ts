import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/ProgressBar/spec';
import { tokenColor, tokenLength } from './computed';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** ProgressBar has no example file in React; these are the cases its suite renders. */
const bar = (attributes = '') =>
    `<div style="width: 400px"><pttrn-progress-bar label="Uploading" ${attributes.includes('completion=') ? attributes : `completion="50" ${attributes}`}></pttrn-progress-bar></div>`;
const PRESETS = {
    'In progress': bar(),
    Complete: bar('completion="100" align="left" size="small"'),
};

const progressbar = (page: Page) => page.getByRole('progressbar');
const container = (page: Page) => page.locator('pttrn-progress-bar [data-pttrn="progress-bar"]');
const fill = (page: Page) =>
    page.locator('pttrn-progress-bar [data-bar]').evaluate((element) => {
        const after = getComputedStyle(element, '::after');
        return { width: after.width, color: after.backgroundColor };
    });

test.describe('pttrn-progress-bar', () => {
    test('draws the completion as the width of the fill, in the primary color', async ({ page }) => {
        await mount(page, bar('completion="25"'));
        expect(await fill(page)).toEqual({
            width: '100px',
            color: await tokenColor(page, '--theme-color-primary-medium'),
        });
        await expect(page.locator('pttrn-progress-bar [data-bar]')).toHaveCSS(
            'height',
            await tokenLength(page, '--usa-spacing-1'),
        );
    });

    test('follows a completion set from code', async ({ page }) => {
        await mount(page, bar());
        await page
            .locator('pttrn-progress-bar')
            .evaluate((element) => ((element as HTMLElement & { completion: number }).completion = 80));
        await expect(progressbar(page)).toHaveAttribute('aria-valuenow', '80');
    });
});

describeBehaviors(spec, {
    'renders-label': async ({ page }) => {
        await mount(page, bar());
        await expect(progressbar(page)).toHaveAccessibleName('Uploading');
        await expect(progressbar(page)).toHaveJSProperty('tagName', 'PROGRESS');
        await expect(page.getByText('Uploading')).toHaveJSProperty('tagName', 'LABEL');
    },
    value: async ({ page }) => {
        await mount(page, bar('completion="42.4"'));
        await expect(progressbar(page)).toHaveAttribute('aria-valuenow', '42');
        await expect(progressbar(page)).toHaveAttribute('value', '42');
        await expect(progressbar(page)).toHaveJSProperty('value', 42);
        await expect(progressbar(page)).toHaveAttribute('max', '100');
        await expect(progressbar(page)).toHaveAttribute('aria-valuemin', '0');
        await expect(progressbar(page)).toHaveAttribute('aria-valuemax', '100');
        const drawn = page.locator('pttrn-progress-bar [data-bar]');
        await expect(drawn).toHaveAttribute('aria-hidden', 'true');
        await expect(drawn).toHaveAttribute('style', /--width: ?42%/);

        await mount(page, bar('completion="0"'));
        await expect(progressbar(page)).toHaveAttribute('aria-valuenow', '0');
    },
    clamps: async ({ page }) => {
        await mount(page, bar('completion="-20"'));
        await expect(progressbar(page)).toHaveAttribute('aria-valuenow', '0');

        await mount(page, bar('completion="250"'));
        await expect(progressbar(page)).toHaveAttribute('aria-valuenow', '100');
    },
    busy: async ({ page }) => {
        await mount(page, bar('completion="99"'));
        await expect(progressbar(page)).toHaveAttribute('aria-busy', 'true');

        await mount(page, bar('completion="100"'));
        await expect(progressbar(page)).toHaveAttribute('aria-busy', 'false');
    },
    layout: async ({ page }) => {
        await mount(page, bar());
        await expect(container(page)).toHaveAttribute('data-size', 'large');
        await expect(container(page)).toHaveAttribute('data-align', 'center');
        await expect(page.getByText('Uploading')).toHaveCSS('text-align', 'center');

        await mount(page, bar('align="left" size="small"'));
        await expect(container(page)).toHaveAttribute('data-size', 'small');
        await expect(container(page)).toHaveAttribute('data-align', 'left');
        await expect(page.getByText('Uploading')).toHaveCSS('text-align', 'left');
        await expect(page.locator('pttrn-progress-bar [data-bar]')).toHaveCSS(
            'height',
            await tokenLength(page, '--usa-spacing-05'),
        );
    },
    success: async ({ page }) => {
        await mount(page, bar('completion="100"'));
        await expect(container(page)).not.toHaveAttribute('data-success');

        await mount(page, bar('completion="100" success-color'));
        await expect(container(page)).toHaveAttribute('data-success', 'color');
        expect((await fill(page)).color).toBe(await tokenColor(page, '--theme-color-success-medium'));

        await mount(page, bar('completion="99" success-color'));
        await expect(container(page)).not.toHaveAttribute('data-success');

        await mount(page, bar('completion="100" success-hidden'));
        await expect(container(page)).toHaveCount(0);
        await expect(progressbar(page)).toHaveCount(0);
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-progress-bar').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
