import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { spec } from '../../react/src/components/Menu/spec';
import { mount as mountQuirks } from './mount';
import { describeBehaviors } from './spec';
import type { Page } from '@playwright/test';

/** Standards mode: the list items are `height: 100%`, which a page with no doctype stretches to the viewport. */
const mount = (page: Page, html: string) => mountQuirks(page, `<!doctype html>${html}`);

const ICON = '<svg slot="leading" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" /></svg>';

/** Mirrors the demo in `packages/react/src/components/Menu/MenuExample.tsx`, with plain HTML for the avatar and switch. */
const PRESETS = {
    Default: `<pttrn-menu style="padding: var(--usa-spacing-1)">
        <pttrn-list-item label="Michael Scott" sub-text="michael.scott@email.com"></pttrn-list-item>
        <pttrn-divider inset="2"></pttrn-divider>
        <pttrn-list-item href="#/my-profile" label="My profile">${ICON}</pttrn-list-item>
        <pttrn-list-item href="#/settings" label="Settings">${ICON}</pttrn-list-item>
        <pttrn-divider inset="2" hide-padding></pttrn-divider>
        <pttrn-list-item href="#/help-center" label="Help center">${ICON}</pttrn-list-item>
        <pttrn-list-item label="Log out" role="button" clickable>${ICON}</pttrn-list-item>
    </pttrn-menu>`,
    'Role menu': `<pttrn-menu label="Account" role="menu">
        <pttrn-list-item label="Profile" role="menuitem" clickable></pttrn-list-item>
        <pttrn-list-item label="Settings" role="menuitem" clickable></pttrn-list-item>
    </pttrn-menu>`,
};

test.describe('pttrn-menu', () => {
    test('is the 332px panel React draws, with its list items filling it', async ({ page }) => {
        await mount(page, PRESETS['Role menu']);
        const menu = page.locator('pttrn-menu');
        expect((await menu.boundingBox())!.width).toBe(332);
        await expect(menu).toHaveCSS('border-top-width', '1px');
        const item = await page.getByRole('menuitem').first().boundingBox();
        expect(item!.width).toBe(330);
    });

    test('clearing label and width removes what the element set', async ({ page }) => {
        await mount(page, '<pttrn-menu label="Account" width="200px">Content</pttrn-menu>');
        const menu = page.locator('pttrn-menu');
        await menu.evaluate((el) => {
            el.removeAttribute('label');
            el.removeAttribute('width');
        });
        await expect(menu).not.toHaveAttribute('aria-label');
        expect((await menu.boundingBox())!.width).toBe(332);
    });
});

describeBehaviors(spec, {
    'renders-children': async ({ page }) => {
        await mount(
            page,
            '<pttrn-menu><pttrn-list-item label="First"></pttrn-list-item><pttrn-list-item label="Second"></pttrn-list-item></pttrn-menu>',
        );
        const [menu, first, second] = await Promise.all([
            page.locator('pttrn-menu').boundingBox(),
            page.getByText('First').boundingBox(),
            page.getByText('Second').boundingBox(),
        ]);
        for (const box of [first!, second!]) {
            expect(box.y).toBeGreaterThanOrEqual(menu!.y);
            expect(box.y + box.height).toBeLessThanOrEqual(menu!.y + menu!.height);
        }
    },
    labelled: async ({ page }) => {
        await mount(page, PRESETS['Role menu']);
        const menu = page.getByRole('menu', { name: 'Account' });
        await expect(menu).toBeVisible();
        expect(await menu.evaluate((el) => el.localName)).toBe('pttrn-menu');
    },
    'as-element': async ({ page }) => {
        // `as` has no counterpart: the element takes the role the other tag would have.
        await mount(
            page,
            '<pttrn-menu label="Site" role="navigation"><pttrn-list-item href="#home" label="Home"></pttrn-list-item></pttrn-menu>',
        );
        await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    },
    width: async ({ page }) => {
        await mount(page, '<pttrn-menu width="240px">Content</pttrn-menu>');
        expect((await page.locator('pttrn-menu').boundingBox())!.width).toBe(240);
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-menu').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
