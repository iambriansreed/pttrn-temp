import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/CheckboxGroupField/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/**
 * CheckboxGroupField has no element of its own: `pttrn-checkbox-group` renders the Field parts (a fieldset named by its
 * legend, the helper text, the error alert) when it has a `label`, as every `@ptrn/web` form control does. These tests
 * hold that to the CheckboxGroupField spec.
 */
const OPTIONS = ['Option 1', 'Option 2', 'Option 3']
    .map(
        (label, index) =>
            `<pttrn-checkbox-group-item value="${index + 1}" label="${label}"></pttrn-checkbox-group-item>`,
    )
    .join('');

const field = (attributes = '') =>
    `<div style="width: 320px"><pttrn-checkbox-group label="Example field label" name="example-field-name" ${attributes}>${OPTIONS}</pttrn-checkbox-group></div>`;

const described = (n: number, extra = '') =>
    `<pttrn-checkbox-group-item value="option${n}" label="Option ${n}" description="Description for option ${n}" ${extra}></pttrn-checkbox-group-item>`;

/** Mirrors the CheckboxGroupField presets: the CheckboxGroup presets with a label. */
const PRESETS = {
    'With Descriptions': `<pttrn-checkbox-group label="Checkbox Group Field" name="with-descriptions">
        ${described(1)}${described(2, 'disabled checked')}${described(3)}
    </pttrn-checkbox-group>`,
    'Group disabled': `<pttrn-checkbox-group disabled label="Checkbox Group Field" name="group-disabled">
        ${described(1)}${described(2, 'checked')}${described(3)}
    </pttrn-checkbox-group>`,
    Helper: field('helper-text="Pick what applies" required label-trailing="Optional" select-all'),
    Error: field('error-message="Choose one" select-all'),
};

const control = (page: Page) => page.locator('pttrn-checkbox-group [data-pttrn="checkbox-group"]');

describeBehaviors(spec, {
    'legend-names-group': async ({ page }) => {
        await mount(page, field());
        const fieldset = page.getByRole('group', { name: 'Example field label' });
        await expect(fieldset).toBeVisible();
        expect(await fieldset.evaluate((el) => el.tagName)).toBe('FIELDSET');
        expect(await fieldset.evaluate((el) => !!el.querySelector('[data-pttrn="checkbox-group"]'))).toBe(true);
        await expect(control(page)).toHaveAttribute('role', 'group');
        await expect(page.getByRole('checkbox')).toHaveCount(3);
    },
    'helper-text': async ({ page }) => {
        await mount(page, field('helper-text="Pick what applies"'));
        await expect(page.getByText('Pick what applies')).toBeVisible();
        await expect(control(page)).toHaveAccessibleDescription('Pick what applies');
    },
    'error-message': async ({ page }) => {
        await mount(page, field('error-message="Choose one" helper-text="Pick what applies"'));
        const alert = page.getByRole('alert');
        await expect(alert).toHaveText('Choose one');
        await expect(page.getByText('Pick what applies')).toHaveCount(0);
        const id = await alert.getAttribute('id');
        for (const input of await page.getByRole('checkbox').all()) {
            await expect(input).toHaveAttribute('aria-invalid', 'true');
            await expect(input).toHaveAttribute('aria-errormessage', id!);
            // The id resolves inside the same shadow root, to the alert.
            expect(
                await input.evaluate(
                    (el, ref) => (el.getRootNode() as ShadowRoot).getElementById(ref)?.getAttribute('role'),
                    id!,
                ),
            ).toBe('alert');
        }
    },
    required: async ({ page }) => {
        await mount(page, field('required'));
        await expect(page.getByRole('group', { name: 'Example field label (Required)' })).toBeVisible();
        for (const input of await page.getByRole('checkbox').all()) {
            expect(await input.evaluate((el) => (el as HTMLInputElement).required)).toBe(true);
        }
    },
    'label-trailing': async ({ page }) => {
        await mount(page, field('label-trailing="Optional"'));
        await expect(page.getByText('Optional')).toHaveAttribute('aria-hidden', 'true');
        await expect(page.getByRole('group', { name: 'Example field label', exact: true })).toBeVisible();
    },
    chooses: async ({ page }) => {
        await mount(page, field());
        const values = await page.evaluateHandle(() => {
            const seen: string[][] = [];
            document.addEventListener('pttrn-change', (event) => seen.push((event as CustomEvent).detail.value));
            return seen;
        });
        await page.getByRole('checkbox', { name: 'Option 2' }).click();
        expect(await values.jsonValue()).toEqual([['2']]);
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-checkbox-group').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});

test.describe('pttrn-checkbox-group as CheckboxGroupField', () => {
    test('takes the full width of its container, as the React Field does', async ({ page }) => {
        await mount(page, field());
        expect((await page.locator('pttrn-checkbox-group').boundingBox())!.width).toBe(320);
    });
});
