import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/ProgressionStepperBar/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const bar = (attributes = '') => `<pttrn-progression-stepper-bar ${attributes}></pttrn-progression-stepper-bar>`;

/** The bar inside the shadow root, as the React suite reads `[data-pttrn="progression-stepper-bar"]`. */
const inner = (page: Page) => page.locator('pttrn-progression-stepper-bar [data-pttrn="progression-stepper-bar"]');

/** Which segments are marked complete, in order. */
const completed = (page: Page) =>
    page
        .locator('pttrn-progression-stepper-bar [data-step]')
        .evaluateAll((segments) => segments.map((segment) => segment.hasAttribute('data-complete')));

/** The React component has no example file; the docs demo and the React suite use these. */
const PRESETS = {
    'Partly complete': bar('step-count="4" step-completed="2"'),
    'Fully complete': bar('step-count="4" step-completed="4"'),
    Small: bar('step-count="5" step-completed="2" size="small"'),
};

test.describe('pttrn-progression-stepper-bar', () => {
    test('renders the count', async ({ page }) => {
        await mount(page, PRESETS['Partly complete']);
        await expect(page.getByText('2 of 4 steps completed.')).toBeVisible();
    });

    test('updates when the attributes change', async ({ page }) => {
        await mount(page, bar('step-count="3" step-completed="1"'));
        await page.locator('pttrn-progression-stepper-bar').evaluate((el) => {
            el.setAttribute('step-count', '5');
            el.setAttribute('step-completed', '4');
        });
        await expect(page.getByText('4 of 5 steps completed.')).toBeVisible();
        expect(await completed(page)).toEqual([true, true, true, true, false]);
    });

    test('segments are as tall as the size says', async ({ page }) => {
        await mount(page, `${bar('step-count="3"')}${bar('step-count="3" size="small"')}`);
        const heights = await page
            .locator('pttrn-progression-stepper-bar [data-step="0"]')
            .evaluateAll((segments) => segments.map((segment) => segment.getBoundingClientRect().height));
        // --usa-spacing-1 and --usa-spacing-05.
        expect(heights).toEqual([8, 4]);
    });
});

describeBehaviors(spec, {
    segments: async ({ page }) => {
        await mount(page, PRESETS['Partly complete']);
        expect(await completed(page)).toEqual([true, true, false, false]);
        await expect(inner(page)).toHaveAttribute('style', /--steps: 4/);
    },
    'count-text': async ({ page }) => {
        await mount(page, bar('step-count="3" step-completed="1"'));
        await expect(inner(page).locator('[data-label]')).toHaveText('1 of 3 steps completed.');
        await expect(inner(page).locator('[data-steps]')).toHaveAttribute('aria-hidden', 'true');
        await expect(inner(page)).not.toHaveAttribute('role');
        await expect(page.locator('pttrn-progression-stepper-bar')).not.toHaveAttribute('role');
        // The accessible text of the whole element is the count alone.
        const snapshot = await page.locator('pttrn-progression-stepper-bar').ariaSnapshot();
        expect(snapshot.trim()).toBe('- text: 1 of 3 steps completed.');
    },
    clamps: async ({ page }) => {
        await mount(page, bar('step-count="3" step-completed="-2"'));
        await expect(page.getByText('0 of 3 steps completed.')).toBeVisible();
        expect(await completed(page)).toEqual([false, false, false]);

        await mount(page, bar('step-count="3" step-completed="9"'));
        await expect(page.getByText('3 of 3 steps completed.')).toBeVisible();
        expect(await completed(page)).toEqual([true, true, true]);
    },
    sizes: async ({ page }) => {
        await mount(page, bar('step-count="3" step-completed="1"'));
        await expect(page.locator('pttrn-progression-stepper-bar')).toHaveAttribute('size', 'large');
        await expect(inner(page)).toHaveAttribute('data-size', 'large');

        await mount(page, bar('step-count="3" step-completed="1" size="small"'));
        await expect(page.locator('pttrn-progression-stepper-bar')).toHaveAttribute('size', 'small');
        await expect(inner(page)).toHaveAttribute('data-size', 'small');
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-progression-stepper-bar').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
