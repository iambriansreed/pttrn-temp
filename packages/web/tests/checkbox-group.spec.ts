import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/CheckboxGroup/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

type Item = { value: string; label: string; description?: string; disabled?: boolean; checked?: boolean };

const item = ({ value, label, description, disabled, checked }: Item) =>
    `<pttrn-checkbox-group-item value="${value}" label="${label}"${description ? ` description="${description}"` : ''}${
        disabled ? ' disabled' : ''
    }${checked ? ' checked' : ''}></pttrn-checkbox-group-item>`;

const group = (items: Item[], attributes = 'aria-label="Toppings" name="toppings"') =>
    `<pttrn-checkbox-group ${attributes}>${items.map(item).join('')}</pttrn-checkbox-group>`;

const OPTIONS: Item[] = [
    { label: 'Option 1', value: '1', checked: true },
    { label: 'Option 2', value: '2', disabled: true },
    { label: 'Option 3', value: '3' },
];

const described = (n: number, extra: Partial<Item> = {}): Item => ({
    label: `Option ${n}`,
    value: `option${n}`,
    description: `Description for option ${n}`,
    ...extra,
});

/** Mirrors the presets in `packages/react/src/components/CheckboxGroup/CheckboxGroupExample.tsx`. */
const PRESETS = {
    Default: group(
        [
            described(1),
            described(2, { description: 'Description for option 2 (disabled)', disabled: true }),
            described(3),
            described(4, {
                description:
                    'This is a very long label for option 4 that never seems to end and just goes on and on without stopping',
            }),
        ],
        'aria-label="Checkbox group" name="group" select-all',
    ),
    'With Descriptions': group(
        [
            described(1),
            described(2, { description: 'Description for option 2 (disabled)', disabled: true, checked: true }),
            described(3),
        ],
        'aria-label="Checkbox group" name="Checkbox group"',
    ),
    'Group disabled': group(
        [described(1), described(2, { checked: true }), described(3)],
        'aria-label="Checkbox group" disabled name="Checkbox group"',
    ),
    'Long labels': group(
        [
            { label: 'This is a very long label for option 1 that never seems to end', value: 'option1' },
            {
                label: 'This is a very long label for option 2 that never seems to end',
                value: 'option2',
                checked: true,
            },
            { label: 'This is a very long label for option 3', value: 'option3' },
        ],
        'aria-label="Checkbox group" name="Checkbox group"',
    ),
};

const box = (page: Page, name: string) => page.getByRole('checkbox', { name, exact: true });

/** Records the `detail.value` of every `pttrn-change` that reaches the document. */
async function changes(page: Page) {
    return page.evaluateHandle(() => {
        const seen: string[][] = [];
        document.addEventListener('pttrn-change', (event) => seen.push((event as CustomEvent).detail.value));
        return seen;
    });
}

const formData = (page: Page) =>
    page.locator('form').evaluate((form) => [...new FormData(form as HTMLFormElement)].map(([k, v]) => `${k}=${v}`));

test.describe('pttrn-checkbox-group', () => {
    test('takes part in a form: each checked value, required, reset', async ({ page }) => {
        await mount(page, `<form>${group(OPTIONS, 'aria-label="Toppings" name="toppings" required')}</form>`);
        const valid = () => page.locator('form').evaluate((form) => (form as HTMLFormElement).checkValidity());
        expect(await formData(page)).toEqual(['toppings=1']);
        expect(await valid()).toBe(true);

        await box(page, 'Option 3').click();
        expect(await formData(page)).toEqual(['toppings=1', 'toppings=3']);

        await box(page, 'Option 1').click();
        await box(page, 'Option 3').click();
        expect(await formData(page)).toEqual([]);
        expect(await valid()).toBe(false);

        await page.locator('form').evaluate((form) => (form as HTMLFormElement).reset());
        await expect(box(page, 'Option 1')).toBeChecked();
        expect(await formData(page)).toEqual(['toppings=1']);
    });

    test('the value property reads and sets the checked options', async ({ page }) => {
        await mount(page, group(OPTIONS));
        const element = page.locator('pttrn-checkbox-group');
        expect(await element.evaluate((el) => (el as unknown as { value: string[] }).value)).toEqual(['1']);
        await element.evaluate((el) => ((el as unknown as { value: string[] }).value = ['3']));
        await expect(box(page, 'Option 1')).not.toBeChecked();
        await expect(box(page, 'Option 3')).toBeChecked();
        await expect(page.locator('pttrn-checkbox-group-item[value="3"]')).toHaveAttribute('checked', '');
    });

    test('draws an item added later', async ({ page }) => {
        await mount(page, group(OPTIONS));
        await page.locator('pttrn-checkbox-group').evaluate((el) => {
            const added = document.createElement('pttrn-checkbox-group-item');
            added.setAttribute('value', '4');
            added.setAttribute('label', 'Option 4');
            el.append(added);
        });
        await expect(box(page, 'Option 4')).toBeVisible();
    });
});

describeBehaviors(spec, {
    'renders-options': async ({ page }) => {
        await mount(page, group(OPTIONS));
        await expect(page.getByRole('group', { name: 'Toppings' })).toBeVisible();
        await expect(page.getByRole('checkbox')).toHaveCount(3);
        for (const input of await page.getByRole('checkbox').all()) {
            await expect(input).toHaveAttribute('name', 'toppings');
        }
    },
    'checked-values': async ({ page }) => {
        await mount(page, group(OPTIONS.map((option) => ({ ...option, checked: option.value !== '2' }))));
        await expect(box(page, 'Option 1')).toBeChecked();
        await expect(box(page, 'Option 2')).not.toBeChecked();
        await expect(box(page, 'Option 3')).toBeChecked();
    },
    toggle: async ({ page }) => {
        await mount(page, group(OPTIONS));
        const events = await changes(page);
        await box(page, 'Option 3').click();
        await box(page, 'Option 1').click();
        expect(await events.jsonValue()).toEqual([['1', '3'], ['3']]);
    },
    'select-all': async ({ page }) => {
        await mount(page, group(OPTIONS, 'aria-label="Toppings" name="toppings" select-all'));
        const events = await changes(page);
        const all = box(page, 'All');
        await expect(all).toBeChecked({ indeterminate: true });

        await all.click();
        await expect(all).toBeChecked();
        expect(await all.evaluate((input) => (input as HTMLInputElement).indeterminate)).toBe(false);
        await expect(box(page, 'Option 2')).not.toBeChecked();

        await all.click();
        await expect(all).not.toBeChecked();
        expect(await events.jsonValue()).toEqual([['1', '3'], []]);
        await expect(box(page, 'Option 1')).not.toBeChecked();
    },
    disabled: async ({ page }) => {
        await mount(page, group(OPTIONS));
        await expect(box(page, 'Option 2')).toBeDisabled();
        await expect(box(page, 'Option 1')).toBeEnabled();

        await mount(page, group(OPTIONS, 'aria-label="Toppings" disabled name="toppings" select-all'));
        for (const input of await page.getByRole('checkbox').all()) await expect(input).toBeDisabled();
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-checkbox-group').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
