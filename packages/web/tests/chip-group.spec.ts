import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { spec } from '../../react/src/components/ChipGroup/spec';
import { icon } from './icons';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const lead = (name: string) => icon(name, 'leading-icon');
const trail = (name: string) => icon(name, 'trailing-icon');

const CHIPS = [
    ['Lightbulb', 'ChevronRight'],
    ['Icecream', 'ChevronRight'],
    ['SignLanguage', 'Close'],
    ['Star', 'Close'],
    ['Cloud', 'KeyboardArrowDown'],
]
    .map(
        ([leading, trailing], i) => `<pttrn-chip label="chip ${i + 1}">${lead(leading)}${trail(trailing)}</pttrn-chip>`,
    )
    .join('');

const FLAT = [
    ['Lightbulb', 9],
    ['Icecream', 2],
    ['SignLanguage', 0],
    ['Star', 5],
    ['Cloud', 3],
]
    .map(([leading, count], i) =>
        i === 2
            ? `<pttrn-chip flat label="chip 3">${lead(String(leading))}${trail('Close')}</pttrn-chip>`
            : `<pttrn-chip badge-count="${count}" badge-size="x-small" flat label="chip ${i + 1}">${lead(String(leading))}</pttrn-chip>`,
    )
    .join('');

/** Mirrors the default state and the presets in `packages/react/src/components/ChipGroup/ChipGroupExample.tsx`. */
const PRESETS = {
    Default: `<div style="width: 600px"><pttrn-chip-group>${CHIPS}</pttrn-chip-group></div>`,
    Scroll: `<div style="width: 600px"><pttrn-chip-group overflow="scroll">${CHIPS}</pttrn-chip-group></div>`,
    'Scroll: Flat chips': `<div style="width: 600px"><pttrn-chip-group overflow="scroll">${FLAT}</pttrn-chip-group></div>`,
};

const group = (page: import('@playwright/test').Page) => page.locator('pttrn-chip-group [data-pttrn="chip-group"]');

test.describe('pttrn-chip-group', () => {
    test('wraps onto a second line, or scrolls sideways on one', async ({ page }) => {
        const narrow = (overflow: string) =>
            `<div style="width: 300px"><pttrn-chip-group ${overflow}>${CHIPS}</pttrn-chip-group></div>`;
        await mount(page, narrow(''));
        const wrapped = await group(page).evaluate((el) => ({
            h: el.clientHeight,
            scroll: el.scrollWidth > el.clientWidth,
        }));
        expect(wrapped.h).toBeGreaterThan(64);
        expect(wrapped.scroll).toBe(false);

        await mount(page, narrow('overflow="scroll"'));
        const scrolled = await group(page).evaluate((el) => ({
            h: el.clientHeight,
            scroll: el.scrollWidth > el.clientWidth,
        }));
        expect(scrolled.h).toBeLessThan(64);
        expect(scrolled.scroll).toBe(true);
    });
});

describeBehaviors(spec, {
    'renders-chips': async ({ page }) => {
        await mount(
            page,
            `<pttrn-chip-group>${CHIPS}<pttrn-chip label="last" selected></pttrn-chip></pttrn-chip-group>`,
        );
        await expect(page.getByRole('button')).toHaveCount(6);
        const last = page.getByRole('button', { name: 'last' });
        await expect(last).toHaveAttribute('aria-pressed', 'true');
        const clicks = await page.evaluateHandle(() => {
            const seen = { count: 0 };
            document.querySelector('pttrn-chip[label="last"]')!.addEventListener('click', () => seen.count++);
            return seen;
        });
        await last.click();
        expect(await clicks.evaluate((seen) => seen.count)).toBe(1);
    },
    overflow: async ({ page }) => {
        await mount(page, PRESETS.Default);
        await expect(page.locator('pttrn-chip-group')).toHaveAttribute('overflow', 'wrap');
        await expect(group(page)).not.toHaveAttribute('data-scroll');
        await expect(group(page)).toHaveCSS('flex-wrap', 'wrap');

        await mount(page, PRESETS.Scroll);
        await expect(page.locator('pttrn-chip-group')).toHaveAttribute('overflow', 'scroll');
        await expect(group(page)).toHaveAttribute('data-scroll', '');
        await expect(group(page)).toHaveCSS('flex-wrap', 'nowrap');
    },
    empty: async ({ page }) => {
        await mount(page, '<pttrn-chip-group> </pttrn-chip-group>');
        await expect(group(page)).toBeHidden();
        expect(await page.locator('pttrn-chip-group').evaluate((el) => el.getBoundingClientRect().height)).toBe(0);

        // A chip added later shows the group.
        await page.locator('pttrn-chip-group').evaluate((el) => {
            const chip = document.createElement('pttrn-chip');
            chip.setAttribute('label', 'New');
            el.append(chip);
        });
        await expect(page.getByRole('button', { name: 'New' })).toBeVisible();
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-chip-group').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
