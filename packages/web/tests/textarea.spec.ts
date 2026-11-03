import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Textarea/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** One textarea, `aria-label="Example label" name="example-name" value="text value"` unless `attributes` sets them. */
const textarea = (attributes = '') => {
    const defaults = { 'aria-label': 'Example label', name: 'example-name', value: 'text value' };
    const own = Object.entries(defaults)
        .filter(([key]) => !new RegExp(`(^|\\s)${key}=`).test(attributes))
        .map(([key, value]) => `${key}="${value}"`);
    return `<div style="width: 320px"><pttrn-textarea ${[...own, attributes].join(' ')}></pttrn-textarea></div>`;
};

/** Mirrors `packages/react/src/components/Textarea/TextareaExample.tsx` and its usage example. */
const PRESETS = {
    Default: textarea('aria-label="textarea aria-label" value=""'),
    Field: `<div style="width: 320px"><pttrn-textarea label="Textarea" helper-text="This is an example textarea field." name="example-name"></pttrn-textarea></div>`,
    Error: `<div style="width: 320px"><pttrn-textarea label="Notes" error-message="Add a note" name="notes" required></pttrn-textarea></div>`,
};

const field = (page: Page) => page.getByRole('textbox');
const container = (page: Page) => page.locator('pttrn-textarea [data-pttrn="textarea"]');

test.describe('pttrn-textarea', () => {
    test('submits its name and value with a form and resets to the value attribute', async ({ page }) => {
        await mount(page, `<form>${textarea()}<button type="reset">Reset</button></form>`);
        const entries = () => page.evaluate(() => [...new FormData(document.querySelector('form')!).entries()]);
        expect(await entries()).toEqual([['example-name', 'text value']]);

        await field(page).fill('line one\nline two');
        expect(await entries()).toEqual([['example-name', 'line one\nline two']]);

        await page.getByRole('button', { name: 'Reset' }).click();
        await expect(field(page)).toHaveValue('text value');
    });

    test('a required empty textarea blocks the form', async ({ page }) => {
        await mount(page, `<form>${textarea('required value=""')}</form>`);
        expect(await page.evaluate(() => document.querySelector('form')!.checkValidity())).toBe(false);
        await field(page).fill('filled');
        expect(await page.evaluate(() => document.querySelector('form')!.checkValidity())).toBe(true);
    });

    test('maxlength is enforced by the textarea', async ({ page }) => {
        await mount(page, textarea('maxlength="5" value=""'));
        await field(page).pressSequentially('abcdefgh');
        await expect(field(page)).toHaveValue('abcde');
    });

    test('helper text describes it; an error message replaces it and marks it invalid', async ({ page }) => {
        await mount(page, PRESETS.Field);
        await expect(page.getByRole('textbox', { name: 'Textarea' })).toHaveAccessibleDescription(
            'This is an example textarea field.',
        );
        await mount(page, PRESETS.Error);
        await expect(page.getByRole('alert')).toHaveText('Add a note');
        await expect(page.getByRole('textbox', { name: 'Notes (Required)' })).toHaveAttribute('aria-invalid', 'true');
    });
});

describeBehaviors(spec, {
    'renders-value': async ({ page }) => {
        await mount(page, textarea('placeholder="Notes"'));
        await expect(field(page)).toHaveValue('text value');
        await expect(field(page)).toHaveAttribute('name', 'example-name');
        await expect(field(page)).toHaveAttribute('placeholder', 'Notes');
    },
    typing: async ({ page }) => {
        await mount(page, textarea('value=""'));
        await page.evaluate(() => {
            const seen: string[] = [];
            (window as unknown as { seen: string[] }).seen = seen;
            document.addEventListener('pttrn-change', (event) => seen.push((event as CustomEvent).detail.value));
        });
        await field(page).pressSequentially('ab');
        expect(await page.evaluate(() => (window as unknown as { seen: string[] }).seen)).toEqual(['a', 'ab']);
    },
    'auto-grow': async ({ page }) => {
        await mount(page, textarea('min-rows="3" max-rows="5" value=""'));
        await expect(container(page)).toHaveAttribute('style', /--min-rows:\s*3;\s*--max-rows:\s*5/);
        const height = async () => (await container(page).boundingBox())!.height;
        const empty = await height();

        await field(page).fill('one\ntwo\nthree\nfour');
        await expect(page.locator('pttrn-textarea [data-replicated-value]')).toHaveJSProperty(
            'textContent',
            'one\ntwo\nthree\nfour\n',
        );
        const four = await height();
        expect(four).toBeGreaterThan(empty);

        await field(page).fill('1\n2\n3\n4\n5\n6\n7\n8\n9\n10');
        const many = await height();
        expect(many).toBeGreaterThan(four);
        // Stops at max-rows: 5 rows of 20px plus the padding and border, then the textarea scrolls.
        expect(many).toBeLessThanOrEqual(5 * 20 + 2 * 12 + 2);
        expect(await field(page).evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    },
    states: async ({ page }) => {
        await mount(page, textarea('disabled'));
        await expect(field(page)).toBeDisabled();
        await expect(container(page)).toHaveAttribute('data-disabled', '');

        await mount(page, textarea('readonly'));
        await expect(field(page)).toHaveAttribute('readonly', '');
        await expect(container(page)).toHaveAttribute('data-readonly', '');

        await mount(page, textarea('invalid required'));
        await expect(field(page)).toHaveAttribute('aria-invalid', 'true');
        await expect(field(page)).toHaveAttribute('required', '');
        await expect(container(page)).toHaveAttribute('data-invalid', '');
    },
    labelled: async ({ page }) => {
        await mount(page, `<pttrn-textarea label="Notes" name="notes"></pttrn-textarea>`);
        await expect(page.getByRole('textbox', { name: 'Notes' })).toBeVisible();

        await mount(page, textarea('aria-label="Comments"'));
        await expect(page.getByRole('textbox', { name: 'Comments' })).toBeVisible();
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-textarea').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
