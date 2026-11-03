import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Skeleton/spec';
import { tokenLength } from './computed';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** Mirrors the presets in `packages/react/src/components/Skeleton/SkeletonExample.tsx`, plus each variant. */
const PRESETS = {
    'Loading Transition': '<pttrn-skeleton width="100px" height="100px"></pttrn-skeleton>',
    ...Object.fromEntries(
        ['rectangular', 'circular', 'photo', 'profile', 'thumbnail'].map((variant) => [
            variant,
            `<pttrn-skeleton variant="${variant}"></pttrn-skeleton>`,
        ]),
    ),
};

const placeholder = (page: Page) => page.locator('pttrn-skeleton [data-pttrn="skeleton"]');
const size = async (page: Page) => {
    const box = (await placeholder(page).boundingBox())!;
    return { width: box.width, height: box.height };
};

test.describe('pttrn-skeleton', () => {
    test('shows the content once it arrives, in place of the placeholder', async ({ page }) => {
        await mount(page, PRESETS['Loading Transition']);
        await expect(page.getByRole('status', { name: 'Loading' })).toBeVisible();
        await page.locator('pttrn-skeleton').evaluate((host) => (host.innerHTML = '<p>Loaded</p>'));
        await expect(page.getByText('Loaded')).toBeVisible();
        await expect(page.getByRole('status')).toHaveCount(0);
    });

    test('each variant has its shape', async ({ page }) => {
        const spacing = async (token: `--${string}`) => parseFloat(await tokenLength(page, token));
        await mount(page, '<pttrn-skeleton variant="circular" width="60"></pttrn-skeleton>');
        expect(await size(page)).toEqual({ width: 60, height: 60 });
        await expect(placeholder(page)).toHaveCSS('border-radius', '100%');

        await mount(page, '<pttrn-skeleton variant="profile" width="300" height="300"></pttrn-skeleton>');
        const profile = await spacing('--usa-spacing-5');
        expect(await size(page)).toEqual({ width: profile, height: profile });

        await mount(page, '<pttrn-skeleton variant="thumbnail" width="300" height="300"></pttrn-skeleton>');
        const thumbnail = await spacing('--usa-spacing-6');
        expect(await size(page)).toEqual({ width: thumbnail, height: thumbnail });

        await mount(page, '<pttrn-skeleton variant="photo" width="10" height="10"></pttrn-skeleton>');
        const minimum = await spacing('--usa-spacing-4');
        expect(await size(page)).toEqual({ width: minimum, height: minimum });
    });

    test('pulses unless the visitor asks for reduced motion', async ({ page }) => {
        await mount(page, PRESETS['Loading Transition']);
        await expect(placeholder(page)).toHaveCSS('animation-name', 'skeleton-pulse');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await expect(placeholder(page)).toHaveCSS('animation-name', 'none');
    });
});

describeBehaviors(spec, {
    'shows-placeholder': async ({ page }) => {
        await mount(page, '<pttrn-skeleton></pttrn-skeleton>');
        const status = page.getByRole('status', { name: 'Loading' });
        await expect(status).toHaveAttribute('data-pttrn', 'skeleton');
        await expect(status).toHaveAttribute('aria-busy', 'true');
        expect(await size(page)).toEqual({ width: 100, height: 100 });
    },
    size: async ({ page }) => {
        await mount(page, '<pttrn-skeleton width="200" height="40"></pttrn-skeleton>');
        await expect(placeholder(page)).toHaveAttribute('style', /--height: ?40px;.*--width: ?200px/);
        expect(await size(page)).toEqual({ width: 200, height: 40 });

        await mount(
            page,
            '<div style="width: 400px"><pttrn-skeleton width="50%" height="4rem"></pttrn-skeleton></div>',
        );
        await expect(placeholder(page)).toHaveAttribute('style', /--height: ?4rem;.*--width: ?50%/);
        expect(await size(page)).toEqual({ width: 200, height: 64 });
    },
    variant: async ({ page }) => {
        await mount(page, '<pttrn-skeleton></pttrn-skeleton>');
        await expect(placeholder(page)).toHaveAttribute('data-variant', 'rectangular');

        await mount(page, '<pttrn-skeleton variant="circular"></pttrn-skeleton>');
        await expect(placeholder(page)).toHaveAttribute('data-variant', 'circular');
    },
    'shows-content': async ({ page }) => {
        await mount(page, '<pttrn-skeleton><p>Loaded</p></pttrn-skeleton>');
        await expect(page.getByText('Loaded')).toBeVisible();
        await expect(placeholder(page)).toHaveCount(0);
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-skeleton').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
