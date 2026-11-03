import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { spec } from '../../react/src/components/Button/spec';
import { icon } from './icons';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const ADD = icon('Add');

/** Mirrors the presets in `packages/react/src/components/Button/ButtonExample.tsx`. */
const PRESETS = {
    'Icon & Text': `<pttrn-button label="Add">${ADD}</pttrn-button>`,
    'Text only': '<pttrn-button label="Add"></pttrn-button>',
    'Icon only': `<pttrn-button icon-only label="Add">${ADD}</pttrn-button>`,
};

/** Counts the `click` events that reach the document. */
const countClicks = (page: import('@playwright/test').Page) =>
    page.evaluate(() => {
        (window as unknown as { clicks: number }).clicks = 0;
        document.addEventListener('click', () => (window as unknown as { clicks: number }).clicks++);
    });
const clicks = (page: import('@playwright/test').Page) =>
    page.evaluate(() => (window as unknown as { clicks: number }).clicks);

test.describe('pttrn-button', () => {
    test('reflects size, variant, width and the flags as attributes', async ({ page }) => {
        await mount(page, '<pttrn-button label="Save"></pttrn-button>');
        const button = page.locator('pttrn-button');
        await expect(button).toHaveAttribute('size', 'medium');
        await expect(button).toHaveAttribute('variant', 'primary');
        await expect(button).toHaveAttribute('width', 'hug');
        await button.evaluate((el) => Object.assign(el, { destructive: true, disabled: true }));
        await expect(button).toHaveAttribute('destructive', '');
        await expect(button).toHaveAttribute('disabled', '');
    });

    test('measures like the React button at each size', async ({ page }) => {
        await mount(
            page,
            ['x-small', 'small', 'medium', 'large']
                .map((size) => `<pttrn-button label="Add" size="${size}">${ADD}</pttrn-button>`)
                .join(''),
        );
        const heights = await page
            .locator('pttrn-button')
            .evaluateAll((els) => els.map((el) => el.shadowRoot!.querySelector('button')!.offsetHeight));
        expect(heights).toEqual([24, 32, 40, 48]);
    });

    test('fill stretches to the container', async ({ page }) => {
        await mount(page, '<div style="width: 300px"><pttrn-button label="Wide" width="fill"></pttrn-button></div>');
        expect(await page.getByRole('button', { name: 'Wide' }).evaluate((el) => el.offsetWidth)).toBe(300);
    });

    test('type="submit" submits its form and type="reset" resets it', async ({ page }) => {
        await mount(
            page,
            `<form onsubmit="event.preventDefault(); window.submitted = (window.submitted || 0) + 1">
                <input name="q" value="start" />
                <pttrn-button label="Send" type="submit"></pttrn-button>
                <pttrn-button label="Clear" type="reset"></pttrn-button>
                <pttrn-button label="Nothing"></pttrn-button>
            </form>`,
        );
        await page.getByRole('textbox').fill('changed');
        await page.getByRole('button', { name: 'Nothing' }).click();
        await page.getByRole('button', { name: 'Send' }).click();
        expect(await page.evaluate(() => (window as unknown as { submitted: number }).submitted)).toBe(1);
        await page.getByRole('button', { name: 'Clear' }).click();
        await expect(page.getByRole('textbox')).toHaveValue('start');
    });

    test('focus() on the element focuses the inner button', async ({ page }) => {
        await mount(page, '<pttrn-button label="Save"></pttrn-button>');
        await page.locator('pttrn-button').evaluate((el) => (el as HTMLElement).focus());
        await expect(page.getByRole('button', { name: 'Save' })).toBeFocused();
    });
});

describeBehaviors(spec, {
    'renders-label': async ({ page }) => {
        await mount(page, '<pttrn-button label="Save"></pttrn-button>');
        const button = page.getByRole('button', { name: 'Save' });
        await expect(button).toHaveText('Save');
        await expect(button).toHaveAttribute('type', 'button');
    },
    click: async ({ page }) => {
        await mount(page, '<pttrn-button label="Save"></pttrn-button>');
        await countClicks(page);
        const button = page.getByRole('button', { name: 'Save' });
        await button.click();
        expect(await clicks(page)).toBe(1);
        await page.keyboard.press('Enter');
        await page.keyboard.press('Space');
        expect(await clicks(page)).toBe(3);
    },
    disabled: async ({ page }) => {
        await mount(page, '<pttrn-button disabled label="Save"></pttrn-button>');
        await countClicks(page);
        const button = page.getByRole('button', { name: 'Save' });
        await expect(button).toBeDisabled();
        await button.click({ force: true });
        // A click dispatched on the element itself is stopped too, as a disabled native button ignores click().
        await page.locator('pttrn-button').evaluate((el) => (el as HTMLElement).click());
        expect(await clicks(page)).toBe(0);
        await page.keyboard.press('Tab');
        await expect(button).not.toBeFocused();
    },
    'icon-only': async ({ page }) => {
        await mount(page, `<div style="padding: 100px">${PRESETS['Icon only']}</div>`);
        const button = page.getByRole('button', { name: 'Add' });
        await expect(button.locator('[data-button-label]')).toBeHidden();
        await expect(page.locator('pttrn-button svg')).toBeVisible();

        const tooltip = page.getByRole('tooltip');
        await expect(tooltip).toBeHidden();
        await button.hover();
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toHaveText('Add');
        // Above the button, like `placement="top"`.
        const [tip, trigger] = await Promise.all([tooltip.boundingBox(), button.boundingBox()]);
        expect(tip!.y + tip!.height).toBeLessThanOrEqual(trigger!.y);
        await page.mouse.move(0, 0);
        await expect(tooltip).toBeHidden();

        // With no room above, it flips below.
        await mount(page, PRESETS['Icon only']);
        await page.getByRole('button', { name: 'Add' }).hover();
        const [below, top] = await Promise.all([
            page.getByRole('tooltip').boundingBox(),
            page.getByRole('button', { name: 'Add' }).boundingBox(),
        ]);
        expect(below!.y).toBeGreaterThanOrEqual(top!.y + top!.height);

        // Without an icon, iconOnly is ignored and the label shows.
        await mount(page, '<pttrn-button icon-only label="Add"></pttrn-button>');
        await expect(page.getByRole('button', { name: 'Add' })).toHaveText('Add');
    },
    'icon-decorative': async ({ page }) => {
        await mount(page, PRESETS['Icon & Text']);
        const wrapper = page.locator('pttrn-button').locator('[data-button-icon]');
        await expect(wrapper).toHaveAttribute('aria-hidden', 'true');
        await expect(page.getByRole('button', { name: 'Add' })).toHaveText('Add');
    },
    tooltip: async ({ page }) => {
        await mount(
            page,
            `<pttrn-button label="Save" tooltip="Saves the draft"></pttrn-button>${PRESETS['Icon only']}`,
        );
        const save = page.getByRole('button', { name: 'Save' });
        await expect(save).toHaveAccessibleDescription('Saves the draft');
        await expect(save).not.toHaveAttribute('aria-labelledby');
        await save.focus();
        await expect(page.getByRole('tooltip', { name: 'Saves the draft' })).toBeVisible();

        const add = page.getByRole('button', { name: 'Add' });
        await expect(add).toHaveAttribute('aria-labelledby');
        await expect(add).not.toHaveAttribute('aria-describedby');
    },
    'aria-label-wins': async ({ page }) => {
        await mount(
            page,
            `<pttrn-button aria-label="Next slide" icon-only label="Next">${icon('ArrowForward')}</pttrn-button>`,
        );
        const button = page.getByRole('button', { name: 'Next slide' });
        await expect(button).not.toHaveAttribute('aria-labelledby');
        await expect(page.getByRole('button')).toHaveCount(1);
    },
    'as-element': async ({ page }) => {
        await mount(page, '<pttrn-button href="#somewhere" label="Go"></pttrn-button>');
        const link = page.getByRole('button', { name: 'Go' });
        expect(await link.evaluate((el) => el.tagName)).toBe('A');
        await expect(link).not.toHaveAttribute('type');
        await expect(link).toHaveAttribute('href', '#somewhere');
        await link.click();
        expect(await page.evaluate(() => location.hash)).toBe('#somewhere');
    },
    'children-label': async ({ page }) => {
        await mount(page, '<pttrn-button label="Ignored">From children</pttrn-button>');
        await expect(page.getByRole('button', { name: 'From children' })).toBeVisible();
        await expect(page.getByText('From children')).toBeVisible();
        await expect(page.getByText('Ignored')).toHaveCount(0);
    },
    'axe-clean': async ({ page }) => {
        for (const html of [
            ...Object.values(PRESETS),
            `<pttrn-button aria-label="Next slide" icon-only label="Next">${ADD}</pttrn-button>`,
            '<pttrn-button disabled label="Save" variant="secondary"></pttrn-button>',
            '<pttrn-button destructive label="Delete" variant="tertiary"></pttrn-button>',
            '<pttrn-button href="#x" label="Go"></pttrn-button>',
        ]) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-button').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
