import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Link/spec';
import { tokenColor } from './computed';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** The React example has no presets; these are its usage and the variants its demo shows. */
const PRESETS = {
    Default: '<pttrn-link href="https://example.com" label="Example" trailing-icon="external"></pttrn-link>',
    Subtle: '<pttrn-link href="/a" label="Subtle" variant="subtle" size="small"></pttrn-link>',
    'Subtle inverse': `<div style="background: black; padding: 8px">
        <pttrn-link href="/a" label="Inverse" variant="subtle-inverse" size="large" trailing-icon="chevron"></pttrn-link>
    </div>`,
};

const link = (page: Page) => page.getByRole('link');

test.describe('pttrn-link', () => {
    test('takes its colors from the link tokens', async ({ page }) => {
        await mount(page, '<pttrn-link href="#fresh-target" label="Example"></pttrn-link>');
        await expect(link(page)).toHaveCSS('color', await tokenColor(page, '--component-link-color'));
        await link(page).hover();
        await expect(link(page)).toHaveCSS('color', await tokenColor(page, '--component-link-hover-color'));

        await page.mouse.move(0, 0);
        await mount(page, '<pttrn-link href="/a" label="Subtle" variant="subtle"></pttrn-link>');
        await expect(link(page)).toHaveCSS('color', await tokenColor(page, '--theme-body-text-color'));
        await expect(link(page)).toHaveCSS('text-decoration-line', 'none');
    });

    test('Enter follows the link', async ({ page }) => {
        await mount(page, '<pttrn-link href="#done" label="Jump"></pttrn-link>');
        await page.keyboard.press('Tab');
        await expect(link(page)).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(/#done$/);
    });

    test('a disabled link is greyed out and ignores the pointer', async ({ page }) => {
        await mount(page, '<pttrn-link href="/a" label="Off" disabled></pttrn-link>');
        await expect(link(page)).toHaveAttribute('disabled', '');
        await expect(link(page)).toHaveCSS('pointer-events', 'none');
        await expect(link(page)).toHaveCSS('color', await tokenColor(page, '--theme-color-disabled-dark'));
    });
});

describeBehaviors(spec, {
    'renders-link': async ({ page }) => {
        await mount(page, '<pttrn-link href="/pricing" label="Pricing"></pttrn-link>');
        await expect(page.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '/pricing');
    },
    external: async ({ page }) => {
        await mount(page, PRESETS.Default);
        await expect(link(page)).toHaveAttribute('target', '_blank');
        await expect(link(page)).toHaveAccessibleName('Example (opens in a new tab)');
        // Visually the label alone.
        await expect(page.getByText('(opens in a new tab)')).toHaveCSS('position', 'absolute');
    },
    target: async ({ page }) => {
        await mount(page, '<pttrn-link href="/a" label="A"></pttrn-link>');
        await expect(link(page)).toHaveAttribute('target', '_self');

        await mount(page, '<pttrn-link href="/a" label="A" target="_parent"></pttrn-link>');
        await expect(link(page)).toHaveAttribute('target', '_parent');
    },
    'trailing-icon': async ({ page }) => {
        await mount(page, '<pttrn-link href="/next" label="Next" trailing-icon="chevron"></pttrn-link>');
        await expect(link(page)).toHaveAttribute('data-trailing-icon', 'chevron');
        const icon = link(page).locator('[data-link-icon]');
        await expect(icon).toHaveAttribute('aria-hidden', 'true');
        await expect(icon.locator('svg')).toHaveCount(1);
        // After the label.
        expect((await icon.boundingBox())!.x).toBeGreaterThan((await page.getByText('Next').boundingBox())!.x);
        await expect(link(page)).toHaveAccessibleName('Next');
    },
    variants: async ({ page }) => {
        await mount(page, '<pttrn-link href="/a" label="A" size="small" variant="subtle"></pttrn-link>');
        await expect(link(page)).toHaveAttribute('data-size', 'small');
        await expect(link(page)).toHaveAttribute('data-subtle');
        await expect(link(page)).toHaveCSS('font-size', '14px');

        await mount(page, PRESETS['Subtle inverse']);
        await expect(link(page)).toHaveAttribute('data-size', 'large');
        await expect(link(page)).toHaveAttribute('data-subtle-inverse');
        await expect(link(page)).toHaveCSS('color', await tokenColor(page, '--theme-color-ink-reverse'));
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-link').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
