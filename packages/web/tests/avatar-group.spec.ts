import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/AvatarGroup/spec';
import { tokenLength } from './computed';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const IMAGE = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const PEOPLE = ['Fezzik', 'Inigo Montoya', 'Miracle Max', 'Princess Buttercup', 'Westley', 'Valerie'];

const group = (people: string[], attributes = '') =>
    `<pttrn-avatar-group ${attributes}>${people.map((name) => `<pttrn-avatar name="${name}"></pttrn-avatar>`).join('')}</pttrn-avatar-group>`;

/** Mirrors the presets in `packages/react/src/components/AvatarGroup/AvatarGroupExample.tsx`. */
const PRESETS = {
    Stacked: `<pttrn-avatar-group max="10" variant="stacked">
        <pttrn-avatar name="Fezzik" image="${IMAGE}"></pttrn-avatar>
        <pttrn-avatar name="Inigo Montoya" initials="IM" color="info"></pttrn-avatar>
        <pttrn-avatar name="Miracle Max" initials="MM" color="success"></pttrn-avatar>
        <pttrn-avatar name="Princess Buttercup" show-icon color="accent-cool"></pttrn-avatar>
    </pttrn-avatar-group>`,
    'Stacked With Overflow': group(
        Array.from({ length: 11 }, (_, index) => `Person ${index + 1}`),
        'max="5" variant="stacked"',
    ),
};

const overflow = (page: Page) => page.getByRole('button', { name: /more avatars?$/ });

test.describe('pttrn-avatar-group', () => {
    test('stacked avatars overlap by a spacing unit and spread ones keep one apart', async ({ page }) => {
        const unit = async () => parseFloat(await tokenLength(page, '--usa-spacing-1'));
        const lefts = () =>
            page
                .locator('pttrn-avatar [data-pttrn="avatar"]')
                .evaluateAll((all) => all.map((avatar) => avatar.getBoundingClientRect().left));
        await mount(page, group(PEOPLE.slice(0, 3)));
        const stacked = await lefts();
        expect(stacked[1] - stacked[0]).toBe(32 - (await unit()));
        // A page-level reset (`* { margin: 0 }`, as the docs site loads) must not undo the overlap.
        await page.addStyleTag({ path: path.resolve(import.meta.dirname, '../../styles/reset.css') });
        const reset = await lefts();
        expect(reset[1] - reset[0]).toBe(stacked[1] - stacked[0]);

        await mount(page, group(PEOPLE.slice(0, 3), 'variant="spread"'));
        const spread = await lefts();
        expect(spread[1] - spread[0]).toBe(32 + (await unit()));
    });

    test('the menu lists people added after it rendered', async ({ page }) => {
        await mount(page, group(PEOPLE.slice(0, 5), 'max="4"'));
        await expect(overflow(page)).toHaveAccessibleName('+1 more avatar');
        await page
            .locator('pttrn-avatar-group')
            .evaluate((element) =>
                element.insertAdjacentHTML('beforeend', '<pttrn-avatar name="Valerie"></pttrn-avatar>'),
            );
        await expect(overflow(page)).toHaveAccessibleName('+2 more avatars');
    });

    test('tabbing out of the menu closes it', async ({ page }) => {
        await mount(page, `${group(PEOPLE, 'max="4"')}<button>After</button>`);
        await overflow(page).click();
        await expect(page.getByRole('menu')).toBeVisible();
        await page.keyboard.press('Tab');
        await expect(page.getByRole('menu')).toHaveCount(0);
    });
});

describeBehaviors(spec, {
    'renders-avatars': async ({ page }) => {
        await mount(page, group(PEOPLE.slice(0, 3)));
        for (const name of PEOPLE.slice(0, 3)) {
            await expect(page.getByRole('img', { name })).toHaveAttribute('tabindex', '0');
        }
        await expect(page.getByRole('button', { name: /more avatars/ })).toHaveCount(0);
    },
    'overflow-button': async ({ page }) => {
        await mount(page, group(PEOPLE, 'max="4"'));
        await expect(page.getByRole('img')).toHaveCount(4);
        await expect(page.getByRole('button')).toHaveCount(1);
        await expect(overflow(page)).toHaveAccessibleName('+2 more avatars');
        await expect(overflow(page)).toHaveAttribute('aria-haspopup', 'menu');
        await expect(overflow(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(page.getByRole('img', { name: 'Westley' })).toHaveCount(0);
    },
    'opens-menu': async ({ page }) => {
        await mount(page, group(PEOPLE, 'max="4"'));
        await overflow(page).click();
        const menu = page.getByRole('menu', { name: '2 more avatars' });
        await expect(menu).toBeVisible();
        await expect(overflow(page)).toHaveAttribute('aria-expanded', 'true');
        await expect(overflow(page)).toHaveAttribute('aria-controls', (await menu.getAttribute('id'))!);
        // Named from their text, with the decorative avatar hidden.
        await expect(page.getByRole('menuitem')).toHaveCount(2);
        await expect(page.getByRole('menuitem').nth(0)).toHaveAccessibleName('Westley');
        await expect(page.getByRole('menuitem').nth(1)).toHaveAccessibleName('Valerie');
        // Below the button, as React's menu opens.
        expect((await menu.boundingBox())!.y).toBeGreaterThan((await overflow(page).boundingBox())!.y);
    },
    'menu-keyboard': async ({ page }) => {
        await mount(page, group(PEOPLE, 'max="4"'));
        await overflow(page).focus();
        await page.keyboard.press('Enter');
        const [first, second] = [page.getByRole('menuitem').nth(0), page.getByRole('menuitem').nth(1)];
        await expect(first).toBeFocused();

        await page.keyboard.press('ArrowDown');
        await expect(second).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(first).toBeFocused();
        await page.keyboard.press('ArrowUp');
        await expect(second).toBeFocused();

        await page.keyboard.press('Escape');
        await expect(page.getByRole('menu')).toHaveCount(0);
        await expect(overflow(page)).toBeFocused();

        // ArrowDown on the button opens it too.
        await page.keyboard.press('ArrowDown');
        await expect(first).toBeFocused();
    },
    'outside-click-closes': async ({ page }) => {
        await mount(page, `${group(PEOPLE, 'max="4"')}<p>Outside</p>`);
        await overflow(page).click();
        await expect(page.getByRole('menu')).toBeVisible();
        await page.getByText('Outside').click();
        await expect(page.getByRole('menu')).toHaveCount(0);
    },
    variants: async ({ page }) => {
        const root = page.locator('pttrn-avatar-group [data-pttrn="avatar-group"]');
        await mount(page, group(PEOPLE.slice(0, 2), 'max="5"'));
        await expect(root).toHaveAttribute('data-variant', 'stacked');
        await expect(root).toHaveAttribute('data-size', 'small');
        await expect(root).toHaveAttribute('data-max', '2');

        await mount(page, group(PEOPLE.slice(0, 2), 'size="large" variant="spread"'));
        await expect(root).toHaveAttribute('data-variant', 'spread');
        await expect(root).toHaveAttribute('data-size', 'large');
        // Every avatar takes the group's size.
        await expect(page.locator('pttrn-avatar [data-pttrn="avatar"]').first()).toHaveAttribute('data-size', 'large');
    },
    empty: async ({ page }) => {
        await mount(page, '<pttrn-avatar-group></pttrn-avatar-group>');
        await expect(page.locator('pttrn-avatar-group [data-pttrn="avatar-group"]')).toHaveCount(0);
        expect((await page.locator('pttrn-avatar-group').boundingBox())?.width ?? 0).toBe(0);
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-avatar-group').analyze();
            expect(results.violations).toEqual([]);
        }
        await mount(page, group(PEOPLE, 'max="4"'));
        await overflow(page).click();
        await expect(page.getByRole('menu')).toBeVisible();
        const results = await new AxeBuilder({ page }).include('pttrn-avatar-group').analyze();
        expect(results.violations).toEqual([]);
    },
});
