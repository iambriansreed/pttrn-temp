import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/RadioGroup/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

type Option = { value: string; label: string; description?: string; disabled?: boolean };

const items = (options: Option[]) =>
    options
        .map(
            ({ value, label, description, disabled }) =>
                `<pttrn-radio-group-item value="${value}" label="${label}"${description ? ` description="${description}"` : ''}${disabled ? ' disabled' : ''}></pttrn-radio-group-item>`,
        )
        .join('');

const group = (attributes: string, options: Option[]) =>
    `<div style="width: 320px"><pttrn-radio-group ${attributes}>${items(options)}</pttrn-radio-group></div>`;

const OPTIONS: Option[] = [
    { value: '1', label: 'Option 1', description: 'First' },
    { value: '2', label: 'Option 2', disabled: true },
    { value: '3', label: 'Option 3' },
];

/** `aria-label="Choices" name="choice" value="1"` unless `attributes` sets them, with the three options. */
const subject = (attributes = '') => {
    const defaults = { 'aria-label': 'Choices', name: 'choice', value: '1' };
    const own = Object.entries(defaults)
        .filter(([key]) => !new RegExp(`(^|\\s)${key}=`).test(attributes))
        .map(([key, value]) => `${key}="${value}"`);
    return group([...own, attributes].join(' '), OPTIONS);
};

const LONG = 'This is a very long label for option 1 that never seems to end';
const LONG_DESCRIPTION =
    'This is a very long label for option 1 that never seems to end. This is a very long label for option 2 that never seems to end.';

/** Mirrors the presets in `packages/react/src/components/RadioGroup/RadioGroupExample.tsx`. */
const PRESETS = {
    'With Descriptions': group('aria-label="Radio group" name="with-descriptions" value="option2"', [
        { label: 'Option 1', value: 'option1', description: 'Description for option 1' },
        { label: 'Option 2', value: 'option2', description: 'Description for option 2 (disabled)', disabled: true },
        { label: 'Option 3', value: 'option3', description: 'Description for option 3' },
    ]),
    'Group disabled': group('aria-label="Radio group" name="group-disabled" value="option2" disabled', [
        { label: 'Option 1', value: 'option1', description: 'Description for option 1' },
        { label: 'Option 2', value: 'option2', description: 'Description for option 2 (disabled)' },
        { label: 'Option 3', value: 'option3', description: 'Description for option 3' },
    ]),
    'Long labels': group('aria-label="Radio group" name="long-labels" value="option2"', [
        { label: LONG, value: 'option1' },
        { label: `${LONG}.`, value: 'option2' },
        { label: 'This is a very long label for option 3', value: 'option3' },
    ]),
    'Long labels + long descriptions': group('aria-label="Radio group" name="long-both" value="option2"', [
        { label: LONG, value: 'option1', description: LONG_DESCRIPTION },
        { label: LONG, value: 'option2', description: LONG_DESCRIPTION },
        { label: 'This is a very long label for option 3', value: 'option3', description: LONG_DESCRIPTION },
    ]),
};

const radio = (page: Page, name: string) => page.getByRole('radio', { name, exact: true });

test.describe('pttrn-radio-group', () => {
    test('submits the chosen value with a form and resets to the value attribute', async ({ page }) => {
        await mount(page, `<form>${subject()}<button type="reset">Reset</button></form>`);
        const entries = () => page.evaluate(() => [...new FormData(document.querySelector('form')!).entries()]);
        expect(await entries()).toEqual([['choice', '1']]);
        await radio(page, 'Option 3').click();
        expect(await entries()).toEqual([['choice', '3']]);
        await page.getByRole('button', { name: 'Reset' }).click();
        await expect(radio(page, 'Option 1 - First')).toBeChecked();
    });

    test('required blocks the form until an option is chosen', async ({ page }) => {
        await mount(page, `<form>${group('aria-label="Choices" name="choice" required', OPTIONS)}</form>`);
        const valid = () => page.evaluate(() => document.querySelector('form')!.checkValidity());
        expect(await valid()).toBe(false);
        await radio(page, 'Option 3').click();
        expect(await valid()).toBe(true);
    });

    test('Tab enters on the chosen radio', async ({ page }) => {
        await mount(page, `<button>Before</button>${subject('value="3"')}`);
        await page.getByRole('button', { name: 'Before' }).focus();
        await page.keyboard.press('Tab');
        await expect(radio(page, 'Option 3')).toBeFocused();
    });

    test('options added later and value set from code are drawn', async ({ page }) => {
        await mount(page, subject());
        await page.locator('pttrn-radio-group').evaluate((el) => {
            el.insertAdjacentHTML(
                'beforeend',
                '<pttrn-radio-group-item value="4" label="Option 4"></pttrn-radio-group-item>',
            );
            (el as HTMLElement & { value: string }).value = '4';
        });
        await expect(radio(page, 'Option 4')).toBeChecked();
        await page.locator('pttrn-radio-group-item[value="4"]').evaluate((el) => el.setAttribute('label', 'Fourth'));
        await expect(radio(page, 'Fourth')).toBeChecked();
    });

    test('works without a name', async ({ page }) => {
        await mount(page, group('aria-label="Choices" value="1"', OPTIONS));
        await radio(page, 'Option 1 - First').focus();
        await page.keyboard.press('ArrowDown');
        await expect(radio(page, 'Option 3')).toBeChecked();
    });
});

describeBehaviors(spec, {
    'renders-options': async ({ page }) => {
        await mount(page, subject());
        await expect(page.getByRole('radiogroup', { name: 'Choices' })).toBeVisible();
        await expect(page.getByRole('radio')).toHaveCount(3);
        await expect(page.getByText('First')).toBeVisible();
        await expect(radio(page, 'Option 1 - First')).toBeVisible();
        for (const input of await page.getByRole('radio').all()) await expect(input).toHaveAttribute('name', 'choice');
    },
    'checked-value': async ({ page }) => {
        await mount(page, subject('value="3"'));
        await expect(radio(page, 'Option 3')).toBeChecked();
        await expect(radio(page, 'Option 1 - First')).not.toBeChecked();
    },
    choose: async ({ page }) => {
        await mount(page, subject());
        const changed = page.evaluate(
            () =>
                new Promise((resolve) =>
                    document.addEventListener('pttrn-change', (e) => resolve((e as CustomEvent).detail.value), {
                        once: true,
                    }),
                ),
        );
        await page.getByText('Option 3').click();
        expect(await changed).toBe('3');
        await expect(page.locator('pttrn-radio-group')).toHaveJSProperty('value', '3');
    },
    'arrow-keys': async ({ page }) => {
        await mount(page, subject());
        await radio(page, 'Option 1 - First').focus();
        await page.keyboard.press('ArrowDown');
        await expect(radio(page, 'Option 3')).toBeChecked();
        await expect(radio(page, 'Option 3')).toBeFocused();
        await expect(page.locator('pttrn-radio-group')).toHaveJSProperty('value', '3');
        await page.keyboard.press('ArrowUp');
        await expect(radio(page, 'Option 1 - First')).toBeChecked();
    },
    disabled: async ({ page }) => {
        await mount(page, subject());
        await expect(radio(page, 'Option 2')).toBeDisabled();
        await expect(radio(page, 'Option 1 - First')).toBeEnabled();

        await mount(page, subject('disabled'));
        for (const input of await page.getByRole('radio').all()) await expect(input).toBeDisabled();
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-radio-group').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
