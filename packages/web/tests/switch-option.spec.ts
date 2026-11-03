import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/SwitchOption/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const subject = (attributes = '') =>
    `<pttrn-switch-option label="Dark mode" name="dark" ${attributes}></pttrn-switch-option>`;

/** Records the `detail.checked` of every `pttrn-change` that reaches the document. */
async function changes(page: Page) {
    return page.evaluateHandle(() => {
        const seen: boolean[] = [];
        document.addEventListener('pttrn-change', (event) => seen.push((event as CustomEvent).detail.checked));
        return seen;
    });
}

test.describe('pttrn-switch-option', () => {
    test('takes part in a form like pttrn-switch', async ({ page }) => {
        await mount(page, `<form>${subject('value="yes"')}</form>`);
        await page.getByText('Dark mode').click();
        const entries = await page
            .locator('form')
            .evaluate((form) => [...new FormData(form as HTMLFormElement)].map(([k, v]) => `${k}=${v}`));
        expect(entries).toEqual(['dark=yes']);
    });

    test('shows the focus ring on the row when the switch has keyboard focus', async ({ page }) => {
        await mount(page, subject());
        await page.keyboard.press('Tab');
        await expect(page.locator('pttrn-switch-option label')).toHaveCSS('outline-style', 'solid');
    });

    test('measures like the React option', async ({ page }) => {
        // A standards-mode page: in quirks mode the row's `height: 100%` resolves against the viewport.
        await mount(page, `<!doctype html>${subject()}`);
        expect((await page.locator('pttrn-switch-option label').boundingBox())!.height).toBe(52);
    });
});

describeBehaviors(spec, {
    renders: async ({ page }) => {
        await mount(page, subject('checked description="Easier on the eyes at night."'));
        await expect(page.getByText('Easier on the eyes at night.')).toBeVisible();
        await expect(page.getByRole('switch', { name: 'Dark mode - Easier on the eyes at night.' })).toBeChecked();
    },
    toggle: async ({ page }) => {
        await mount(page, subject());
        const events = await changes(page);
        await page.getByText('Dark mode').click();
        await expect(page.getByRole('switch')).toBeChecked();

        await page.getByRole('switch').focus();
        await page.keyboard.press('Space');
        await expect(page.getByRole('switch')).not.toBeChecked();
        expect(await events.jsonValue()).toEqual([true, false]);
    },
    disabled: async ({ page }) => {
        await mount(page, subject('disabled'));
        const events = await changes(page);
        await expect(page.getByRole('switch')).toBeDisabled();
        await expect(page.locator('pttrn-switch-option [data-pttrn="list-item"]')).toHaveAttribute('data-disabled', '');
        await page.getByText('Dark mode').click({ force: true });
        expect(await events.jsonValue()).toEqual([]);
        await expect(page.getByRole('switch')).not.toBeChecked();
    },
    'axe-clean': async ({ page }) => {
        await mount(page, subject('checked'));
        const results = await new AxeBuilder({ page }).include('pttrn-switch-option').analyze();
        expect(results.violations).toEqual([]);
    },
});
