import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/SkeletonText/spec';
import { tokenLength } from './computed';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** Mirrors the presets in `packages/react/src/components/SkeletonText/SkeletonTextExample.tsx`. */
const PRESETS = {
    Default: '<pttrn-skeleton-text></pttrn-skeleton-text>',
    'Loading Transition': '<pttrn-skeleton-text variant="body-base" lines="3"></pttrn-skeleton-text>',
};

const placeholder = (page: Page) => page.locator('pttrn-skeleton-text [data-pttrn="skeleton-text"]');
const lines = (page: Page) => placeholder(page).locator('[data-line]');

test.describe('pttrn-skeleton-text', () => {
    test('shows the text once it arrives, in place of the placeholder', async ({ page }) => {
        await mount(page, PRESETS['Loading Transition']);
        await expect(page.getByRole('status', { name: 'Loading' })).toBeVisible();
        await page.locator('pttrn-skeleton-text').evaluate((host) => (host.innerHTML = '<p>Loaded text</p>'));
        await expect(page.getByText('Loaded text')).toBeVisible();
        await expect(page.getByRole('status')).toHaveCount(0);
    });

    test('the last of several lines is shorter', async ({ page }) => {
        await mount(page, '<div style="width: 500px"><pttrn-skeleton-text lines="2"></pttrn-skeleton-text></div>');
        const widths = await lines(page).evaluateAll((all) => all.map((line) => line.getBoundingClientRect().width));
        expect(widths).toEqual([500, 400]);

        await mount(page, '<div style="width: 500px"><pttrn-skeleton-text lines="1"></pttrn-skeleton-text></div>');
        expect((await lines(page).first().boundingBox())!.width).toBe(500);
    });

    test('pulses unless the visitor asks for reduced motion', async ({ page }) => {
        await mount(page, PRESETS.Default);
        await expect(placeholder(page)).toHaveCSS('animation-name', 'skeleton-pulse');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await expect(placeholder(page)).toHaveCSS('animation-name', 'none');
    });
});

describeBehaviors(spec, {
    'shows-lines': async ({ page }) => {
        await mount(page, '<pttrn-skeleton-text lines="4" variant="heading-h3"></pttrn-skeleton-text>');
        await expect(lines(page)).toHaveCount(4);
        // heading-h3 is the sans-11 size on a 36px line: bars that tall, with the rest of the line between them.
        const size = await tokenLength(page, '--usa-font-size-sans-11');
        await expect(lines(page).first()).toHaveCSS('height', size);
        await expect(placeholder(page)).toHaveCSS('row-gap', `${36 - parseFloat(size)}px`);
    },
    'at-least-one-line': async ({ page }) => {
        await mount(page, '<pttrn-skeleton-text lines="0"></pttrn-skeleton-text>');
        await expect(lines(page)).toHaveCount(1);
    },
    'announces-loading': async ({ page }) => {
        await mount(page, PRESETS.Default);
        const status = page.getByRole('status', { name: 'Loading' });
        await expect(status).toHaveAttribute('data-pttrn', 'skeleton-text');
        await expect(status).toHaveAttribute('aria-busy', 'true');
        await expect(lines(page)).toHaveCount(3);
    },
    'shows-content': async ({ page }) => {
        await mount(page, '<pttrn-skeleton-text><p>Loaded</p></pttrn-skeleton-text>');
        await expect(page.getByText('Loaded')).toBeVisible();
        await expect(placeholder(page)).toHaveCount(0);
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-skeleton-text').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
