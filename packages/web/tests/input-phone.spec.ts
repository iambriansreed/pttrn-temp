import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/InputPhone/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** A phone field in the UK, `name="phone"`, plus `attributes`, in a 320px column. */
const phone = (attributes = '') =>
    `<div style="width: 320px"><pttrn-input-phone country-code="GB" name="phone" ${attributes}></pttrn-input-phone></div>`;

/** Mirrors `packages/react/src/components/InputPhone/InputPhoneExample.tsx` and its usage example. */
const PRESETS = {
    Default: phone('aria-label="input phone aria-label"'),
    Field: `<div style="width: 320px"><pttrn-input-phone label="Example Input Phone" helper-text="The phone input allows you to enter a phone number with country code." country-code="US" name="example-name" value="(937) 555-1060"></pttrn-input-phone></div>`,
    Small: phone('size="small" value="07700 900123"'),
    Disabled: phone('disabled value="07700 900123"'),
};

const input = (page: Page) => page.getByRole('textbox');
const button = (page: Page) => page.getByRole('combobox');
const listbox = (page: Page) => page.getByRole('listbox', { name: 'Select country code' });
const options = (page: Page) => page.locator('pttrn-input-phone [role="option"]');
const optionFor = (page: Page, country: string) =>
    options(page).filter({ has: page.locator('[data-text]', { hasText: new RegExp(`^${country}$`) }) });
const container = (page: Page) => page.locator('pttrn-input-phone [data-pttrn="input"]');
const active = (page: Page) =>
    page.locator('pttrn-input-phone').evaluate((host) => {
        const id = host.shadowRoot!.querySelector('[role="combobox"]')!.getAttribute('aria-activedescendant');
        return id ? host.shadowRoot!.getElementById(id)?.querySelector('[data-text]')?.textContent : null;
    });

/** Collects the `detail` of every `pttrn-change`. */
async function recordChanges(page: Page) {
    await page.evaluate(() => {
        const seen: unknown[] = [];
        (window as unknown as { seen: unknown[] }).seen = seen;
        document.addEventListener('pttrn-change', (event) => seen.push((event as CustomEvent).detail));
    });
    return () => page.evaluate(() => (window as unknown as { seen: { value: string; countryCode: string }[] }).seen);
}

test.describe('pttrn-input-phone', () => {
    test('submits the number and the country with a form, and resets both', async ({ page }) => {
        await mount(page, `<form>${phone('value="07700 900123"')}<button type="reset">Reset</button></form>`);
        const entries = () => page.evaluate(() => [...new FormData(document.querySelector('form')!).entries()]);
        expect(await entries()).toEqual([
            ['phone', '07700 900123'],
            ['phone-country-code', 'GB'],
        ]);
        await button(page).click();
        await optionFor(page, 'France').click();
        expect(await entries()).toEqual([
            ['phone', '07700 900123'],
            ['phone-country-code', 'FR'],
        ]);
        await page.getByRole('button', { name: 'Reset' }).click();
        await expect(button(page)).toHaveText('+44');
    });

    test('a label names the input and the helper text describes it', async ({ page }) => {
        await mount(page, PRESETS.Field);
        await expect(input(page)).toHaveAccessibleName('Example Input Phone');
        await expect(input(page)).toHaveAccessibleDescription(
            'The phone input allows you to enter a phone number with country code.',
        );
    });

    test('without a country it guesses from the locale, and US by default', async ({ page }) => {
        await mount(page, '<pttrn-input-phone name="phone"></pttrn-input-phone>');
        const expected = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().locale.split('-')[1]);
        await expect(button(page)).toHaveText(expected === 'GB' ? '+44' : '+1');
    });

    test('the list closes when focus leaves the element', async ({ page }) => {
        await mount(page, `<button>Before</button>${phone()}`);
        await button(page).click();
        await expect(listbox(page)).toBeVisible();
        await page.getByRole('button', { name: 'Before' }).click();
        await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
    });
});

describeBehaviors(spec, {
    'renders-input': async ({ page }) => {
        await mount(page, phone('required value="(937) 555-1060"'));
        await expect(input(page)).toHaveValue('(937) 555-1060');
        await expect(input(page)).toHaveAttribute('name', 'phone');
        await expect(input(page)).toHaveAttribute('required', '');
        await expect(input(page)).toHaveAttribute('autocomplete', 'off');
        expect(
            await page
                .locator('pttrn-input-phone')
                .evaluate((host) => !!host.shadowRoot!.querySelector('[data-pttrn="input-phone"] input')),
        ).toBe(true);
    },
    'country-button': async ({ page }) => {
        await mount(page, phone());
        await expect(button(page)).toHaveAccessibleName('select country code');
        await expect(button(page)).toHaveAttribute('aria-haspopup', 'listbox');
        await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(button(page)).not.toHaveAttribute('aria-controls');
        await expect(button(page)).toHaveText('+44');
        await expect(button(page).getByText('+44')).toHaveAttribute('aria-hidden', 'true');
        await expect(page.locator('pttrn-input-phone [role="listbox"]')).toHaveCount(0);

        await mount(page, phone().replace('country-code="GB"', 'country-code="FR"'));
        await expect(button(page)).toHaveText('+33');
    },
    'opens-on-click': async ({ page }) => {
        await mount(page, phone());
        await button(page).click();
        await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
        await expect(button(page)).toBeFocused();
        await expect(listbox(page)).toBeVisible();
        const id = (await listbox(page).getAttribute('id'))!;
        await expect(button(page)).toHaveAttribute('aria-controls', id);
        await expect(button(page)).toHaveAttribute('aria-owns', id);
        expect(await options(page).count()).toBeGreaterThan(200);
        expect(await active(page)).toBe('Andorra');
        await expect(options(page).first()).toHaveAttribute('data-active', '');
        await expect(page.locator('pttrn-input-phone [role="option"][aria-selected="true"] [data-text]')).toHaveText([
            'United Kingdom',
        ]);
        await expect(optionFor(page, 'United Kingdom')).toContainText('(+44)');
    },
    'choose-country': async ({ page }) => {
        await mount(page, phone());
        const log = await recordChanges(page);
        await button(page).click();
        await optionFor(page, 'France').click();
        await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(page.locator('pttrn-input-phone [role="listbox"]')).toHaveCount(0);
        await expect(button(page)).toHaveText('+33');
        const live = page.locator('pttrn-input-phone [aria-live]');
        await expect(live).toHaveText('Selected country code France');
        await expect(live).toHaveAttribute('aria-live', 'polite');
        await expect(input(page)).toBeFocused();
        // The country alone fires nothing; it travels with the next value.
        expect(await log()).toEqual([]);
        await page.keyboard.type('6');
        expect(await log()).toEqual([{ value: '6', countryCode: 'FR' }]);
    },
    keyboard: async ({ page }) => {
        await mount(page, phone());
        await page.keyboard.press('Tab');
        await expect(button(page)).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
        expect(await active(page)).toBe('Andorra');
        await page.keyboard.press('Escape');
        await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(button(page)).toBeFocused();

        await page.keyboard.press('Space');
        await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
        await page.keyboard.press('Escape');
        await expect(button(page)).toHaveAttribute('aria-expanded', 'false');

        await page.keyboard.press('ArrowDown');
        await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
        expect(await active(page)).toBe('Andorra');
        await page.keyboard.press('ArrowDown');
        expect(await active(page)).toBe('United Arab Emirates');
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('ArrowUp');
        // Wraps from the first country to the last.
        expect(await active(page)).toBe('Zimbabwe');
        await page.keyboard.press('Enter');
        await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(button(page)).toHaveText('+263');
        await expect(input(page)).toBeFocused();
    },
    'outside-click-closes': async ({ page }) => {
        await mount(page, `<p>Outside</p>${phone()}`);
        await button(page).click();
        await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
        await page.getByText('Outside').click();
        await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
    },
    'formats-as-typed': async ({ page }) => {
        await mount(page, phone('country-code="US"').replace('country-code="GB" ', ''));
        let log = await recordChanges(page);
        await input(page).pressSequentially('9375551060');
        await expect(input(page)).toHaveValue('(937) 555-1060');
        expect((await log()).slice(0, 4)).toEqual([
            { value: '9', countryCode: 'US' },
            { value: '93', countryCode: 'US' },
            { value: '(937)', countryCode: 'US' },
            { value: '(937) 5', countryCode: 'US' },
        ]);
        expect((await log()).at(-1)).toEqual({ value: '(937) 555-1060', countryCode: 'US' });

        await mount(page, phone('country-code="US" disable-formatting').replace('country-code="GB" ', ''));
        log = await recordChanges(page);
        await input(page).pressSequentially('9375551060');
        await expect(input(page)).toHaveValue('9375551060');
        expect((await log()).at(-1)).toEqual({ value: '9375551060', countryCode: 'US' });
    },
    'digits-only': async ({ page }) => {
        await mount(page, phone());
        const log = await recordChanges(page);
        await input(page).pressSequentially('ab');
        await expect(input(page)).toHaveValue('');
        expect(await log()).toEqual([]);
        await input(page).pressSequentially('7');
        expect(await log()).toEqual([{ value: '7', countryCode: 'GB' }]);
    },
    'phone-keypad': async ({ page }) => {
        await mount(page, phone());
        await expect(input(page)).toHaveAttribute('inputmode', 'tel');
        expect(
            await page
                .locator('pttrn-input-phone')
                .evaluate((host) => [...host.shadowRoot!.querySelectorAll('[inputmode]')].map((el) => el.tagName)),
        ).toEqual(['INPUT']);
    },
    shortcuts: async ({ page }) => {
        await mount(page, phone());
        await input(page).click();
        await page.keyboard.type('a');
        await expect(input(page)).toHaveValue('');
        // Ctrl+V and Cmd+V reach the browser's paste instead of being filtered out as the letter v.
        const prevented = await input(page).evaluate((field) =>
            ['ctrlKey', 'metaKey', 'altKey'].map((modifier) => {
                const keydown = new KeyboardEvent('keydown', {
                    key: 'v',
                    [modifier]: true,
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                });
                field.dispatchEvent(keydown);
                return keydown.defaultPrevented;
            }),
        );
        expect(prevented).toEqual([false, false, false]);
        await input(page).evaluate((field) => {
            (field as HTMLInputElement).value = '0770';
            field.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        });
        await page.keyboard.press('ControlOrMeta+a');
        expect(await input(page).evaluate((field) => (field as HTMLInputElement).selectionEnd)).toBe(4);
        expect(await input(page).evaluate((field) => (field as HTMLInputElement).selectionStart)).toBe(0);
    },
    'clear-button': async ({ page }) => {
        await mount(page, phone());
        await expect(page.getByRole('button', { name: 'Clear' })).toHaveCount(0);

        await mount(page, phone('value="07700 900123"'));
        const log = await recordChanges(page);
        await input(page).focus();
        await page.getByRole('button', { name: 'Clear' }).click();
        expect(await log()).toEqual([{ value: '', countryCode: 'GB' }]);
        await expect(input(page)).toBeFocused();

        // The input filters what can be typed into it; the clear button, after it, answers its own keys.
        for (const key of ['Enter', 'Space']) {
            await page.keyboard.type('07700');
            await page.keyboard.press('Tab');
            await expect(page.getByRole('button', { name: 'Clear' })).toBeFocused();
            await page.keyboard.press(key);
            expect((await log()).at(-1)).toEqual({ value: '', countryCode: 'GB' });
            await expect(input(page)).toBeFocused();
        }
    },
    states: async ({ page }) => {
        await mount(page, phone('disabled'));
        await expect(input(page)).toBeDisabled();
        await expect(button(page)).toBeDisabled();
        await expect(button(page)).toHaveAttribute('aria-disabled', 'true');
        await expect(container(page)).toHaveAttribute('data-disabled', '');
        await button(page).click({ force: true });
        await expect(button(page)).toHaveAttribute('aria-expanded', 'false');

        await mount(page, phone('readonly'));
        await expect(input(page)).toHaveAttribute('readonly', '');
        await expect(button(page)).toBeDisabled();
        await expect(button(page)).toHaveAttribute('aria-readonly', 'true');
        await expect(container(page)).toHaveAttribute('data-readonly', '');

        await mount(page, phone('invalid size="small"'));
        await expect(input(page)).toHaveAttribute('aria-invalid', 'true');
        await expect(container(page)).toHaveAttribute('data-invalid', '');
        await expect(container(page)).toHaveAttribute('data-size', 'small');
    },
    labelled: async ({ page }) => {
        await mount(page, phone());
        await expect(input(page)).toHaveAccessibleName('Phone number input');
        await mount(page, phone('aria-label="Mobile number"'));
        await expect(input(page)).toHaveAccessibleName('Mobile number');
        await mount(page, phone('helper-text="Include the area code." error-message="Enter a number"'));
        await expect(input(page)).toHaveAttribute('aria-errormessage', 'error');
        await expect(input(page)).toHaveAttribute('aria-invalid', 'true');
        await mount(page, phone('helper-text="Include the area code."'));
        await expect(input(page)).toHaveAccessibleDescription('Include the area code.');
    },
    'render-flag': async ({ page }) => {
        await mount(page, phone());
        await expect(page.locator('pttrn-input-phone [data-flag]')).toHaveCount(0);
        await button(page).click();
        await expect(page.locator('pttrn-input-phone [data-flag]')).toHaveCount(0);

        await mount(page, phone());
        await page.locator('pttrn-input-phone').evaluate((host) => {
            (host as HTMLElement & { renderFlag: (code: string) => Node }).renderFlag = (code) => {
                const flag = document.createElement('i');
                flag.dataset.testFlag = code;
                return flag;
            };
        });
        const flag = page.locator('pttrn-input-phone [role="combobox"] [data-test-flag="GB"]');
        await expect(flag).toHaveCount(1);
        expect(await flag.evaluate((el) => el.parentElement!.getAttribute('aria-hidden'))).toBe('true');
        await button(page).click();
        const optionFlag = optionFor(page, 'France').locator('[data-test-flag="FR"]');
        await expect(optionFlag).toHaveCount(1);
        expect(await optionFlag.evaluate((el) => el.parentElement!.getAttribute('aria-hidden'))).toBe('true');
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-input-phone').analyze();
            expect(results.violations).toEqual([]);
        }
        await mount(page, phone());
        await button(page).click();
        await expect(listbox(page)).toBeVisible();
        const results = await new AxeBuilder({ page }).include('pttrn-input-phone').analyze();
        expect(results.violations).toEqual([]);
    },
});
