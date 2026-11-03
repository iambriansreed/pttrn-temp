import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Badge/spec';
import { tokenColor, tokenLength } from './computed';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const BUTTON = '<button type="button" aria-label="Messages, 5 unread">Messages</button>';

/**
 * Mirrors `packages/react/src/components/Badge/BadgeExample.tsx`: attached to an element, with the surfaceBorder by
 * color and the size by count variants.
 */
const PRESETS = {
    Default: `<pttrn-badge count="5">${BUTTON}</pttrn-badge>`,
    Alone: '<pttrn-badge count="5"></pttrn-badge>',
    'Surface border, secondary': `<pttrn-badge count="5" color="secondary" surface-border>${BUTTON}</pttrn-badge>`,
    'x-small, 999': `<pttrn-badge count="999" size="x-small">${BUTTON}</pttrn-badge>`,
};

const badge = (page: Page) => page.locator('pttrn-badge [data-pttrn="badge"]');

const style = (page: Page) =>
    badge(page).evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
            height: computed.height,
            border: computed.borderTopWidth,
            background: computed.backgroundColor,
            color: computed.color,
        };
    });

test.describe('pttrn-badge', () => {
    test('shows and hides as the count is set and removed', async ({ page }) => {
        await mount(page, `<pttrn-badge>${BUTTON}</pttrn-badge>`);
        await expect(badge(page)).toHaveCount(0);
        await page.locator('pttrn-badge').evaluate((element) => element.setAttribute('count', '3'));
        await expect(badge(page)).toHaveText('3');
        await expect(badge(page)).toHaveAttribute('data-attachment');
        await page.locator('pttrn-badge').evaluate((element) => element.removeAttribute('count'));
        await expect(badge(page)).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Messages, 5 unread' })).toBeVisible();
    });

    test('a removed color or size renders the default again', async ({ page }) => {
        await mount(page, '<pttrn-badge count="5" color="secondary" size="x-small"></pttrn-badge>');
        await page.locator('pttrn-badge').evaluate((element) => {
            element.removeAttribute('color');
            element.removeAttribute('size');
        });
        await expect(badge(page)).toHaveAttribute('data-color', 'primary');
        await expect(badge(page)).toHaveAttribute('data-size', 'small');
    });

    test('a count that is not a number shows no badge', async ({ page }) => {
        await mount(page, `<pttrn-badge count="many">${BUTTON}</pttrn-badge>`);
        await expect(badge(page)).toHaveCount(0);
    });
});

describeBehaviors(spec, {
    'renders-count': async ({ page }) => {
        await mount(page, PRESETS.Alone);
        await expect(badge(page)).toHaveText('5');
        await expect(badge(page)).toHaveJSProperty('tagName', 'SUP');
        await expect(badge(page)).not.toHaveAttribute('data-attachment');
    },
    'no-count': async ({ page }) => {
        await mount(page, '<pttrn-badge><span>Messages</span></pttrn-badge>');
        await expect(page.getByText('Messages')).toBeVisible();
        await expect(badge(page)).toHaveCount(0);
        await expect(page.locator('pttrn-badge [data-attachment-wrapper]')).toHaveCount(0);
    },
    'caps-at-99': async ({ page }) => {
        await mount(page, '<pttrn-badge count="99"></pttrn-badge>');
        await expect(badge(page)).toHaveText('99');
        await page
            .locator('pttrn-badge')
            .evaluate((element) => ((element as HTMLElement & { count: number }).count = 100));
        await expect(badge(page)).toHaveText('99+');
    },
    'attaches-to-child': async ({ page }) => {
        await mount(page, PRESETS.Default);
        const button = page.getByRole('button', { name: 'Messages, 5 unread' });
        await expect(badge(page)).toHaveAttribute('data-attachment');
        await expect(page.locator('pttrn-badge [data-attachment-wrapper]')).toHaveCount(1);
        // The badge comes after the child and is centered on its top right corner.
        const [buttonBox, badgeBox] = await Promise.all([button.boundingBox(), badge(page).boundingBox()]);
        expect(badgeBox!.x + badgeBox!.width / 2).toBeCloseTo(buttonBox!.x + buttonBox!.width, 0);
        expect(badgeBox!.y + badgeBox!.height / 2).toBeCloseTo(buttonBox!.y, 0);
        const order = await page
            .locator('pttrn-badge')
            .evaluate((element) =>
                [...element.shadowRoot!.querySelector('[data-wrapper]')!.children].map((child) => child.tagName),
            );
        expect(order).toEqual(['SLOT', 'SUP']);
    },
    variants: async ({ page }) => {
        await mount(page, PRESETS.Alone);
        await expect(badge(page)).toHaveAttribute('data-size', 'small');
        await expect(badge(page)).toHaveAttribute('data-color', 'primary');
        await expect(badge(page)).not.toHaveAttribute('data-surface-border');
        expect(await style(page)).toEqual({
            height: await tokenLength(page, '--usa-spacing-3'),
            border: '0px',
            background: await tokenColor(page, '--theme-color-primary-medium'),
            color: await tokenColor(page, '--usa-color-white'),
        });

        await mount(page, '<pttrn-badge count="5" color="secondary" size="x-small" surface-border></pttrn-badge>');
        await expect(badge(page)).toHaveAttribute('data-size', 'x-small');
        await expect(badge(page)).toHaveAttribute('data-color', 'secondary');
        await expect(badge(page)).toHaveAttribute('data-surface-border');
        expect(await style(page)).toMatchObject({
            height: await tokenLength(page, '--usa-spacing-205'),
            border: await tokenLength(page, '--usa-spacing-2px'),
            background: await tokenColor(page, '--theme-color-secondary-dark'),
        });
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-badge').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
