import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { spec } from '../../react/src/components/Fab/spec';
import { icon } from './icons';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const BOLT = icon('Bolt');

/** A positioned box for the Fab to sit in, as the docs demo gives it. */
const box = (html: string) => `<div style="position: relative; height: 200px; width: 400px">${html}</div>`;

/** Mirrors the presets in `packages/react/src/components/Fab/FabExample.tsx` (the Button presets). */
const PRESETS = {
    'Icon & Text': box(`<pttrn-fab label="Add">${icon('Add')}</pttrn-fab>`),
    'Text only': box('<pttrn-fab label="Add"></pttrn-fab>'),
    'Icon only': box(`<pttrn-fab icon-only label="Add">${icon('Add')}</pttrn-fab>`),
};

const inner = (page: import('@playwright/test').Page) => page.locator('pttrn-fab [data-pttrn="fab"]');

test.describe('pttrn-fab', () => {
    test('sits in the corner of its container', async ({ page }) => {
        await mount(page, box('<pttrn-fab label="Compose"></pttrn-fab>'));
        const [container, fab] = await Promise.all([
            page.locator('div').first().boundingBox(),
            page.getByRole('button', { name: 'Compose' }).boundingBox(),
        ]);
        // 16 px (--usa-spacing-2) from the bottom right corner.
        expect(container!.x + container!.width - (fab!.x + fab!.width)).toBe(16);
        expect(container!.y + container!.height - (fab!.y + fab!.height)).toBe(16);
    });

    test('focus() on the element focuses the inner button', async ({ page }) => {
        await mount(page, box('<pttrn-fab label="Compose"></pttrn-fab>'));
        await page.locator('pttrn-fab').evaluate((el) => (el as HTMLElement).focus());
        await expect(page.getByRole('button', { name: 'Compose' })).toBeFocused();
    });
});

describeBehaviors(spec, {
    'labelled-button': async ({ page }) => {
        await mount(page, box('<pttrn-fab label="Compose"></pttrn-fab>'));
        await expect(page.getByRole('button', { name: 'Compose' })).toHaveText('Compose');

        await page.locator('pttrn-fab').evaluate((el) => el.setAttribute('aria-label', 'Write a message'));
        await expect(page.getByRole('button', { name: 'Write a message' })).toHaveText('Compose');
    },
    icon: async ({ page }) => {
        await mount(page, box(`<pttrn-fab label="Compose">${BOLT}</pttrn-fab>`));
        const fab = page.locator('pttrn-fab');
        await expect(fab.locator('[data-fab-icon]')).toHaveAttribute('aria-hidden', 'true');
        await expect(fab.locator('svg')).toBeVisible();
        await expect(fab.locator('[data-fab-label]')).toHaveText('Compose');
        await expect(inner(page)).not.toHaveAttribute('data-round');

        await fab.evaluate((el) => el.setAttribute('icon-only', ''));
        await expect(fab.locator('[data-fab-label]')).toHaveCount(0);
        await expect(inner(page)).toHaveAttribute('data-round', '');
        const round = await inner(page).boundingBox();
        expect(round!.width).toBe(round!.height);

        // Without an icon, iconOnly is ignored.
        await mount(page, box('<pttrn-fab icon-only label="Compose"></pttrn-fab>'));
        await expect(page.locator('pttrn-fab [data-fab-label]')).toHaveText('Compose');
        await expect(inner(page)).not.toHaveAttribute('data-round');
    },
    tooltip: async ({ page }) => {
        await mount(
            page,
            box('<pttrn-fab label="Compose" placement="bottom-left" tooltip="Write a message"></pttrn-fab>'),
        );
        const compose = page.getByRole('button', { name: 'Compose' });
        await expect(compose).toHaveAccessibleDescription('Write a message');
        await expect(compose).not.toHaveAttribute('aria-labelledby');
        await compose.hover();
        await expect(page.getByRole('tooltip')).toHaveText('Write a message');

        await mount(page, box(`<pttrn-fab icon-only label="Compose">${BOLT}</pttrn-fab>`));
        const round = page.getByRole('button', { name: 'Compose' });
        await expect(round).toHaveAttribute('aria-labelledby');
        await expect(round).not.toHaveAttribute('aria-describedby');
        await expect(page.getByRole('tooltip', { includeHidden: true })).toHaveText('Compose');

        await mount(page, box('<pttrn-fab label="Compose"></pttrn-fab>'));
        await expect(page.getByRole('tooltip', { includeHidden: true })).toHaveCount(0);
    },
    click: async ({ page }) => {
        await mount(page, box('<pttrn-fab label="Compose"></pttrn-fab>'));
        const clicks = await page.evaluateHandle(() => {
            const seen = { count: 0 };
            document.querySelector('pttrn-fab')!.addEventListener('click', () => seen.count++);
            return seen;
        });
        await page.getByRole('button', { name: 'Compose' }).click();
        await page.keyboard.press('Enter');
        expect(await clicks.evaluate((seen) => seen.count)).toBe(2);
    },
    placement: async ({ page }) => {
        await mount(page, box('<pttrn-fab label="Compose"></pttrn-fab>'));
        const fab = page.locator('pttrn-fab');
        await expect(fab).toHaveAttribute('placement', 'bottom-right');
        await expect(fab).toHaveAttribute('container', 'local');
        await expect(fab).toHaveCSS('position', 'absolute');

        await mount(page, box('<pttrn-fab container="page" label="Compose" placement="top-left"></pttrn-fab>'));
        await expect(fab).toHaveAttribute('placement', 'top-left');
        await expect(fab).toHaveAttribute('container', 'page');
        await expect(fab).toHaveCSS('position', 'fixed');
        const position = await page.getByRole('button', { name: 'Compose' }).boundingBox();
        expect([position!.x, position!.y]).toEqual([16, 16]);
    },
    'as-element': async ({ page }) => {
        await mount(page, box('<pttrn-fab href="#compose" label="Compose"></pttrn-fab>'));
        await expect(page.getByRole('link', { name: 'Compose' })).toHaveAttribute('href', '#compose');
        await expect(page.getByRole('button')).toHaveCount(0);
    },
    variants: async ({ page }) => {
        await mount(page, box('<pttrn-fab label="Compose"></pttrn-fab>'));
        const fab = page.locator('pttrn-fab');
        await expect(fab).toHaveAttribute('size', 'medium');
        await expect(fab).toHaveAttribute('variant', 'primary');
        expect((await inner(page).boundingBox())!.height).toBe(40);

        await mount(page, box('<pttrn-fab label="Compose" size="x-large" variant="secondary"></pttrn-fab>'));
        await expect(fab).toHaveAttribute('size', 'x-large');
        await expect(fab).toHaveAttribute('variant', 'secondary');
        expect((await inner(page).boundingBox())!.height).toBe(56);
    },
    'axe-clean': async ({ page }) => {
        for (const html of [
            ...Object.values(PRESETS),
            box(`<pttrn-fab icon-only label="Compose">${BOLT}</pttrn-fab>`),
        ]) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-fab').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
