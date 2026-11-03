import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Chip/spec';
import { icon } from './icons';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const lead = (name: string) => icon(name, 'leading-icon');
const trail = (name: string) => icon(name, 'trailing-icon');

/** Mirrors the presets in `packages/react/src/components/Chip/ChipExample.tsx`. */
const PRESETS = {
    Basic: '<pttrn-chip label="chip"></pttrn-chip>',
    'Leading Icon': `<pttrn-chip label="chip">${lead('Add')}</pttrn-chip>`,
    'Trailing Icon': `<pttrn-chip label="chip">${trail('Add')}</pttrn-chip>`,
    'Both Icons': `<pttrn-chip label="chip">${lead('Add')}${trail('Add')}</pttrn-chip>`,
    'Trailing Badge': `<pttrn-chip badge-count="2" badge-size="x-small" label="chip">${lead('Add')}</pttrn-chip>`,
    'Trailing Badge Icon': `<pttrn-chip badge-count="2" badge-size="x-small" label="chip">${trail('Cloud')}</pttrn-chip>`,
    'Assist Chip': `<pttrn-chip label="Assist Chip">${lead('Cloud')}</pttrn-chip>`,
    'Filter Chip': `<pttrn-chip label="Filter Chip">${lead('Cloud')}${trail('KeyboardArrowDown')}</pttrn-chip>`,
    'Input Chip': `<pttrn-chip label="Input Chip">${lead('Cloud')}${trail('Close')}</pttrn-chip>`,
    'Suggest Chip': '<pttrn-chip label="Suggest Chip"></pttrn-chip>',
};

/** Counts the `click` events that reach the document. */
async function clickCounter(page: Page) {
    return page.evaluateHandle(() => {
        const seen = { count: 0 };
        document.addEventListener('click', () => seen.count++);
        return seen;
    });
}

test.describe('pttrn-chip', () => {
    test('measures like the React chip', async ({ page }) => {
        await mount(page, PRESETS['Both Icons']);
        const box = await page.getByRole('button', { name: 'chip' }).boundingBox();
        expect(box!.height).toBe(32);
    });

    test('reflects disabled, flat and selected as attributes', async ({ page }) => {
        await mount(page, PRESETS.Basic);
        const chip = page.locator('pttrn-chip');
        await chip.evaluate((el) => Object.assign(el, { disabled: true, flat: true, selected: true }));
        await expect(chip).toHaveAttribute('disabled', '');
        await expect(chip).toHaveAttribute('flat', '');
        await expect(chip).toHaveAttribute('selected', '');
    });

    test('shows 99+ above 99', async ({ page }) => {
        await mount(page, '<pttrn-chip badge-count="120" label="Inbox"></pttrn-chip>');
        await expect(page.locator('pttrn-chip [data-badge]')).toHaveText('99+');
    });
});

describeBehaviors(spec, {
    'renders-label': async ({ page }) => {
        await mount(page, '<pttrn-chip label="Suggestion"></pttrn-chip>');
        const chip = page.getByRole('button', { name: 'Suggestion' });
        await expect(chip).toHaveAttribute('type', 'button');
        await expect(chip).toHaveText('Suggestion');
    },
    click: async ({ page }) => {
        await mount(page, '<pttrn-chip label="Suggestion"></pttrn-chip>');
        const clicks = await clickCounter(page);
        await page.getByRole('button', { name: 'Suggestion' }).click();
        await page.keyboard.press('Enter');
        expect(await clicks.evaluate((seen) => seen.count)).toBe(2);
    },
    disabled: async ({ page }) => {
        await mount(page, '<pttrn-chip disabled label="Suggestion"></pttrn-chip>');
        const clicks = await clickCounter(page);
        const chip = page.getByRole('button', { name: 'Suggestion' });
        await expect(chip).toBeDisabled();
        await chip.click({ force: true });
        await page.locator('pttrn-chip').evaluate((el) => (el as HTMLElement).click());
        expect(await clicks.evaluate((seen) => seen.count)).toBe(0);
    },
    selected: async ({ page }) => {
        await mount(page, '<pttrn-chip label="Filter" selected></pttrn-chip>');
        const chip = page.getByRole('button', { name: 'Filter' });
        await expect(chip).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('pttrn-chip')).toHaveAttribute('selected', '');
        await expect(chip).toHaveAttribute('data-selected', '');

        await mount(page, '<pttrn-chip label="Filter" toggle></pttrn-chip>');
        await expect(chip).toHaveAttribute('aria-pressed', 'false');
        await expect(chip).not.toHaveAttribute('data-selected');

        await mount(page, '<pttrn-chip label="Action"></pttrn-chip>');
        await expect(page.getByRole('button', { name: 'Action' })).not.toHaveAttribute('aria-pressed');
    },
    'icons-decorative': async ({ page }) => {
        await mount(page, PRESETS['Both Icons']);
        const wrappers = page.locator('pttrn-chip [data-chip-icon]');
        await expect(wrappers).toHaveCount(2);
        for (const wrapper of await wrappers.all()) await expect(wrapper).toHaveAttribute('aria-hidden', 'true');
        await expect(page.locator('pttrn-chip svg')).toHaveCount(2);
        await expect(page.getByRole('button', { name: 'chip' })).toBeVisible();
    },
    'trailing-badge': async ({ page }) => {
        await mount(page, '<pttrn-chip badge-count="7" label="Inbox"></pttrn-chip>');
        await expect(page.locator('pttrn-chip [data-badge]')).toHaveText('7');

        await mount(page, `<pttrn-chip badge-count="7" label="Inbox">${trail('Cloud')}</pttrn-chip>`);
        await expect(page.locator('pttrn-chip [data-badge]')).toHaveCount(0);
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-chip').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
