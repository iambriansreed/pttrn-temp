import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Switch/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const subject = (attributes = '') => `<pttrn-switch aria-label="Dark mode" name="dark" ${attributes}></pttrn-switch>`;

const control = (page: Page) => page.getByRole('switch');

/** Records the `detail.checked` of every `pttrn-change` that reaches the document. */
async function changes(page: Page) {
    return page.evaluateHandle(() => {
        const seen: boolean[] = [];
        document.addEventListener('pttrn-change', (event) => seen.push((event as CustomEvent).detail.checked));
        return seen;
    });
}

/** The form's entries, as name=value pairs. */
const formData = (page: Page) =>
    page.locator('form').evaluate((form) => [...new FormData(form as HTMLFormElement)].map(([k, v]) => `${k}=${v}`));

test.describe('pttrn-switch', () => {
    test('takes part in a form: submits its value while on, resets, follows a disabled fieldset', async ({ page }) => {
        await mount(page, `<form><fieldset>${subject('value="yes"')}</fieldset></form>`);
        expect(await formData(page)).toEqual([]);
        await control(page).click();
        expect(await formData(page)).toEqual(['dark=yes']);

        await page.locator('form').evaluate((form) => (form as HTMLFormElement).reset());
        await expect(control(page)).not.toBeChecked();
        await expect(page.locator('pttrn-switch')).not.toHaveAttribute('checked');
        expect(await formData(page)).toEqual([]);

        await page.locator('fieldset').evaluate((fieldset) => fieldset.setAttribute('disabled', ''));
        await expect(control(page)).toBeDisabled();
    });

    test('a form reset goes back to the checked attribute of the markup', async ({ page }) => {
        await mount(page, `<form>${subject('checked')}</form>`);
        await control(page).click();
        await expect(control(page)).not.toBeChecked();
        await page.locator('form').evaluate((form) => (form as HTMLFormElement).reset());
        await expect(control(page)).toBeChecked();
    });

    test('a <label for> names it and toggles it', async ({ page }) => {
        await mount(page, '<label for="dark">Dark mode</label> <pttrn-switch id="dark"></pttrn-switch>');
        const events = await changes(page);
        await expect(page.getByRole('switch', { name: 'Dark mode' })).toBeVisible();
        await page.getByText('Dark mode').click();
        await expect(control(page)).toBeChecked();
        expect(await events.jsonValue()).toEqual([true]);
    });

    test('a wrapping <label> names it, and a click on the switch toggles it once', async ({ page }) => {
        await mount(page, '<label><pttrn-switch></pttrn-switch> Dark mode</label>');
        const events = await changes(page);
        await expect(page.getByRole('switch', { name: 'Dark mode' })).toBeVisible();
        await control(page).click();
        await expect(control(page)).toBeChecked();
        await page.getByText('Dark mode').click();
        await expect(control(page)).not.toBeChecked();
        expect(await events.jsonValue()).toEqual([true, false]);
    });

    test('fires change too, and reflects checked', async ({ page }) => {
        await mount(page, subject());
        const native = await page.evaluateHandle(() => {
            const seen = { count: 0 };
            document.addEventListener('change', () => seen.count++);
            return seen;
        });
        await control(page).click();
        expect(await native.evaluate((seen) => seen.count)).toBe(1);
        await expect(page.locator('pttrn-switch')).toHaveAttribute('checked', '');
    });

    test('measures like the React switch', async ({ page }) => {
        await mount(page, subject());
        const track = await page.locator('pttrn-switch [data-pttrn="switch"]').boundingBox();
        expect([track!.width, track!.height]).toEqual([36, 20]);
    });
});

describeBehaviors(spec, {
    'reflects-checked': async ({ page }) => {
        await mount(page, subject());
        await expect(control(page)).not.toBeChecked();

        await mount(page, subject('checked'));
        await expect(control(page)).toBeChecked();
        await page
            .locator('pttrn-switch')
            .evaluate((el) => ((el as HTMLElement & { checked: boolean }).checked = false));
        await expect(control(page)).not.toBeChecked();
    },
    'toggle-on-click': async ({ page }) => {
        await mount(page, subject());
        const events = await changes(page);
        await control(page).click();
        await control(page).click();
        expect(await events.jsonValue()).toEqual([true, false]);
    },
    'keyboard-toggle': async ({ page }) => {
        await mount(page, subject());
        const events = await changes(page);
        await page.keyboard.press('Tab');
        await expect(control(page)).toBeFocused();
        await page.keyboard.press('Space');
        await expect(control(page)).toBeChecked();
        expect(await events.jsonValue()).toEqual([true]);
    },
    disabled: async ({ page }) => {
        await mount(page, subject('disabled'));
        const events = await changes(page);
        await expect(control(page)).toBeDisabled();
        await control(page).click({ force: true });
        await page.locator('pttrn-switch').evaluate((el) => (el as HTMLElement).click());
        await expect(control(page)).not.toBeChecked();
        expect(await events.jsonValue()).toEqual([]);
        await page.keyboard.press('Tab');
        await expect(control(page)).not.toBeFocused();
    },
    labelled: async ({ page }) => {
        await mount(page, subject('value="on"'));
        const input = page.getByRole('switch', { name: 'Dark mode' });
        await expect(input).toHaveAttribute('name', 'dark');
        await expect(input).toHaveAttribute('value', 'on');
        expect(await input.evaluate((el) => el.nextElementSibling?.getAttribute('aria-hidden'))).toBe('true');
    },
    'axe-clean': async ({ page }) => {
        await mount(page, subject('checked'));
        const results = await new AxeBuilder({ page }).include('pttrn-switch').analyze();
        expect(results.violations).toEqual([]);
    },
});
