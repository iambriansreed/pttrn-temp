import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Password/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** One password field, `aria-label="Password" name="password" value="secret"` unless `attributes` sets them. */
const password = (attributes = '') => {
    const defaults = { 'aria-label': 'Password', name: 'password', value: 'secret' };
    const own = Object.entries(defaults)
        .filter(([key]) => !new RegExp(`(^|\\s)${key}=`).test(attributes))
        .map(([key, value]) => `${key}="${value}"`);
    return `<div style="width: 320px"><pttrn-password ${[...own, attributes].join(' ')}></pttrn-password></div>`;
};

/** Mirrors `packages/react/src/components/Password/PasswordExample.tsx` and its usage example. */
const PRESETS = {
    Default: password('aria-label="password aria-label" value=""'),
    Field: `<div style="width: 320px"><pttrn-password label="Password" helper-text="The password field allows you to enter a secure password." name="password"></pttrn-password></div>`,
    Error: `<div style="width: 320px"><pttrn-password label="Password" error-message="Enter your password" name="password" required></pttrn-password></div>`,
};

/** The native input (a password input has no role). */
const field = (page: Page) => page.locator('pttrn-password input');

test.describe('pttrn-password', () => {
    test('submits its name and value with a form and resets to the value attribute', async ({ page }) => {
        await mount(page, `<form>${password()}<button type="reset">Reset</button></form>`);
        const entries = () => page.evaluate(() => [...new FormData(document.querySelector('form')!).entries()]);
        expect(await entries()).toEqual([['password', 'secret']]);
        await field(page).fill('hunter2');
        expect(await entries()).toEqual([['password', 'hunter2']]);
        await page.getByRole('button', { name: 'Reset' }).click();
        await expect(field(page)).toHaveValue('secret');
    });

    test('the toggle keeps focus and works from the keyboard', async ({ page }) => {
        await mount(page, password());
        await field(page).focus();
        await page.keyboard.press('Tab');
        const toggle = page.getByRole('button', { name: 'Show' });
        await expect(toggle).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(field(page)).toHaveAttribute('type', 'text');
        await expect(page.getByRole('button', { name: 'Hide' })).toBeFocused();
        await page.keyboard.press('Space');
        await expect(field(page)).toHaveAttribute('type', 'password');
    });

    test('the label, helper text and error message reach the input', async ({ page }) => {
        await mount(page, PRESETS.Field);
        await expect(field(page)).toHaveAccessibleDescription(
            'The password field allows you to enter a secure password.',
        );
        await mount(page, PRESETS.Error);
        await expect(field(page)).toHaveAccessibleName('Password (Required)');
        await expect(field(page)).toHaveAttribute('aria-invalid', 'true');
        await expect(page.getByRole('alert')).toHaveText('Enter your password');
    });
});

describeBehaviors(spec, {
    'hidden-by-default': async ({ page }) => {
        await mount(page, password());
        await expect(field(page)).toHaveAttribute('type', 'password');
        await expect(field(page)).toHaveAccessibleName('Password');
    },
    'show-hide': async ({ page }) => {
        await mount(page, password());
        await page.getByRole('button', { name: 'Show' }).click();
        await expect(field(page)).toHaveAttribute('type', 'text');
        await page.getByRole('button', { name: 'Hide' }).click();
        await expect(field(page)).toHaveAttribute('type', 'password');
        await expect(page.getByRole('button', { name: 'Show' })).toBeVisible();
    },
    typing: async ({ page }) => {
        await mount(page, password('value=""'));
        const values = page.evaluate(
            () =>
                new Promise<string>((resolve) =>
                    document.addEventListener('pttrn-change', (event) => resolve((event as CustomEvent).detail.value), {
                        once: true,
                    }),
                ),
        );
        await field(page).pressSequentially('p');
        expect(await values).toBe('p');
    },
    'no-toggle-when-locked': async ({ page }) => {
        for (const attribute of ['disabled', 'readonly']) {
            await mount(page, password(attribute));
            await expect(page.getByRole('button'), attribute).toHaveCount(0);
        }
    },
    'no-clear-or-autocomplete': async ({ page }) => {
        await mount(page, password());
        await field(page).focus();
        await expect(page.getByRole('button', { name: 'Clear' })).toHaveCount(0);
        await expect(field(page)).toHaveAttribute('autocomplete', 'off');
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-password').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
