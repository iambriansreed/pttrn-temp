import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/ProgressCircle/spec';
import { tokenColor } from './computed';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** ProgressCircle has no example file in React; these are the sizes its suite renders. */
const circle = (attributes = '') =>
    `<pttrn-progress-circle label="Loading results" ${attributes}></pttrn-progress-circle>`;
const PRESETS = Object.fromEntries(['small', 'medium', 'large'].map((size) => [size, circle(`size="${size}"`)]));

const progressbar = (page: Page) => page.getByRole('progressbar');
const container = (page: Page) => page.locator('pttrn-progress-circle [data-pttrn="progress-circle"]');
const ring = (page: Page) => page.locator('pttrn-progress-circle svg');

test.describe('pttrn-progress-circle', () => {
    test('sizes the ring and its label together, in the secondary color', async ({ page }) => {
        const label = page.getByText('Loading results');
        for (const [size, width, font] of [
            ['small', 32, '14px'],
            ['medium', 40, '16px'],
            ['large', 48, '18px'],
        ] as const) {
            await mount(page, circle(`size="${size}"`));
            // The computed width: the bounding box of a spinning ring grows as it turns.
            await expect(ring(page)).toHaveCSS('width', `${width}px`);
            await expect(label).toHaveCSS('font-size', font);
        }
        await expect(ring(page)).toHaveCSS('color', await tokenColor(page, '--theme-color-secondary-dark'));
    });

    test('places the label around the ring', async ({ page }) => {
        const label = page.getByText('Loading results');
        const at = async () => ({ ring: (await ring(page).boundingBox())!, label: (await label.boundingBox())! });

        await mount(page, circle());
        let boxes = await at();
        expect(boxes.label.y).toBeGreaterThan(boxes.ring.y);

        await mount(page, circle('label-position="top"'));
        boxes = await at();
        expect(boxes.label.y).toBeLessThan(boxes.ring.y);

        await mount(page, circle('label-position="left"'));
        boxes = await at();
        expect(boxes.label.x).toBeLessThan(boxes.ring.x);

        await mount(page, circle('label-position="right"'));
        boxes = await at();
        expect(boxes.label.x).toBeGreaterThan(boxes.ring.x);
    });

    test('the ring stops under reduced motion', async ({ page }) => {
        // The suite runs with reduced motion (playwright.config.ts); this test needs the default first.
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await mount(page, circle());
        await expect(ring(page)).toHaveCSS('animation-name', 'spin');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await expect(ring(page)).toHaveCSS('animation-name', 'none');
    });
});

describeBehaviors(spec, {
    'renders-label': async ({ page }) => {
        await mount(page, circle());
        await expect(progressbar(page)).toHaveAccessibleName('Loading results');
        await expect(progressbar(page)).toHaveAttribute('data-pttrn', 'progress-circle');
        await expect(progressbar(page).getByText('Loading results')).toBeVisible();
    },
    'default-label': async ({ page }) => {
        await mount(page, '<pttrn-progress-circle label=""></pttrn-progress-circle>');
        await expect(progressbar(page)).toHaveAccessibleName('Loading ...');
    },
    indeterminate: async ({ page }) => {
        await mount(page, circle());
        await expect(progressbar(page)).not.toHaveAttribute('aria-valuenow');
        await expect(progressbar(page)).not.toHaveAttribute('aria-valuemin');
        await expect(progressbar(page)).not.toHaveAttribute('aria-valuemax');
    },
    size: async ({ page }) => {
        await mount(page, circle());
        await expect(container(page)).toHaveAttribute('data-size', 'medium');

        await mount(page, PRESETS.small);
        await expect(container(page)).toHaveAttribute('data-size', 'small');

        await mount(page, PRESETS.large);
        await expect(container(page)).toHaveAttribute('data-size', 'large');
    },
    'label-position': async ({ page }) => {
        await mount(page, circle());
        await expect(container(page)).not.toHaveAttribute('data-label-position');

        await mount(page, circle('label-position="right"'));
        await expect(container(page)).toHaveAttribute('data-label-position', 'right');
    },
    'ring-animated': async ({ page }) => {
        await mount(page, circle());
        await expect(ring(page)).toHaveAttribute('data-animated');
        await expect(ring(page).locator('path')).toHaveCount(3);
        expect(await container(page).evaluate((element) => !!element.querySelector('svg'))).toBe(true);
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-progress-circle').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
