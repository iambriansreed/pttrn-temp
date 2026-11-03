import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/CheckboxOption/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const subject = (attributes = '') =>
    `<pttrn-checkbox-option label="Subscribe" name="news" value="yes" ${attributes}></pttrn-checkbox-option>`;

/** Records the `detail.checked` of every `pttrn-change` that reaches the document. */
async function changes(page: Page) {
    return page.evaluateHandle(() => {
        const seen: boolean[] = [];
        document.addEventListener('pttrn-change', (event) => seen.push((event as CustomEvent).detail.checked));
        return seen;
    });
}

test.describe('pttrn-checkbox-option', () => {
    test('takes part in a form like pttrn-checkbox', async ({ page }) => {
        await mount(page, `<form>${subject()}</form>`);
        await page.getByText('Subscribe').click();
        const entries = await page
            .locator('form')
            .evaluate((form) => [...new FormData(form as HTMLFormElement)].map(([k, v]) => `${k}=${v}`));
        expect(entries).toEqual(['news=yes']);
    });

    test('shows the focus ring on the row when the checkbox has keyboard focus', async ({ page }) => {
        await mount(page, subject());
        await page.keyboard.press('Tab');
        await expect(page.locator('pttrn-checkbox-option label')).toHaveCSS('outline-style', 'solid');
    });
});

describeBehaviors(spec, {
    renders: async ({ page }) => {
        await mount(page, subject('checked description="Weekly, no spam."'));
        await expect(page.getByText('Weekly, no spam.')).toBeVisible();
        await expect(page.getByRole('checkbox', { name: 'Subscribe - Weekly, no spam.' })).toBeChecked();
    },
    toggle: async ({ page }) => {
        await mount(page, subject());
        const events = await changes(page);
        await page.getByText('Subscribe').click();
        await expect(page.getByRole('checkbox')).toBeChecked();

        await page.getByRole('checkbox').focus();
        await page.keyboard.press('Space');
        await expect(page.getByRole('checkbox')).not.toBeChecked();
        expect(await events.jsonValue()).toEqual([true, false]);
    },
    disabled: async ({ page }) => {
        await mount(page, subject('disabled'));
        const events = await changes(page);
        await expect(page.getByRole('checkbox')).toBeDisabled();
        await expect(page.locator('pttrn-checkbox-option [data-pttrn="list-item"]')).toHaveAttribute(
            'data-disabled',
            '',
        );
        await page.getByText('Subscribe').click({ force: true });
        expect(await events.jsonValue()).toEqual([]);
    },
    'axe-clean': async ({ page }) => {
        await mount(page, subject('checked description="Weekly, no spam."'));
        const results = await new AxeBuilder({ page }).include('pttrn-checkbox-option').analyze();
        expect(results.violations).toEqual([]);
    },
});
