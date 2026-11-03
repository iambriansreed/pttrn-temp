import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Txt/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** Txt has no example file in React; these are its usage and the cases its suite renders. */
const PRESETS = {
    Default: '<pttrn-txt>Example Txt</pttrn-txt>',
    Paragraph: '<pttrn-txt as="p">Example content</pttrn-txt>',
    Heading: '<pttrn-txt as="h2" variant="heading-h2">Section</pttrn-txt>',
    Skeleton: '<pttrn-txt skeleton-lines="3"></pttrn-txt>',
};

const element = (page: Page) => page.locator('pttrn-txt [data-pttrn="txt"]');

test.describe('pttrn-txt', () => {
    test('shows the content once it arrives, in place of the skeleton', async ({ page }) => {
        await mount(page, PRESETS.Skeleton);
        await expect(page.getByRole('status', { name: 'Loading' })).toBeVisible();
        await page.locator('pttrn-txt').evaluate((host) => (host.textContent = 'Loaded'));
        await expect(page.getByText('Loaded')).toBeVisible();
        await expect(page.getByRole('status')).toHaveCount(0);
    });

    test('an element `as` cannot name renders a span', async ({ page }) => {
        await mount(page, '<pttrn-txt as="script">Text</pttrn-txt>');
        await expect(element(page)).toHaveJSProperty('tagName', 'SPAN');
    });

    test('lays out as the element it renders', async ({ page }) => {
        await mount(
            page,
            `<div style="width: 300px">Before ${PRESETS.Default} after<pttrn-txt as="p">Block</pttrn-txt></div>`,
        );
        await expect(page.locator('pttrn-txt').first()).toHaveCSS('display', 'contents');
        await expect(element(page).first()).toHaveCSS('display', 'inline');
        expect((await element(page).nth(1).boundingBox())!.width).toBe(300);
    });
});

describeBehaviors(spec, {
    'renders-text': async ({ page }) => {
        await mount(page, '<pttrn-txt>Example content</pttrn-txt>');
        await expect(element(page)).toHaveJSProperty('tagName', 'SPAN');
        await expect(element(page)).toBeVisible();
        await expect(page.locator('pttrn-txt')).toHaveText('Example content');
    },
    'renders-elements': async ({ page }) => {
        await mount(page, '<pttrn-txt as="h4"><code>&lt;pttrn-accordion&gt;</code></pttrn-txt>');
        // The code element is slotted into the heading, and names it.
        await expect(page.getByRole('heading', { level: 4, name: '<pttrn-accordion>' })).toBeVisible();
        await expect(page.locator('pttrn-txt > code')).toHaveText('<pttrn-accordion>');
        await expect(page.locator('pttrn-txt > code')).toBeVisible();

        await mount(page, '<pttrn-txt>Hello <b>pttrn</b></pttrn-txt>');
        await expect(page.locator('pttrn-txt')).toHaveText('Hello pttrn');
    },
    'as-element': async ({ page }) => {
        await mount(page, PRESETS.Heading);
        const heading = page.getByRole('heading', { level: 2, name: 'Section' });
        await expect(heading).toBeVisible();
        await expect(heading).toHaveAttribute('data-pttrn', 'txt');
    },
    'variant-font': async ({ page }) => {
        await mount(
            page,
            '<div style="font: 700 30px / 40px serif"><pttrn-txt variant="labels-small">Label</pttrn-txt></div>',
        );
        const font = await page.evaluate(() => {
            const probe = document.createElement('span');
            probe.style.font = '500 var(--usa-font-size-sans-3) / 20px var(--usa-font-family-ui)';
            document.body.append(probe);
            return getComputedStyle(probe).font;
        });
        await expect(element(page)).toHaveCSS('font', font);

        await mount(
            page,
            '<div style="font: 700 30px / 40px serif"><pttrn-txt variant="labels-small" inherit>Label</pttrn-txt></div>',
        );
        await expect(element(page)).toHaveCSS('font', '700 30px / 40px serif');
    },
    'skeleton-fallback': async ({ page }) => {
        await mount(page, '<pttrn-txt skeleton-lines="2"></pttrn-txt>');
        const status = page.getByRole('status', { name: 'Loading' });
        await expect(status).toHaveAttribute('data-pttrn', 'skeleton-text');
        await expect(status.locator('[data-line]')).toHaveCount(2);
        await expect(element(page)).toBeHidden();
    },
    empty: async ({ page }) => {
        await mount(page, '<div id="around"><pttrn-txt></pttrn-txt></div>');
        await expect(element(page)).toBeHidden();
        await expect(page.getByRole('status')).toHaveCount(0);
        expect((await page.locator('#around').boundingBox())!.height).toBe(0);
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-txt').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
