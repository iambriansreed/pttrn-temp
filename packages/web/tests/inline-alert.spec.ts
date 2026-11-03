import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { spec } from '../../react/src/components/InlineAlert/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const VARIANTS = ['informational', 'error', 'success', 'warning'] as const;
const LABEL = 'Example informational inline alert';

const alert = (page: import('@playwright/test').Page) => page.getByRole('alert');

test.describe('pttrn-inline-alert', () => {
    test('text in the default slot takes the place of label', async ({ page }) => {
        await mount(page, '<pttrn-inline-alert label="Ignored">From the slot</pttrn-inline-alert>');
        await expect(page.getByText('From the slot')).toBeVisible();
        await expect(page.getByText('Ignored')).toHaveCount(0);
    });

    test('draws the warning icon in two tones', async ({ page }) => {
        await mount(page, `<pttrn-inline-alert label="${LABEL}" variant="warning"></pttrn-inline-alert>`);
        const tones = await page
            .locator('pttrn-inline-alert svg path')
            .evaluateAll((paths) => paths.map((path) => getComputedStyle(path).fill));
        expect(new Set(tones).size).toBe(2);
    });
});

describeBehaviors(spec, {
    'renders-label': async ({ page }) => {
        await mount(page, `<pttrn-inline-alert label="${LABEL}"></pttrn-inline-alert>`);
        await expect(alert(page)).toHaveAttribute('data-pttrn', 'inline-alert');
        await expect(alert(page)).toHaveText(LABEL);
    },
    variant: async ({ page }) => {
        await mount(page, `<pttrn-inline-alert label="${LABEL}"></pttrn-inline-alert>`);
        const element = page.locator('pttrn-inline-alert');
        await expect(element).toHaveAttribute('variant', 'informational');
        await expect(alert(page)).toHaveAttribute('data-variant', 'informational');
        await expect(alert(page).locator('svg')).toHaveAttribute('data-pttrn-name', 'InfoFill');

        for (const [variant, icon] of [
            ['error', 'ErrorFill'],
            ['success', 'CheckCircleFill'],
            ['warning', 'WarningTwoTone'],
        ]) {
            await element.evaluate((el, value) => el.setAttribute('variant', value), variant);
            await expect(alert(page)).toHaveAttribute('data-variant', variant);
            await expect(alert(page).locator('svg')).toHaveAttribute('data-pttrn-name', icon);
        }
    },
    identifiable: async ({ page }) => {
        await mount(
            page,
            `<input aria-describedby="hint" aria-label="Email" />
            <pttrn-inline-alert id="hint" label="${LABEL}" owner="field"></pttrn-inline-alert>`,
        );
        await expect(page.locator('pttrn-inline-alert')).toHaveAttribute('id', 'hint');
        await expect(alert(page)).toHaveAttribute('data-pttrn-owner', 'field');
        await expect(page.getByRole('textbox')).toHaveAccessibleDescription(LABEL);
    },
    'icon-decorative': async ({ page }) => {
        for (const variant of VARIANTS) {
            await mount(page, `<pttrn-inline-alert label="${LABEL}" variant="${variant}"></pttrn-inline-alert>`);
            await expect(alert(page).locator('svg')).toHaveAttribute('aria-hidden', 'true');
        }
    },
    'axe-clean': async ({ page }) => {
        for (const variant of VARIANTS) {
            await mount(page, `<pttrn-inline-alert label="${LABEL}" variant="${variant}"></pttrn-inline-alert>`);
            const results = await new AxeBuilder({ page }).include('pttrn-inline-alert').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
