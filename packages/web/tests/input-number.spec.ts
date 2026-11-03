import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/InputNumber/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** One field, `aria-label="Quantity" name="quantity" value="24"` unless `attributes` sets them. */
const inputNumber = (attributes = '') => {
    const defaults = { 'aria-label': 'Quantity', name: 'quantity', value: '24' };
    const own = Object.entries(defaults)
        .filter(([key]) => !new RegExp(`(^|\\s)${key}=`).test(attributes))
        .map(([key, value]) => `${key}="${value}"`);
    return `<div style="width: 320px"><pttrn-input-number ${[...own, attributes].join(' ')}></pttrn-input-number></div>`;
};

/** Mirrors `packages/react/src/components/InputNumber/InputNumberExample.tsx` and its usage example. */
const PRESETS = {
    Default: inputNumber('aria-label="input number aria-label" value=""'),
    Left: inputNumber('align="left"'),
    Field: `<div style="width: 320px"><pttrn-input-number label="Example Input Number" helper-text="The input number allows you to increment or decrement a value." name="example-name"></pttrn-input-number></div>`,
    Error: `<div style="width: 320px"><pttrn-input-number label="Guests" error-message="Enter at least one guest" name="guests" min="1"></pttrn-input-number></div>`,
};

const field = (page: Page) => page.getByRole('spinbutton');
const increase = (page: Page) => page.getByRole('button', { name: 'Increase value' });
const decrease = (page: Page) => page.getByRole('button', { name: 'Decrease value' });

/** Collects `detail.value` of every `pttrn-change`. */
async function recordChanges(page: Page) {
    await page.evaluate(() => {
        const seen: unknown[] = [];
        (window as unknown as { seen: unknown[] }).seen = seen;
        document.addEventListener('pttrn-change', (event) => seen.push((event as CustomEvent).detail.value));
    });
    return () => page.evaluate(() => (window as unknown as { seen: unknown[] }).seen);
}

test.describe('pttrn-input-number', () => {
    test('submits the number with a form, resets to the value attribute, and validates the range', async ({ page }) => {
        await mount(page, `<form>${inputNumber('max="30"')}<button type="reset">Reset</button></form>`);
        const entries = () => page.evaluate(() => [...new FormData(document.querySelector('form')!).entries()]);
        expect(await entries()).toEqual([['quantity', '24']]);

        await field(page).fill('31');
        expect(await entries()).toEqual([['quantity', '31']]);
        expect(await page.evaluate(() => document.querySelector('form')!.checkValidity())).toBe(false);

        await page.getByRole('button', { name: 'Reset' }).click();
        await expect(field(page)).toHaveValue('24');
        expect(await page.evaluate(() => document.querySelector('form')!.checkValidity())).toBe(true);
    });

    test('ArrowUp and ArrowDown in the field step the value', async ({ page }) => {
        await mount(page, inputNumber('step="2"'));
        const log = await recordChanges(page);
        await field(page).press('ArrowUp');
        await field(page).press('ArrowDown');
        await field(page).press('ArrowDown');
        expect(await log()).toEqual([26, 24, 22]);
    });

    test('holding a button repeats the step', async ({ page }) => {
        await mount(page, inputNumber());
        const log = await recordChanges(page);
        const box = (await increase(page).boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(1700);
        await page.mouse.up();
        const values = (await log()) as number[];
        expect(values.slice(0, 3)).toEqual([25, 26, 27]);
        const settled = values.length;
        await page.waitForTimeout(900);
        expect(((await log()) as number[]).length).toBe(settled);
    });

    test('a button activated without a pointer (assistive technology) steps once', async ({ page }) => {
        await mount(page, inputNumber());
        const log = await recordChanges(page);
        await page
            .locator('pttrn-input-number button[aria-label="Increase value"]')
            .evaluate((b) => (b as HTMLElement).click());
        expect(await log()).toEqual([25]);
    });

    test('the field is named "Input number" without a label or aria-label, and by its label with one', async ({
        page,
    }) => {
        await mount(page, '<pttrn-input-number></pttrn-input-number>');
        await expect(field(page)).toHaveAccessibleName('Input number');
        await mount(page, PRESETS.Field);
        await expect(field(page)).toHaveAccessibleName('Example Input Number');
        await expect(field(page)).toHaveAccessibleDescription(
            'The input number allows you to increment or decrement a value.',
        );
    });

    test('align="left" puts both buttons after the field', async ({ page }) => {
        await mount(page, PRESETS.Left);
        const input = (await field(page).boundingBox())!;
        expect((await decrease(page).boundingBox())!.x).toBeGreaterThan(input.x);
        await mount(page, inputNumber());
        expect((await decrease(page).boundingBox())!.x).toBeLessThan((await field(page).boundingBox())!.x);
    });
});

describeBehaviors(spec, {
    'renders-value': async ({ page }) => {
        await mount(page, inputNumber('max="30" min="0" step="2"'));
        await expect(field(page)).toHaveValue('24');
        await expect(field(page)).toHaveAccessibleName('Quantity');
        await expect(field(page)).toHaveAttribute('name', 'quantity');
        await expect(field(page)).toHaveAttribute('min', '0');
        await expect(field(page)).toHaveAttribute('max', '30');
        await expect(field(page)).toHaveAttribute('step', '2');
        const id = await field(page).getAttribute('id');
        await expect(increase(page)).toHaveAttribute('aria-controls', id!);
        await expect(decrease(page)).toHaveAttribute('aria-controls', id!);
    },
    typing: async ({ page }) => {
        await mount(page, inputNumber('value=""'));
        const log = await recordChanges(page);
        await field(page).pressSequentially('7');
        expect(await log()).toEqual([7]);
        await field(page).press('Backspace');
        expect(await log()).toEqual([7, undefined]);
    },
    steppers: async ({ page }) => {
        await mount(page, inputNumber('step="5"'));
        const log = await recordChanges(page);
        await increase(page).click();
        await expect(field(page)).toHaveValue('29');
        await decrease(page).click();
        await decrease(page).click();
        expect(await log()).toEqual([29, 24, 19]);
    },
    bounds: async ({ page }) => {
        await mount(page, inputNumber('max="24" min="0"'));
        await expect(increase(page)).toBeDisabled();
        await expect(decrease(page)).toBeEnabled();

        await mount(page, inputNumber('max="30" min="24"'));
        await expect(decrease(page)).toBeDisabled();
        await expect(increase(page)).toBeEnabled();
    },
    'disabled-readonly': async ({ page }) => {
        await mount(page, inputNumber('disabled'));
        await expect(field(page)).toBeDisabled();
        await expect(increase(page)).toBeDisabled();
        await expect(decrease(page)).toBeDisabled();

        await mount(page, inputNumber('readonly'));
        await expect(field(page)).toHaveAttribute('readonly', '');
        await expect(increase(page)).toBeDisabled();
        await expect(decrease(page)).toBeDisabled();
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-input-number').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
