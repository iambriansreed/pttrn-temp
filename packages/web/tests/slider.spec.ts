import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Slider/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** A slider in a 320px column, `label="Volume" name="volume" min="0" max="100"` unless `attributes` sets them. */
const slider = (attributes = '') => {
    const defaults = { label: 'Volume', max: '100', min: '0', name: 'volume' };
    const own = Object.entries(defaults)
        .filter(([key]) => !new RegExp(`(^|\\s)${key}=`).test(attributes))
        .map(([key, value]) => `${key}="${value}"`);
    return `<div style="width: 320px"><pttrn-slider ${[...own, attributes].join(' ')}></pttrn-slider></div>`;
};

/**
 * Mirrors the presets in `packages/react/src/components/Slider/SliderExample.tsx` (formatNumber is set in
 * `mountPreset`).
 */
const PRESETS = {
    Basic: { html: slider('label="Basic option" min="20" max="80" value="30"'), format: '$' },
    'Formatted Number': { html: slider('label="Price option" step="5" value="50"'), format: '$' },
    'Range Slider': { html: slider('label="Range option" value="70,80"'), format: '%' },
    'Continuous Slider': { html: slider('label="What is the purpose of life?" value="42"'), format: '' },
    'Discrete Slider': { html: slider('label="Discrete option" step="10" value="40" marks'), format: '' },
};

async function mountPreset(page: Page, { html, format }: { html: string; format: string }) {
    await mount(page, html);
    await page.locator('pttrn-slider').evaluate((el, unit) => {
        const element = el as HTMLElement & { formatNumber?: (n: number) => string };
        if (unit === '$') element.formatNumber = (n) => `$${n}`;
        if (unit === '%') element.formatNumber = (n) => `${n}%`;
    }, format);
}

const knob = (page: Page, name: string) => page.getByRole('slider', { name, exact: true });
const text = (page: Page, part: string) => page.locator(`pttrn-slider [${part}]`);
const formValue = (page: Page) => page.evaluate(() => [...new FormData(document.querySelector('form')!).entries()]);

/** Collects `detail.value` of every `pttrn-change`. */
async function recordChanges(page: Page) {
    await page.evaluate(() => {
        const seen: unknown[] = [];
        (window as unknown as { seen: unknown[] }).seen = seen;
        document.addEventListener('pttrn-change', (event) => seen.push((event as CustomEvent).detail.value));
    });
    return () => page.evaluate(() => (window as unknown as { seen: unknown[] }).seen);
}

test.describe('pttrn-slider', () => {
    test('a click on the track moves the nearest knob there, and a knob can be dragged', async ({ page }) => {
        await mount(page, slider('value="20,60"'));
        const log = await recordChanges(page);
        const track = (await page.locator('pttrn-slider [data-slider-body]').boundingBox())!;
        await page.mouse.click(track.x + track.width * 0.9, track.y + track.height / 2);
        expect((await log()).at(-1)).toEqual([20, 90]);

        const start = (await knob(page, 'Volume start').boundingBox())!;
        await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
        await page.mouse.down();
        await page.mouse.move(track.x + track.width * 0.5, start.y + start.height / 2, { steps: 4 });
        await page.mouse.up();
        expect((await log()).at(-1)).toEqual([50, 90]);
        await expect(knob(page, 'Volume start')).toHaveAttribute('aria-valuenow', '50');
    });

    test('a form reset goes back to the value attribute', async ({ page }) => {
        await mount(page, `<form>${slider('value="40"')}<button type="reset">Reset</button></form>`);
        await knob(page, 'Volume').focus();
        await page.keyboard.press('ArrowRight');
        expect(await formValue(page)).toEqual([['volume', '41']]);
        await page.getByRole('button', { name: 'Reset' }).click();
        await expect(knob(page, 'Volume')).toHaveAttribute('aria-valuenow', '40');
    });

    test('marks are a dot at every step, white inside the filled part', async ({ page }) => {
        await mount(page, slider('step="10" value="40" marks'));
        const dots = page.locator('pttrn-slider [data-interval-dot]');
        await expect(dots).toHaveCount(9);
        expect(await dots.evaluateAll((all) => all.map((dot) => dot.hasAttribute('data-filled-section')))).toEqual([
            true,
            true,
            true,
            false,
            false,
            false,
            false,
            false,
            false,
        ]);
    });
});

describeBehaviors(spec, {
    'renders-values': async ({ page }) => {
        await mount(page, slider('value="40"'));
        await page.locator('pttrn-slider').evaluate((el) => {
            (el as HTMLElement & { formatNumber: (n: number) => string }).formatNumber = (n) => `${n}%`;
        });
        await expect(page.getByText('Volume')).toBeVisible();
        await expect(text(page, 'data-value-label')).toHaveText('40%');
        await expect(text(page, 'data-min-label')).toHaveText('0%');
        await expect(text(page, 'data-max-label')).toHaveText('100%');
        await expect(knob(page, 'Volume')).toHaveAttribute('aria-valuetext', '40%');
    },
    'exposes-value': async ({ page }) => {
        await mount(page, slider('value="40"'));
        const volume = knob(page, 'Volume');
        await expect(volume).toHaveAttribute('aria-valuemin', '0');
        await expect(volume).toHaveAttribute('aria-valuemax', '100');
        await expect(volume).toHaveAttribute('aria-valuenow', '40');
        await expect(volume).toHaveAttribute('aria-valuetext', '40');
    },
    controlled: async ({ page }) => {
        await mount(page, `<form>${slider('value="40"')}</form>`);
        await expect(knob(page, 'Volume')).toHaveAttribute('aria-valuenow', '40');
        await page.locator('pttrn-slider').evaluate((el) => el.setAttribute('value', '70'));
        await expect(knob(page, 'Volume')).toHaveAttribute('aria-valuenow', '70');
        expect(await formValue(page)).toEqual([['volume', '70']]);
        await page.locator('pttrn-slider').evaluate((el) => ((el as HTMLElement & { value: number }).value = 25));
        await expect(knob(page, 'Volume')).toHaveAttribute('aria-valuenow', '25');
    },
    'arrow-keys': async ({ page }) => {
        await mount(page, slider('step="5" value="90"'));
        const log = await recordChanges(page);
        await knob(page, 'Volume').focus();
        await page.keyboard.press('ArrowRight');
        expect((await log()).at(-1)).toBe(95);
        await page.keyboard.press('ArrowLeft');
        expect((await log()).at(-1)).toBe(90);
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        expect((await log()).at(-1)).toBe(100);
        await expect(knob(page, 'Volume')).toHaveAttribute('aria-valuenow', '100');
    },
    range: async ({ page }) => {
        await mount(
            page,
            '<form><pttrn-slider label="Price" max="100" min="0" name="price" value="20,60"></pttrn-slider></form>',
        );
        const log = await recordChanges(page);
        expect(await formValue(page)).toEqual([['price', '20,60']]);
        await expect(text(page, 'data-value-label')).toHaveText('20 - 60');

        await knob(page, 'Price start').focus();
        await page.keyboard.press('ArrowRight');
        expect((await log()).at(-1)).toEqual([21, 60]);
        await knob(page, 'Price end').focus();
        await page.keyboard.press('ArrowLeft');
        expect((await log()).at(-1)).toEqual([21, 59]);
        expect(await formValue(page)).toEqual([['price', '21,59']]);
    },
    disabled: async ({ page }) => {
        await mount(page, slider('disabled value="40"'));
        const log = await recordChanges(page);
        await expect(knob(page, 'Volume')).toHaveAttribute('tabindex', '-1');
        await expect(knob(page, 'Volume')).toHaveAttribute('aria-disabled', 'true');
        await knob(page, 'Volume').focus();
        await page.keyboard.press('ArrowRight');
        expect(await log()).toEqual([]);
    },
    'read-only': async ({ page }) => {
        await mount(page, slider('readonly value="40"'));
        const log = await recordChanges(page);
        await expect(knob(page, 'Volume')).toHaveAttribute('tabindex', '0');
        await expect(knob(page, 'Volume')).toHaveAttribute('aria-readonly', 'true');
        await knob(page, 'Volume').focus();
        await page.keyboard.press('ArrowRight');
        expect(await log()).toEqual([]);
        await expect(knob(page, 'Volume')).toHaveAttribute('aria-valuenow', '40');
    },
    'hidden-input': async ({ page }) => {
        await mount(page, `<form>${slider('value="40"')}</form>`);
        expect(await formValue(page)).toEqual([['volume', '40']]);
    },
    'axe-clean': async ({ page }) => {
        for (const preset of Object.values(PRESETS)) {
            await mountPreset(page, preset);
            const results = await new AxeBuilder({ page }).include('pttrn-slider').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
