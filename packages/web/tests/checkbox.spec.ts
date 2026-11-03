import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Checkbox/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const subject = (attributes = '') =>
    `<pttrn-checkbox aria-label="Agree" name="agree" value="yes" ${attributes}></pttrn-checkbox>`;

const control = (page: Page) => page.getByRole('checkbox');

/** Records the `detail.checked` of every `pttrn-change` that reaches the document. */
async function changes(page: Page) {
    return page.evaluateHandle(() => {
        const seen: boolean[] = [];
        document.addEventListener('pttrn-change', (event) => seen.push((event as CustomEvent).detail.checked));
        return seen;
    });
}

const formData = (page: Page) =>
    page.locator('form').evaluate((form) => [...new FormData(form as HTMLFormElement)].map(([k, v]) => `${k}=${v}`));

test.describe('pttrn-checkbox', () => {
    test('takes part in a form: value while checked, required blocks submission, reset', async ({ page }) => {
        await mount(page, `<form>${subject('required')}</form>`);
        const valid = () => page.locator('form').evaluate((form) => (form as HTMLFormElement).checkValidity());
        expect(await formData(page)).toEqual([]);
        expect(await valid()).toBe(false);

        await control(page).click();
        expect(await formData(page)).toEqual(['agree=yes']);
        expect(await valid()).toBe(true);

        await page.locator('form').evaluate((form) => (form as HTMLFormElement).reset());
        await expect(control(page)).not.toBeChecked();
        expect(await valid()).toBe(false);
    });

    test('a user toggle clears indeterminate, as on a native checkbox', async ({ page }) => {
        await mount(page, subject('indeterminate'));
        await control(page).click();
        await expect(page.locator('pttrn-checkbox')).not.toHaveAttribute('indeterminate');
        await expect(control(page)).toBeChecked();
    });

    test('a wrapping <label> names it and toggles it', async ({ page }) => {
        await mount(page, '<label><pttrn-checkbox></pttrn-checkbox> I agree</label>');
        await expect(page.getByRole('checkbox', { name: 'I agree' })).toBeVisible();
        await page.getByText('I agree').click();
        await expect(control(page)).toBeChecked();
    });

    test('measures like the React checkbox', async ({ page }) => {
        await mount(page, subject());
        const box = await page.locator('pttrn-checkbox [data-pttrn="checkbox"]').boundingBox();
        expect([box!.width, box!.height]).toEqual([24, 24]);
    });
});

describeBehaviors(spec, {
    'reflects-checked': async ({ page }) => {
        await mount(page, subject());
        await expect(control(page)).not.toBeChecked();

        await mount(page, subject('checked'));
        await expect(control(page)).toBeChecked();
        await expect(page.locator('pttrn-checkbox svg[data-checked]')).toHaveCount(1);
    },
    'toggle-on-click': async ({ page }) => {
        await mount(page, subject());
        const events = await changes(page);
        await control(page).click();
        await page.keyboard.press('Space');
        expect(await events.jsonValue()).toEqual([true, false]);
    },
    indeterminate: async ({ page }) => {
        await mount(page, subject('indeterminate'));
        expect(await control(page).evaluate((input) => (input as HTMLInputElement).indeterminate)).toBe(true);
        await expect(control(page)).toHaveAttribute('data-indeterminate', '');
        await expect(control(page)).toBeChecked({ indeterminate: true });
        await expect(page.locator('pttrn-checkbox svg[data-indeterminate]')).toHaveCount(1);
        await expect(page.locator('pttrn-checkbox svg[data-checked]')).toHaveCount(0);
    },
    disabled: async ({ page }) => {
        await mount(page, subject('disabled'));
        const events = await changes(page);
        await expect(control(page)).toBeDisabled();
        await control(page).click({ force: true });
        await page.locator('pttrn-checkbox').evaluate((el) => (el as HTMLElement).click());
        expect(await events.jsonValue()).toEqual([]);
        await expect(control(page)).not.toBeChecked();
    },
    'invalid-required': async ({ page }) => {
        await mount(page, subject('invalid required'));
        await expect(control(page)).toHaveAttribute('aria-invalid', 'true');
        expect(await control(page).evaluate((input) => (input as HTMLInputElement).required)).toBe(true);
    },
    labelled: async ({ page }) => {
        await mount(page, subject());
        const input = page.getByRole('checkbox', { name: 'Agree' });
        await expect(input).toHaveAttribute('name', 'agree');
        await expect(input).toHaveAttribute('value', 'yes');
    },
    'axe-clean': async ({ page }) => {
        await mount(page, subject('checked'));
        const results = await new AxeBuilder({ page }).include('pttrn-checkbox').analyze();
        expect(results.violations).toEqual([]);
    },
});
