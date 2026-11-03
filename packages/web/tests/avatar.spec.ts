import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Avatar/spec';
import { tokenColor, tokenLength } from './computed';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** A 1px image, so the tests need no file. */
const IMAGE = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

/** Mirrors the presets in `packages/react/src/components/Avatar/AvatarExample.tsx`. */
const PRESETS = {
    'Name Only': '<pttrn-avatar name="Andre Giant"></pttrn-avatar>',
    'One Word Name': '<pttrn-avatar name="Andre"></pttrn-avatar>',
    'With Initials': '<pttrn-avatar name="Andre The Giant" initials="AG"></pttrn-avatar>',
    'With Icon': '<pttrn-avatar name="Andre Giant" show-icon></pttrn-avatar>',
    'With Image': `<pttrn-avatar name="Andre Giant" image="${IMAGE}"></pttrn-avatar>`,
};

const avatar = (page: Page) => page.locator('pttrn-avatar [data-pttrn="avatar"]');

/** Counts the clicks that reach the element, as a consumer's listener would see them. */
const countClicks = (page: Page) =>
    page.evaluate(() => {
        const host = document.querySelector('pttrn-avatar')!;
        (window as unknown as { clicks: number }).clicks = 0;
        host.addEventListener('click', () => (window as unknown as { clicks: number }).clicks++);
    });
const clicks = (page: Page) => page.evaluate(() => (window as unknown as { clicks: number }).clicks);

test.describe('pttrn-avatar', () => {
    test('takes its size and colors from the tokens', async ({ page }) => {
        await mount(page, '<pttrn-avatar name="Andre Giant" size="large" color="info"></pttrn-avatar>');
        const size = await tokenLength(page, '--usa-spacing-6');
        await expect(avatar(page)).toHaveCSS('width', size);
        await expect(avatar(page)).toHaveCSS('height', size);
        await expect(avatar(page)).toHaveCSS('background-color', await tokenColor(page, '--theme-color-info-lighter'));
        await expect(avatar(page)).toHaveCSS('color', await tokenColor(page, '--theme-color-info-darker'));
    });

    test('renders nothing without a name, initials, icon or image', async ({ page }) => {
        await mount(page, '<pttrn-avatar></pttrn-avatar>');
        await expect(avatar(page)).toHaveCount(0);
    });

    test('Enter and Space click a clickable avatar', async ({ page }) => {
        await mount(page, '<pttrn-avatar name="Andre Giant" clickable show-icon></pttrn-avatar>');
        await countClicks(page);
        await page.keyboard.press('Tab');
        await expect(page.getByRole('button', { name: 'Andre Giant' })).toBeFocused();
        await page.keyboard.press('Enter');
        await page.keyboard.press('Space');
        expect(await clicks(page)).toBe(2);
    });
});

describeBehaviors(spec, {
    named: async ({ page }) => {
        await mount(page, PRESETS['Name Only']);
        const image = page.getByRole('img', { name: 'Andre Giant' });
        await expect(image).toHaveAttribute('data-pttrn', 'avatar');
        await expect(image).toHaveAttribute('aria-roledescription', 'person');
    },
    initials: async ({ page }) => {
        const initials = page.locator('pttrn-avatar [data-initials]');
        await mount(page, '<pttrn-avatar name="Andre The Giant"></pttrn-avatar>');
        await expect(initials).toHaveText('AT');

        await mount(page, PRESETS['One Word Name']);
        await expect(initials).toHaveText('A');

        await mount(page, '<pttrn-avatar name="Andre Giant" initials="xyz"></pttrn-avatar>');
        await expect(initials).toHaveText('xy');
    },
    'image-and-icon': async ({ page }) => {
        await mount(page, `<pttrn-avatar name="Andre Giant" image="${IMAGE}" show-icon></pttrn-avatar>`);
        await expect(avatar(page).locator('img')).toHaveAttribute('src', IMAGE);
        await expect(avatar(page).locator('img')).toHaveAttribute('aria-hidden', 'true');
        await expect(avatar(page).locator('[data-icon]')).toHaveCount(0);

        await mount(page, PRESETS['With Icon']);
        await expect(avatar(page).locator('[data-icon]')).toHaveAttribute('aria-hidden', 'true');
        await expect(avatar(page).locator('[data-icon] svg')).toHaveCount(1);
        await expect(avatar(page).locator('[data-initials]')).toHaveCount(0);

        await mount(page, PRESETS['Name Only']);
        await expect(avatar(page).locator('[data-initials]')).toHaveAttribute('aria-hidden', 'true');
    },
    clickable: async ({ page }) => {
        await mount(page, '<pttrn-avatar name="Andre Giant" clickable show-icon></pttrn-avatar>');
        await countClicks(page);
        const button = page.getByRole('button', { name: 'Andre Giant' });
        await expect(button).toHaveAttribute('tabindex', '0');
        await button.click();
        expect(await clicks(page)).toBe(1);
    },
    disabled: async ({ page }) => {
        await mount(page, '<pttrn-avatar name="Andre Giant" clickable disabled show-icon></pttrn-avatar>');
        await countClicks(page);
        const button = page.getByRole('button', { name: 'Andre Giant' });
        await expect(button).toHaveAttribute('aria-disabled', 'true');
        await expect(button).not.toHaveAttribute('tabindex');
        await button.click({ force: true });
        await page.keyboard.press('Tab');
        await expect(button).not.toBeFocused();
        expect(await clicks(page)).toBe(0);
    },
    tooltip: async ({ page }) => {
        await mount(page, `<div style="padding: 60px">${PRESETS['Name Only']}</div>`);
        // Hidden until hovered, and naming the avatar all the same.
        const tooltip = page.getByRole('tooltip', { includeHidden: true });
        await expect(tooltip).toHaveText('Andre Giant');
        await expect(avatar(page)).toHaveAttribute('aria-labelledby', (await tooltip.getAttribute('id'))!);
        await expect(tooltip).toBeHidden();
        await avatar(page).hover();
        await expect(tooltip).toBeVisible();
        expect((await tooltip.boundingBox())!.y).toBeLessThan((await avatar(page).boundingBox())!.y);
        await page.mouse.move(0, 0);
        await expect(tooltip).toBeHidden();

        await mount(page, '<pttrn-avatar name="Andre Giant" hide-tooltip></pttrn-avatar>');
        await expect(page.getByRole('tooltip', { includeHidden: true })).toHaveCount(0);
        await expect(page.getByRole('img', { name: 'Andre Giant' })).toBeVisible();
    },
    'label-in-name': async ({ page }) => {
        await mount(page, '<pttrn-avatar name="Andre Giant" clickable></pttrn-avatar>');
        const button = page.getByRole('button', { name: 'AG, Andre Giant' });
        const tooltip = page.getByRole('tooltip', { includeHidden: true });
        await expect(button).toHaveAttribute('aria-describedby', (await tooltip.getAttribute('id'))!);
        await expect(button).not.toHaveAttribute('aria-labelledby');
        await expect(button).toHaveAccessibleDescription('Andre Giant');
    },
    focusable: async ({ page }) => {
        await mount(page, '<pttrn-avatar name="Andre Giant" focusable></pttrn-avatar>');
        const image = page.getByRole('img', { name: 'Andre Giant' });
        await expect(image).toHaveAttribute('tabindex', '0');
        await expect(page.getByRole('button')).toHaveCount(0);
        // Focus shows the tooltip, which is why it is in the tab order.
        await page.keyboard.press('Tab');
        await expect(image).toBeFocused();
        await expect(page.getByRole('tooltip')).toBeVisible();
    },
    'axe-clean': async ({ page }) => {
        for (const html of [...Object.values(PRESETS), '<pttrn-avatar name="Andre Giant" clickable></pttrn-avatar>']) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-avatar').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
