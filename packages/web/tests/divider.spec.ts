import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Divider/spec';
import { tokenColor, tokenLength } from './computed';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const BLOCK = '<div style="height: 100px; width: 100px; background: #eee"></div>';

/**
 * Mirrors `packages/react/src/components/Divider/DividerExample.tsx`: the line between two blocks, in a 300px column
 * for horizontal and a row for vertical.
 */
const horizontal = (attributes = '') =>
    `<div style="display: flex; flex-direction: column; width: 300px">${BLOCK}<pttrn-divider ${attributes}></pttrn-divider>${BLOCK}</div>`;
const vertical = (attributes = '') =>
    `<div style="display: flex; flex-direction: row; align-items: center; height: 300px">${BLOCK}<pttrn-divider orientation="vertical" ${attributes}></pttrn-divider>${BLOCK}</div>`;

const PRESETS = {
    'Divider - Horizontal': horizontal(),
    'Divider - Vertical': vertical(),
};

const line = (page: Page) => page.locator('pttrn-divider [data-pttrn="divider"]');

const measure = (page: Page) =>
    line(page).evaluate((element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return {
            width: box.width,
            height: box.height,
            margin: style.margin,
            radius: style.borderRadius,
            background: style.backgroundColor,
        };
    });

test.describe('pttrn-divider', () => {
    test('is hidden from assistive technology', async ({ page }) => {
        await mount(page, PRESETS['Divider - Horizontal']);
        await expect(line(page)).toHaveAttribute('aria-hidden', 'true');
        await expect(page.getByRole('separator')).toHaveCount(0);
        await expect(page.getByRole('separator', { includeHidden: true })).toHaveCount(1);
    });

    test('follows properties set from code', async ({ page }) => {
        await mount(page, horizontal());
        await page
            .locator('pttrn-divider')
            .evaluate((element) => Object.assign(element, { thickness: 'heavy', hidePadding: true, inset: 2 }));
        await expect(line(page)).toHaveAttribute('data-thickness', 'heavy');
        expect(await measure(page)).toMatchObject({
            height: 2,
            margin: `0px ${await tokenLength(page, '--usa-spacing-1')}`,
        });
    });

    test('keeps its spacing under a page-level reset', async ({ page }) => {
        await mount(page, horizontal());
        await page.addStyleTag({ path: path.resolve(import.meta.dirname, '../../styles/reset.css') });
        expect((await measure(page)).margin).toBe(`${await tokenLength(page, '--usa-spacing-1')} 0px`);
    });
});

describeBehaviors(spec, {
    'horizontal-by-default': async ({ page }) => {
        await mount(page, PRESETS['Divider - Horizontal']);
        await expect(line(page)).toHaveAttribute('data-orientation', 'horizontal');
        await expect(line(page)).toHaveAttribute('aria-orientation', 'horizontal');
        await expect(line(page)).toHaveAttribute('data-thickness', 'light');
        await expect(line(page)).not.toHaveAttribute('data-hide-padding');
        expect(await measure(page)).toEqual({
            width: 300,
            height: 1,
            margin: `${await tokenLength(page, '--usa-spacing-1')} 0px`,
            radius: '0px',
            background: await tokenColor(page, '--theme-color-base-lighter'),
        });
    },
    vertical: async ({ page }) => {
        await mount(page, PRESETS['Divider - Vertical']);
        await expect(line(page)).toHaveAttribute('data-orientation', 'vertical');
        await expect(line(page)).toHaveAttribute('aria-orientation', 'vertical');
        expect(await measure(page)).toMatchObject({
            width: 1,
            height: 300,
            margin: `0px ${await tokenLength(page, '--usa-spacing-1')}`,
        });
    },
    'thickness-and-padding': async ({ page }) => {
        await mount(page, horizontal('thickness="heavy"'));
        await expect(line(page)).toHaveAttribute('data-thickness', 'heavy');
        expect(await measure(page)).toMatchObject({
            height: 2,
            margin: `${await tokenLength(page, '--usa-spacing-2')} 0px`,
            radius: await tokenLength(page, '--usa-radius-pill'),
        });

        await mount(page, horizontal('thickness="heavy" hide-padding'));
        await expect(line(page)).toHaveAttribute('data-hide-padding');
        expect(await measure(page)).toMatchObject({ height: 2, margin: '0px' });
    },
    inset: async ({ page }) => {
        // Four half units (`--usa-spacing-05`) at each end.
        await mount(page, horizontal('inset="4"'));
        const unit = parseFloat(await tokenLength(page, '--usa-spacing-05'));
        const padding = await tokenLength(page, '--usa-spacing-1');
        expect(await line(page).evaluate((element) => element.style.getPropertyValue('--inset'))).toBe(
            'calc(var(--usa-spacing-05) * 4)',
        );
        expect(await measure(page)).toMatchObject({ width: 300 - 8 * unit, margin: `${padding} ${4 * unit}px` });

        await mount(page, vertical('inset="4"'));
        expect(await measure(page)).toMatchObject({ height: 300 - 8 * unit, margin: `${4 * unit}px ${padding}` });

        await mount(page, horizontal('inset="13"'));
        expect(await measure(page)).toMatchObject({ width: 300, margin: `${padding} 0px` });
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-divider').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
