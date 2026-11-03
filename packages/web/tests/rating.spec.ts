import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Rating/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** Mirrors the presets in `packages/react/src/components/Rating/RatingExample.tsx`. */
const PRESETS = {
    'Read Only, No Value': '<pttrn-rating></pttrn-rating>',
    'Read Only': '<pttrn-rating value="4.5"></pttrn-rating>',
    Interactive: '<pttrn-rating interactive></pttrn-rating>',
    'Interactive with a value': '<pttrn-rating interactive value="3" size="large"></pttrn-rating>',
};

const stars = (page: Page) => page.locator('pttrn-rating [data-pttrn="rating"] > [data-star]');
const radio = (page: Page, n: number) => page.getByRole('radio', { name: `Rate ${n}` });
const attributeOf = (page: Page, name: string) =>
    stars(page).evaluateAll((all, attribute) => all.map((star) => star.getAttribute(attribute)), name);

/** Collects `detail.value` of every `pttrn-change`. */
async function recordChanges(page: Page) {
    await page.evaluate(() => {
        const seen: number[] = [];
        (window as unknown as { seen: number[] }).seen = seen;
        document.addEventListener('pttrn-change', (event) => seen.push((event as CustomEvent).detail.value));
    });
    return () => page.evaluate(() => (window as unknown as { seen: number[] }).seen);
}

test.describe('pttrn-rating', () => {
    test('an interactive rating submits its name and value with a form and resets', async ({ page }) => {
        await mount(
            page,
            '<form><pttrn-rating interactive name="stars" value="2"></pttrn-rating><button type="reset">Reset</button></form>',
        );
        const entries = () => page.evaluate(() => [...new FormData(document.querySelector('form')!).entries()]);
        expect(await entries()).toEqual([['stars', '2']]);
        await radio(page, 5).click();
        expect(await entries()).toEqual([['stars', '5']]);
        await page.getByRole('button', { name: 'Reset' }).click();
        await expect(radio(page, 2)).toBeChecked();
    });

    test('a read-only rating submits nothing', async ({ page }) => {
        await mount(page, '<form><pttrn-rating name="stars" value="4"></pttrn-rating></form>');
        expect(await page.evaluate(() => [...new FormData(document.querySelector('form')!).entries()])).toEqual([]);
    });

    test('the star sizes follow size', async ({ page }) => {
        for (const [size, box] of [
            ['small', 24],
            ['medium', 32],
            ['large', 40],
        ] as const) {
            await mount(page, `<pttrn-rating size="${size}" value="3"></pttrn-rating>`);
            const first = (await stars(page).first().boundingBox())!;
            expect([first.width, first.height]).toEqual([box, box]);
        }
    });
});

describeBehaviors(spec, {
    'read-only-image': async ({ page }) => {
        await mount(page, PRESETS['Read Only']);
        const image = page.getByRole('img', { name: '4.5 out of 5 stars' });
        await expect(image).toHaveAttribute('data-pttrn', 'rating');
        await expect(page.getByRole('radio')).toHaveCount(0);

        await mount(page, PRESETS['Read Only, No Value']);
        await expect(page.getByRole('img', { name: 'Rating' })).toBeVisible();
    },
    fills: async ({ page }) => {
        await mount(page, PRESETS['Read Only']);
        expect(await attributeOf(page, 'data-fill')).toEqual(['full', 'full', 'full', 'full', 'half']);
        const half = (await stars(page).nth(4).locator('[data-fill-half]').boundingBox())!;
        const star = (await stars(page).nth(4).boundingBox())!;
        expect(half.width).toBe(star.width / 2);

        await mount(page, '<pttrn-rating value="2"></pttrn-rating>');
        expect(await attributeOf(page, 'data-fill')).toEqual(['full', 'full', null, null, null]);
    },
    radiogroup: async ({ page }) => {
        await mount(page, '<pttrn-rating interactive value="3"></pttrn-rating>');
        await expect(page.getByRole('radiogroup', { name: '3 out of 5 stars' })).toBeVisible();
        expect(await attributeOf(page, 'aria-label')).toEqual(['Rate 1', 'Rate 2', 'Rate 3', 'Rate 4', 'Rate 5']);
        await expect(radio(page, 3)).toBeChecked();
        await expect(page.getByRole('radio', { checked: true })).toHaveCount(1);

        await mount(page, PRESETS.Interactive);
        await expect(page.getByRole('radiogroup', { name: 'Select a star rating' })).toBeVisible();
        await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
    },
    choose: async ({ page }) => {
        await mount(page, PRESETS.Interactive);
        const log = await recordChanges(page);
        await radio(page, 4).click();
        expect(await log()).toEqual([4]);
        await expect(radio(page, 4)).toBeChecked();
        await expect(page.getByRole('radiogroup', { name: '4 out of 5 stars' })).toBeVisible();
        await page.keyboard.press('Enter');
        await radio(page, 2).focus();
        await page.keyboard.press('Space');
        expect((await log()).at(-1)).toBe(2);
    },
    keyboard: async ({ page }) => {
        await mount(page, PRESETS.Interactive);
        const log = await recordChanges(page);
        await page.keyboard.press('Tab');
        await expect(radio(page, 1)).toBeFocused();
        expect(await attributeOf(page, 'tabindex')).toEqual(['0', '-1', '-1', '-1', '-1']);

        await page.keyboard.press('ArrowRight');
        expect((await log()).at(-1)).toBe(1);
        await page.keyboard.press('ArrowRight');
        expect((await log()).at(-1)).toBe(2);
        await expect(radio(page, 2)).toBeChecked();
        await expect(radio(page, 2)).toBeFocused();
        expect(await attributeOf(page, 'tabindex')).toEqual(['-1', '0', '-1', '-1', '-1']);

        await page.keyboard.press('ArrowLeft');
        expect((await log()).at(-1)).toBe(1);
        await expect(radio(page, 1)).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        expect((await log()).at(-1)).toBe(1);
    },
    sizes: async ({ page }) => {
        await mount(page, '<pttrn-rating value="3"></pttrn-rating>');
        await expect(page.getByRole('img')).toHaveAttribute('data-size', 'medium');
        await mount(page, '<pttrn-rating size="large" value="3"></pttrn-rating>');
        await expect(page.getByRole('img')).toHaveAttribute('data-size', 'large');
        await expect(page.locator('pttrn-rating')).toHaveAttribute('size', 'large');
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-rating').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
