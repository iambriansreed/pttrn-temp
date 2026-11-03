import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { spec } from '../../react/src/components/Input/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/**
 * One input, `aria-label="Example label" name="input-name" value="text value"` unless `attributes` sets them, with
 * light-DOM content.
 */
const input = (attributes = '', content = '') => {
    const defaults = { 'aria-label': 'Example label', name: 'input-name', value: 'text value' };
    const own = Object.entries(defaults)
        .filter(([key]) => !new RegExp(`(^|\\s)${key}=`).test(attributes))
        .map(([key, value]) => `${key}="${value}"`);
    return `<pttrn-input ${[...own, attributes].join(' ')}>${content}</pttrn-input>`;
};

/** Mirrors the presets in `packages/react/src/components/Input/InputExample.tsx`, in a 320px column like the demo. */
const PRESETS = {
    Default: `<pttrn-input aria-label="input aria-label" placeholder="Waterfront condo with great views"></pttrn-input>`,
    Currency: `<pttrn-input label="Balance" helper-text="Enter the current balance" name="currency" placeholder="0.00" type="number"><span slot="leading">$</span></pttrn-input>`,
    Percent: `<pttrn-input label="Growth Rate" helper-text="Enter the expected growth rate" name="percent" placeholder="0" type="number"><span slot="trailing">%</span></pttrn-input>`,
    Dimension: `<pttrn-input label="Land Size" helper-text="Enter the size of the land" name="dimension" placeholder="0" type="number"><span slot="trailing">Acre(s)</span></pttrn-input>`,
    Error: `<pttrn-input label="Email address" error-message="Enter an email address" name="email" required></pttrn-input>`,
};

const column = (html: string) => `<div style="width: 320px">${html}</div>`;

const textbox = (page: import('@playwright/test').Page) => page.getByRole('textbox');
const container = (page: import('@playwright/test').Page) => page.locator('pttrn-input [data-pttrn="input"]').first();
const clearButton = (page: import('@playwright/test').Page) => page.locator('pttrn-input [data-clear-button]');

/** Collects the `detail.value` of every `pttrn-change`, and counts `change`. */
async function recordChanges(page: import('@playwright/test').Page) {
    await page.evaluate(() => {
        const log = { values: [] as unknown[], change: 0 };
        (window as unknown as { log: typeof log }).log = log;
        document.addEventListener('pttrn-change', (event) => log.values.push((event as CustomEvent).detail.value));
        document.addEventListener('change', () => (log.change += 1));
    });
    return () => page.evaluate(() => (window as unknown as { log: { values: unknown[]; change: number } }).log);
}

test.describe('pttrn-input', () => {
    test('submits its name and value with a form and resets to the value attribute', async ({ page }) => {
        await mount(page, `<form>${input()}<button type="reset">Reset</button></form>`);
        const entries = () => page.evaluate(() => [...new FormData(document.querySelector('form')!).entries()]);
        expect(await entries()).toEqual([['input-name', 'text value']]);

        await textbox(page).fill('changed');
        expect(await entries()).toEqual([['input-name', 'changed']]);

        await page.getByRole('button', { name: 'Reset' }).click();
        await expect(textbox(page)).toHaveValue('text value');
        expect(await entries()).toEqual([['input-name', 'text value']]);
    });

    test('mirrors the native validity, so a required empty field blocks the form', async ({ page }) => {
        await mount(page, `<form>${input('required value=""')}</form>`);
        const valid = () =>
            page.evaluate(() => ({
                element: document.querySelector('pttrn-input')!.checkValidity(),
                form: document.querySelector('form')!.checkValidity(),
            }));
        expect(await valid()).toEqual({ element: false, form: false });
        await textbox(page).fill('filled');
        expect(await valid()).toEqual({ element: true, form: true });
    });

    test('a disabled fieldset disables it and leaves it out of the form data', async ({ page }) => {
        await mount(page, `<form><fieldset disabled>${input()}</fieldset></form>`);
        await expect(textbox(page)).toBeDisabled();
        expect(await page.evaluate(() => [...new FormData(document.querySelector('form')!).entries()])).toEqual([]);
    });

    test('helper text describes the input; an error message replaces it and marks the input invalid', async ({
        page,
    }) => {
        await mount(
            page,
            `<pttrn-input label="Email address" helper-text="We never share it." name="email"></pttrn-input>`,
        );
        const field = page.getByRole('textbox', { name: 'Email address' });
        await expect(field).toHaveAccessibleDescription('We never share it.');
        await expect(field).not.toHaveAttribute('aria-invalid');

        await page.locator('pttrn-input').evaluate((el) => el.setAttribute('error-message', 'Enter an email address'));
        await expect(page.getByRole('alert')).toHaveText('Enter an email address');
        await expect(page.getByText('We never share it.')).toHaveCount(0);
        await expect(field).toHaveAttribute('aria-invalid', 'true');
        await expect(field).toHaveAttribute('aria-errormessage', 'error');
        await expect(container(page)).toHaveAttribute('data-invalid', '');
    });

    test('required adds " (Required)" to the label', async ({ page }) => {
        await mount(page, `<pttrn-input label="Email address" required label-trailing="Optional hint"></pttrn-input>`);
        await expect(page.getByRole('textbox', { name: 'Email address (Required)' })).toBeVisible();
        await expect(page.getByText('Optional hint')).toHaveAttribute('aria-hidden', 'true');
    });

    test('setting value from code fires no event', async ({ page }) => {
        await mount(page, input());
        const log = await recordChanges(page);
        await page.locator('pttrn-input').evaluate((el) => ((el as HTMLInputElement).value = 'from code'));
        await expect(textbox(page)).toHaveValue('from code');
        expect(await log()).toEqual({ values: [], change: 0 });
    });

    test('the clear button shows only while the field has focus, at the size of the field', async ({ page }) => {
        await mount(page, column(input('size="large"')));
        await expect(clearButton(page)).toBeHidden();
        await textbox(page).focus();
        await expect(clearButton(page)).toBeVisible();
        const [box, field] = [await clearButton(page).boundingBox(), await container(page).boundingBox()];
        expect(box?.height).toBe(48);
        expect(field?.height).toBe(48);
    });
});

describeBehaviors(spec, {
    'renders-value': async ({ page }) => {
        await mount(page, input('placeholder="Type here"'));
        await expect(textbox(page)).toHaveValue('text value');
        await expect(textbox(page)).toHaveAttribute('name', 'input-name');
        await expect(textbox(page)).toHaveAttribute('placeholder', 'Type here');
    },
    typing: async ({ page }) => {
        await mount(page, input('value=""'));
        const log = await recordChanges(page);
        await textbox(page).pressSequentially('ab');
        expect(await log()).toEqual({ values: ['a', 'ab'], change: 2 });
        await expect(page.locator('pttrn-input')).toHaveJSProperty('value', 'ab');
    },
    'clear-button': async ({ page }) => {
        await mount(page, input());
        const log = await recordChanges(page);
        await textbox(page).focus();
        await page.getByRole('button', { name: 'Clear' }).click();
        await expect(textbox(page)).toHaveValue('');
        await expect(textbox(page)).toBeFocused();
        expect((await log()).values).toEqual(['']);
        await expect(clearButton(page)).toHaveCount(0);
    },
    'no-clear-button': async ({ page }) => {
        for (const attributes of ['value=""', 'hide-clear-button', 'disabled', 'readonly']) {
            await mount(page, input(attributes));
            await textbox(page).focus();
            await expect(clearButton(page), attributes).toHaveCount(0);
        }
    },
    'leading-trailing': async ({ page }) => {
        await mount(page, column(input('', '<span slot="leading">$</span><span slot="trailing">%</span>')));
        const leading = await page.getByText('$').boundingBox();
        const field = await textbox(page).boundingBox();
        const trailing = await page.getByText('%').boundingBox();
        expect(leading!.x + leading!.width).toBeLessThanOrEqual(field!.x);
        expect(field!.x + field!.width).toBeLessThanOrEqual(trailing!.x);
    },
    states: async ({ page }) => {
        await mount(page, input('disabled'));
        await expect(textbox(page)).toBeDisabled();
        await expect(container(page)).toHaveAttribute('data-disabled', '');

        await mount(page, input('readonly'));
        await expect(textbox(page)).toHaveAttribute('readonly', '');
        await expect(container(page)).toHaveAttribute('data-readonly', '');

        await mount(page, input('invalid'));
        await expect(textbox(page)).toHaveAttribute('aria-invalid', 'true');
        await expect(container(page)).toHaveAttribute('data-invalid', '');
    },
    labelled: async ({ page }) => {
        await mount(page, `<pttrn-input label="Email address" name="email"></pttrn-input>`);
        const field = page.getByRole('textbox', { name: 'Email address' });
        await expect(field).toBeVisible();
        await expect(field).not.toHaveAttribute('aria-label');

        await mount(page, input('aria-label="Search"'));
        await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();

        await mount(page, `<pttrn-input name="unnamed"></pttrn-input>`);
        await expect(textbox(page)).toHaveAccessibleName('');
    },
    'axe-clean': async ({ page }) => {
        for (const html of [...Object.values(PRESETS), input()]) {
            await mount(page, column(html));
            // Focused, so the clear button is in the tree too.
            await page.locator('pttrn-input input').first().focus();
            const results = await new AxeBuilder({ page }).include('pttrn-input').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
