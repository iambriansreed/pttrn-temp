import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/OTPInput/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** An OTP input named "code", plus `attributes`. */
const otp = (attributes = '') => `<pttrn-otp-input name="code" ${attributes}></pttrn-otp-input>`;

/** Mirrors the presets in `packages/react/src/components/OTPInput/OTPInputExample.tsx`, and the field case. */
const PRESETS = {
    Default: otp('length="6"'),
    '4 Characters': otp('length="4"'),
    '6 Characters': otp('length="6" value="1234"'),
    Secure: otp('length="4" value="12" secure'),
    Field: `<div style="width: 320px">${otp('label="Verification code" helper-text="The six digits we sent you." required')}</div>`,
    Error: `<div style="width: 320px">${otp('label="Verification code" error-message="That code is wrong."')}</div>`,
};

const cells = (page: Page) => page.locator('pttrn-otp-input [data-digit]');
const cell = (page: Page, position: number) => page.getByRole('textbox', { name: `OTP input digit ${position}` });
const cellAt = (page: Page, position: number) => cells(page).nth(position - 1);
const values = (page: Page) =>
    cells(page).evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));
const group = (page: Page) => page.locator('pttrn-otp-input [data-pttrn="otp-input"]');

/** Collects `detail.value` of every `pttrn-change`. */
async function recordChanges(page: Page) {
    await page.evaluate(() => {
        const seen: string[] = [];
        (window as unknown as { seen: string[] }).seen = seen;
        document.addEventListener('pttrn-change', (event) => seen.push((event as CustomEvent).detail.value));
    });
    return () => page.evaluate(() => (window as unknown as { seen: string[] }).seen);
}

/** Pastes `text` into the focused cell, as the clipboard would. */
const paste = (page: Page, text: string) =>
    page.evaluate((data) => {
        let target = document.activeElement;
        while (target?.shadowRoot?.activeElement) target = target.shadowRoot.activeElement;
        const clipboardData = new DataTransfer();
        clipboardData.setData('text', data);
        target!.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
    }, text);

test.describe('pttrn-otp-input', () => {
    test('submits the code with a form; required blocks it until every cell is filled; reset restores', async ({
        page,
    }) => {
        await mount(page, `<form>${otp('length="4" value="12" required')}<button type="reset">Reset</button></form>`);
        const entries = () => page.evaluate(() => [...new FormData(document.querySelector('form')!).entries()]);
        const valid = () => page.evaluate(() => document.querySelector('form')!.checkValidity());
        expect(await entries()).toEqual([['code', '12']]);
        expect(await valid()).toBe(false);

        await cellAt(page, 3).click();
        await page.keyboard.type('34');
        expect(await entries()).toEqual([['code', '1234']]);
        expect(await valid()).toBe(true);
        await expect(page.locator('pttrn-otp-input')).toHaveJSProperty('value', '1234');

        await page.getByRole('button', { name: 'Reset' }).click();
        expect(await values(page)).toEqual(['1', '2', '', '']);
    });

    test('a label names the cells and the helper text describes the first one', async ({ page }) => {
        await mount(page, PRESETS.Field);
        await expect(page.getByRole('group', { name: 'Verification code', exact: true })).toBeVisible();
        await expect(cellAt(page, 1)).toHaveAccessibleName('Verification code digit 1');
        await expect(cellAt(page, 1)).toHaveAccessibleDescription('The six digits we sent you.');
        await expect(cellAt(page, 2)).not.toHaveAttribute('aria-describedby');
    });
});

describeBehaviors(spec, {
    'renders-cells': async ({ page }) => {
        await mount(page, otp('value="12" length="4"'));
        await expect(page.getByRole('group', { name: 'OTP input', exact: true })).toBeVisible();
        await expect(page.getByRole('textbox')).toHaveCount(4);
        for (let position = 1; position <= 4; position++) {
            const input = cellAt(page, position);
            await expect(input).toHaveAccessibleName(`OTP input digit ${position}`);
            await expect(input).toHaveAttribute('maxlength', '1');
            await expect(input).toHaveAttribute('autocomplete', 'off');
        }
        expect(await values(page)).toEqual(['1', '2', '', '']);
    },
    'field-attributes': async ({ page }) => {
        await mount(page, otp('invalid error-message="That code is wrong." label="Code" aria-label="OTP input"'));
        const first = cellAt(page, 1);
        await expect(first).toHaveAttribute('id', 'control');
        await expect(first).toHaveAttribute('name', 'code');
        await expect(first).toHaveAttribute('aria-errormessage', 'error');
        await expect(first).toHaveAttribute('aria-invalid', 'true');
        await expect(cellAt(page, 2)).toHaveAttribute('name', 'code-1');
        await expect(cellAt(page, 2)).not.toHaveAttribute('aria-errormessage');
        await expect(cellAt(page, 2)).not.toHaveAttribute('aria-invalid');
        await expect(cellAt(page, 6)).toHaveAttribute('name', 'code-5');

        await mount(page, otp('helper-text="The six digits we sent you."'));
        await expect(cellAt(page, 1)).toHaveAccessibleDescription('The six digits we sent you.');
        await expect(cellAt(page, 2)).not.toHaveAttribute('aria-describedby');
    },
    'typing-advances': async ({ page }) => {
        await mount(page, otp());
        await cell(page, 1).click();
        await page.keyboard.type('12');
        expect(await values(page)).toEqual(['1', '2', '', '', '', '']);
        await expect(cell(page, 3)).toBeFocused();
    },
    'onchange-when-complete': async ({ page }) => {
        await mount(page, otp('length="4"'));
        const log = await recordChanges(page);
        await cell(page, 1).click();
        await page.keyboard.type('123');
        expect(await log()).toEqual([]);
        await page.keyboard.type('4');
        expect(await log()).toEqual(['1234']);
        await expect(cell(page, 4)).toBeFocused();
    },
    'numeric-only': async ({ page }) => {
        await mount(page, otp());
        await expect(cell(page, 1)).toHaveAttribute('inputmode', 'numeric');
        await cell(page, 1).click();
        await page.keyboard.type('a');
        await expect(cell(page, 1)).toHaveValue('');
        await expect(cell(page, 1)).toBeFocused();
        await page.keyboard.type('7');
        await expect(cell(page, 1)).toHaveValue('7');
        await expect(cell(page, 2)).toBeFocused();

        await page.locator('pttrn-otp-input').evaluate((el) => el.setAttribute('alphanumeric', ''));
        await expect(cell(page, 2)).toHaveAttribute('inputmode', 'text');
        await page.keyboard.type('b');
        await expect(cell(page, 2)).toHaveValue('b');
    },
    'numeric-shifted-keys': async ({ page }) => {
        await mount(page, otp('length="3"'));
        const log = await recordChanges(page);
        await cell(page, 1).click();
        await page.keyboard.press('Shift+KeyA');
        await expect(cell(page, 1)).toHaveValue('');
        await expect(cell(page, 1)).toBeFocused();

        // Some layouts, the French one among them, type the digits with Shift.
        await page.keyboard.down('Shift');
        await page.keyboard.press('1');
        await page.keyboard.up('Shift');
        await expect(cell(page, 1)).toHaveValue('1');
        await expect(cell(page, 2)).toBeFocused();

        // A virtual keyboard or an IME inserts text with no readable key; the cell checks what it receives as well.
        await page.keyboard.insertText('b');
        await expect(cell(page, 2)).toHaveValue('');
        await expect(cell(page, 2)).toBeFocused();
        await page.keyboard.type('2');
        await page.keyboard.press('Shift+KeyZ');
        expect(await values(page)).toEqual(['1', '2', '']);
        expect(await log()).toEqual([]);

        await page.locator('pttrn-otp-input').evaluate((el) => el.setAttribute('alphanumeric', ''));
        await page.keyboard.press('Shift+KeyZ');
        expect(await values(page)).toEqual(['1', '2', 'Z']);
        expect(await log()).toEqual(['12Z']);
    },
    backspace: async ({ page }) => {
        await mount(page, otp('value="123" length="4"'));
        await cell(page, 3).click();
        await page.keyboard.press('Backspace');
        expect(await values(page)).toEqual(['1', '2', '', '']);
        await expect(cell(page, 3)).toBeFocused();
        await page.keyboard.press('Backspace');
        expect(await values(page)).toEqual(['1', '', '', '']);
        await expect(cell(page, 2)).toBeFocused();
    },
    'arrow-keys': async ({ page }) => {
        await mount(page, otp('value="12" length="4"'));
        await cell(page, 3).click();
        await page.keyboard.press('ArrowRight');
        await expect(cell(page, 3)).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await expect(cell(page, 2)).toBeFocused();
        await page.keyboard.press('ArrowUp');
        await expect(cell(page, 1)).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(cell(page, 2)).toBeFocused();
    },
    paste: async ({ page }) => {
        await mount(page, otp());
        const log = await recordChanges(page);
        await cell(page, 1).click();
        await paste(page, '1234');
        expect(await values(page)).toEqual(['1', '2', '3', '4', '', '']);
        await expect(cell(page, 5)).toBeFocused();
        expect(await log()).toEqual([]);

        await paste(page, '56789');
        expect(await values(page)).toEqual(['1', '2', '3', '4', '5', '6']);
        await expect(cell(page, 6)).toBeFocused();
        expect(await log()).toEqual(['123456']);
    },
    'paste-filters': async ({ page }) => {
        await mount(page, otp());
        await cell(page, 1).click();
        await paste(page, '12a-3 4');
        expect(await values(page)).toEqual(['1', '2', '3', '4', '', '']);

        await mount(page, otp('alphanumeric'));
        await cell(page, 1).click();
        await paste(page, 'ab-12 c');
        expect(await values(page)).toEqual(['a', 'b', '1', '2', 'c', '']);
    },
    'focus-order': async ({ page }) => {
        await mount(page, `${otp('value="12" length="4"')}<button>After</button>`);
        expect(
            await cells(page).evaluateAll((inputs) => inputs.map((input) => (input as HTMLElement).tabIndex)),
        ).toEqual([0, 0, 0, -1]);
        await expect(cellAt(page, 3)).not.toHaveAttribute('data-not-selectable');
        await expect(cellAt(page, 4)).toHaveAttribute('data-not-selectable', '');

        await page.keyboard.press('Tab');
        await expect(cell(page, 1)).toBeFocused();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await expect(cell(page, 3)).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(page.getByRole('button', { name: 'After' })).toBeFocused();

        await cell(page, 4).click();
        await expect(cell(page, 3)).toBeFocused();
    },
    secure: async ({ page }) => {
        await mount(page, otp('value="12" length="4" secure'));
        await expect(group(page)).toHaveAttribute('data-secure', '');
        for (let position = 1; position <= 4; position++) {
            await expect(cellAt(page, position)).toHaveAttribute('type', 'password');
        }
        const dots = page.locator('pttrn-otp-input [data-dot]');
        await expect(dots).toHaveCount(4);
        expect(await dots.evaluateAll((all) => all.map((dot) => !!dot.querySelector('svg')))).toEqual([
            true,
            true,
            false,
            false,
        ]);
    },
    states: async ({ page }) => {
        await mount(page, otp('disabled'));
        await expect(group(page)).toHaveAttribute('data-size', 'medium');
        await expect(group(page)).toHaveAttribute('data-disabled', '');
        for (const input of await cells(page).all()) await expect(input).toBeDisabled();

        await mount(page, otp('readonly size="small"'));
        await expect(group(page)).toHaveAttribute('data-size', 'small');
        await expect(group(page)).toHaveAttribute('data-readonly', '');
        await expect(group(page)).not.toHaveAttribute('data-disabled');
        for (const input of await cells(page).all()) await expect(input).toHaveAttribute('readonly', '');

        await mount(page, otp('invalid required'));
        await expect(group(page)).toHaveAttribute('data-invalid', '');
        await expect(group(page)).not.toHaveAttribute('data-readonly');
        for (const input of await cells(page).all()) await expect(input).toHaveAttribute('required', '');
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-otp-input').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
