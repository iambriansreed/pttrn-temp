import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { spec } from '../../react/src/components/Card/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const CONTENT = '<h3 id="card-title">Card Title</h3><p>This is some content inside the card.</p>';

const card = (page: import('@playwright/test').Page) => page.locator('pttrn-card');

test.describe('pttrn-card', () => {
    test('a page style on the element wins over its own', async ({ page }) => {
        await mount(page, `<style>pttrn-card { border-radius: 0; }</style><pttrn-card>${CONTENT}</pttrn-card>`);
        await expect(card(page)).toHaveCSS('border-radius', '0px');
    });

    test('draws a shadow when elevated and a border when outlined', async ({ page }) => {
        await mount(page, `<pttrn-card>${CONTENT}</pttrn-card>`);
        await expect(card(page)).not.toHaveCSS('box-shadow', 'none');
        await expect(card(page)).toHaveCSS('border-top-width', '0px');

        await mount(page, `<pttrn-card variant="outlined">${CONTENT}</pttrn-card>`);
        await expect(card(page)).toHaveCSS('box-shadow', 'none');
        await expect(card(page)).toHaveCSS('border-top-width', '1px');
    });
});

describeBehaviors(spec, {
    'renders-children': async ({ page }) => {
        await mount(page, `<pttrn-card>${CONTENT}</pttrn-card>`);
        await expect(card(page).getByText('Card Title')).toBeVisible();
        await expect(card(page).getByText('This is some content inside the card.')).toBeVisible();
    },
    variants: async ({ page }) => {
        await mount(page, '<pttrn-card>Content</pttrn-card>');
        await expect(card(page)).toHaveAttribute('variant', 'elevated');

        await mount(page, '<pttrn-card variant="outlined">Content</pttrn-card>');
        await expect(card(page)).toHaveAttribute('variant', 'outlined');
    },
    'passes-attributes': async ({ page }) => {
        await mount(
            page,
            `<pttrn-card aria-labelledby="card-title" data-testid="card" role="region" style="width: 400px">${CONTENT}</pttrn-card>`,
        );
        const region = page.getByRole('region', { name: 'Card Title' });
        await expect(region).toHaveAttribute('data-testid', 'card');
        expect(await region.evaluate((el) => el.tagName)).toBe('PTTRN-CARD');
        expect((await region.boundingBox())!.width).toBe(400);
    },
    'inner-ref': async ({ page }) => {
        // The element is the card: a reference to it is the box with the card's surface.
        await mount(page, '<pttrn-card>Content</pttrn-card>');
        const box = await card(page).evaluate((el) => {
            const style = getComputedStyle(el);
            return { radius: style.borderRadius, display: style.display, overflow: style.overflow };
        });
        expect(box).toEqual({ radius: '8px', display: 'block', overflow: 'hidden' });
    },
    'axe-clean': async ({ page }) => {
        await mount(page, `<pttrn-card aria-labelledby="card-title" role="region">${CONTENT}</pttrn-card>`);
        const results = await new AxeBuilder({ page }).include('pttrn-card').analyze();
        expect(results.violations).toEqual([]);
    },
});
