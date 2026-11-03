import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Carousel/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const carousel = (count = 3, attributes = 'label="Featured"') =>
    `<pttrn-carousel ${attributes}>${Array.from(
        { length: count },
        (_, i) =>
            `<div style="min-height: 120px">Slide content ${i + 1} <button type="button">Open ${i + 1}</button></div>`,
    ).join('')}</pttrn-carousel>`;

/** Mirrors the presets in `packages/react/src/components/Carousel/CarouselExample.tsx`, seven slides each. */
const PRESETS = {
    Mobile: carousel(7, 'label="Example label" item-width="90%" style="width: 375px"'),
    '300px Width': carousel(7, 'label="Example label" item-width="300px"'),
    'Full Width': carousel(7, 'label="Example label" item-width="100%"'),
    '3/4 Width': carousel(7, 'label="Example label" item-width="75%"'),
    '1/2 Width': carousel(7, 'label="Example label" item-width="50%"'),
    '1/4 Width': carousel(7, 'label="Example label" item-width="25%"'),
};

const slide = (page: Page, n: number, total = 3) => page.getByRole('group', { name: `Slide ${n} of ${total}` });
const next = (page: Page) => page.getByRole('button', { name: 'Next Slide' });
const previous = (page: Page) => page.getByRole('button', { name: 'Previous Slide' });
const live = (page: Page) => page.locator('pttrn-carousel [aria-live="polite"]');
/** The text of the child shown in a slide (its slot's assigned element). */
const slideText = (page: Page, n: number, total = 3) =>
    slide(page, n, total)
        .locator('slot')
        .evaluate((slot) => (slot as HTMLSlotElement).assignedElements()[0]?.textContent?.trim());

test.describe('pttrn-carousel', () => {
    test('each child is shown in its own slide', async ({ page }) => {
        await mount(page, carousel());
        for (const n of [1, 2, 3]) expect(await slideText(page, n)).toContain(`Slide content ${n}`);
        await expect(page.getByText('Slide content 2')).toBeVisible();
    });

    test('a slide added later joins the count', async ({ page }) => {
        await mount(page, carousel());
        await page.locator('pttrn-carousel').evaluate((el) => {
            const extra = document.createElement('div');
            extra.textContent = 'Slide content 4';
            el.append(extra);
        });
        await expect(slide(page, 4, 4)).toBeAttached();
        expect(await slideText(page, 4, 4)).toBe('Slide content 4');
        await expect(page.getByRole('img', { name: 'Page 1 of 4' })).toBeVisible();
    });

    test('slides are as wide as item-width and spaced by gap', async ({ page }) => {
        await mount(
            page,
            `<div style="width: 400px">${carousel(3, 'label="Featured" item-width="200" gap="10"')}</div>`,
        );
        const [first, second] = await page
            .locator('pttrn-carousel [data-item-wrapper]')
            .evaluateAll((slides) => slides.map((el) => el.getBoundingClientRect()));
        expect(first.width).toBe(200);
        expect(second.left - first.right).toBe(10);
    });

    test('the buttons show their labels as tooltips', async ({ page }) => {
        await mount(page, `<div style="padding-top: 80px">${carousel()}</div>`);
        await next(page).hover();
        await expect(page.getByRole('tooltip')).toHaveText('Next');
    });

    test('the page indicator shows at most five dots', async ({ page }) => {
        await mount(page, carousel(7));
        await expect(page.locator('pttrn-carousel [data-dot]')).toHaveCount(5);
    });
});

describeBehaviors(spec, {
    'renders-slides': async ({ page }) => {
        await mount(page, carousel());

        const region = page.getByRole('region', { name: 'Featured' });
        await expect(region).toHaveAttribute('aria-roledescription', 'carousel');
        for (const n of [1, 2, 3]) await expect(slide(page, n)).toHaveAttribute('aria-roledescription', 'slide');
        await expect(page.getByRole('img', { name: 'Page 1 of 3' })).toBeVisible();
    },
    'previous-next': async ({ page }) => {
        await mount(page, carousel());

        await expect(previous(page)).toBeDisabled();
        await next(page).click();
        await expect(slide(page, 2)).toHaveAttribute('data-active');
        await expect(previous(page)).toBeEnabled();

        await next(page).click();
        await expect(slide(page, 3)).toHaveAttribute('data-active');
        await expect(next(page)).toBeDisabled();

        await previous(page).click();
        await expect(slide(page, 2)).toHaveAttribute('data-active');
        await expect(page.getByRole('img', { name: 'Page 2 of 3' })).toBeVisible();
    },
    'arrow-keys': async ({ page }) => {
        await mount(page, carousel());

        await slide(page, 1).focus();
        await page.keyboard.press('ArrowRight');
        await expect(slide(page, 2)).toHaveAttribute('data-active');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await expect(slide(page, 3)).toHaveAttribute('data-active');
        await page.keyboard.press('ArrowLeft');
        await expect(slide(page, 2)).toHaveAttribute('data-active');

        // From inside a slide too.
        await page.getByRole('button', { name: 'Open 2' }).focus();
        await page.keyboard.press('ArrowLeft');
        await expect(slide(page, 1)).toHaveAttribute('data-active');
    },
    announces: async ({ page }) => {
        await mount(page, carousel());

        await expect(live(page)).toHaveText('Slide 1 of 3');
        await next(page).click();
        await expect(live(page)).toHaveText('Slide 2 of 3');
    },
    'active-focusable': async ({ page }) => {
        await mount(page, carousel());

        await expect(slide(page, 1)).toHaveAttribute('tabindex', '0');
        await expect(slide(page, 2)).toHaveAttribute('tabindex', '-1');
        await next(page).click();
        await expect(slide(page, 2)).toHaveAttribute('tabindex', '0');
        await expect(slide(page, 1)).toHaveAttribute('tabindex', '-1');
        await expect(slide(page, 2)).toBeFocused();

        // Tab reaches the active slide first, then what is inside it, then the controls.
        await mount(page, carousel());
        await page.keyboard.press('Tab');
        await expect(slide(page, 1)).toBeFocused();
    },
    'axe-clean': async ({ page }) => {
        for (const html of [carousel(), carousel(7), ...Object.values(PRESETS)]) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-carousel').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
