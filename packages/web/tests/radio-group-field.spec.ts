import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/RadioGroupField/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/**
 * RadioGroupField has no element of its own: `pttrn-radio-group` renders the Field parts (a fieldset named by its
 * legend, the helper text, the error alert) when it has a `label`, as every `@ptrn/web` form control does. These tests
 * hold that to the RadioGroupField spec.
 */
const OPTIONS = ['Option 1', 'Option 2', 'Option 3']
    .map((label, index) => `<pttrn-radio-group-item value="${index + 1}" label="${label}"></pttrn-radio-group-item>`)
    .join('');

const field = (attributes = '') =>
    `<div style="width: 320px"><pttrn-radio-group label="Example field label" name="example-field-name" ${attributes}>${OPTIONS}</pttrn-radio-group></div>`;

/** Mirrors the RadioGroupField presets: the RadioGroup presets with a label. */
const PRESETS = {
    'With Descriptions': `<pttrn-radio-group label="Radio Group Field" name="with-descriptions" value="option2">
        <pttrn-radio-group-item value="option1" label="Option 1" description="Description for option 1"></pttrn-radio-group-item>
        <pttrn-radio-group-item value="option2" label="Option 2" description="Description for option 2 (disabled)" disabled></pttrn-radio-group-item>
        <pttrn-radio-group-item value="option3" label="Option 3" description="Description for option 3"></pttrn-radio-group-item>
    </pttrn-radio-group>`,
    'Group disabled': field('value="2" disabled'),
    Helper: field('helper-text="Pick what applies" required label-trailing="Optional"'),
    Error: field('error-message="Choose one"'),
};

const control = (page: Page) => page.getByRole('radiogroup');

describeBehaviors(spec, {
    'legend-names-group': async ({ page }) => {
        await mount(page, field());
        const fieldset = page.getByRole('group', { name: 'Example field label' });
        await expect(fieldset).toBeVisible();
        expect(await fieldset.evaluate((el) => el.tagName)).toBe('FIELDSET');
        expect(await fieldset.evaluate((el) => !!el.querySelector('[role="radiogroup"]'))).toBe(true);
        await expect(page.getByRole('radio')).toHaveCount(3);
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
        await expect(control(page)).toHaveAttribute('aria-invalid', 'true');
        await expect(control(page)).toHaveAttribute('aria-errormessage', (await alert.getAttribute('id'))!);
    },
    required: async ({ page }) => {
        await mount(page, field('required'));
        await expect(page.getByRole('group', { name: 'Example field label (Required)' })).toBeVisible();
    },
    'label-trailing': async ({ page }) => {
        await mount(page, field('label-trailing="Optional"'));
        await expect(page.getByText('Optional')).toHaveAttribute('aria-hidden', 'true');
        await expect(page.getByRole('group', { name: 'Example field label' })).toBeVisible();
    },
    chooses: async ({ page }) => {
        await mount(page, field());
        const changed = page.evaluate(
            () =>
                new Promise((resolve) =>
                    document.addEventListener('pttrn-change', (e) => resolve((e as CustomEvent).detail.value), {
                        once: true,
                    }),
                ),
        );
        await page.getByRole('radio', { name: 'Option 2' }).click();
        expect(await changed).toBe('2');
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-radio-group').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
