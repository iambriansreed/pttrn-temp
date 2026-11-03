import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Tag/spec';
import { tokenColor, tokenLength } from './computed';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const LONG = 'Hello, this is a very long tag label that should be truncated if it exceeds the container width.';

/** Mirrors the presets in `packages/react/src/components/Tag/TagExample.tsx`, plus the default. */
const PRESETS = {
    Default: '<pttrn-tag label="Draft"></pttrn-tag>',
    'Long Label': `<pttrn-tag label="${LONG}" color="accent-cool" size="small" variant="flat"></pttrn-tag>`,
};

const tag = (page: Page) => page.locator('pttrn-tag [data-pttrn="tag"]');

test.describe('pttrn-tag', () => {
    test('takes the color family and size from the tokens', async ({ page }) => {
        await mount(page, '<pttrn-tag label="Draft" color="success" size="x-small" variant="pill"></pttrn-tag>');
        await expect(tag(page)).toHaveCSS('background-color', await tokenColor(page, '--theme-color-success-lighter'));
        await expect(tag(page)).toHaveCSS('color', await tokenColor(page, '--theme-color-success-darker'));
        await expect(tag(page)).toHaveCSS('height', await tokenLength(page, '--usa-spacing-3'));
        await expect(tag(page)).toHaveCSS('border-radius', await tokenLength(page, '--usa-radius-pill'));
    });

    test('a long label is cut, and shows whole in a tooltip on hover', async ({ page }) => {
        await mount(page, `<div style="padding: 60px">${PRESETS['Long Label']}</div>`);
        expect((await tag(page).boundingBox())!.width).toBe(200);
        const label = page.locator('pttrn-tag [data-truncated]');
        await expect(label).toHaveAttribute('role', 'note');
        await expect(page.getByRole('note', { name: LONG })).toBeVisible();

        const tooltip = page.getByRole('tooltip');
        await expect(tooltip).toBeHidden();
        await label.hover();
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toHaveText(LONG);
        // Above the tag, as React's Tooltip places it.
        expect((await tooltip.boundingBox())!.y).toBeLessThan((await tag(page).boundingBox())!.y);
        await page.mouse.move(0, 0);
        await expect(tooltip).toBeHidden();
    });

    test('a label that fits has no tooltip', async ({ page }) => {
        await mount(page, PRESETS.Default);
        await expect(page.locator('pttrn-tag [data-truncated]')).not.toHaveAttribute('role');
        await page.locator('pttrn-tag [data-truncated]').hover();
        await expect(page.getByRole('tooltip')).toHaveCount(0);
    });
});

describeBehaviors(spec, {
    'renders-label': async ({ page }) => {
        await mount(page, PRESETS.Default);
        await expect(tag(page)).toHaveText('Draft');
        await expect(tag(page)).toHaveJSProperty('tagName', 'SPAN');
    },
    variants: async ({ page }) => {
        await mount(page, PRESETS.Default);
        await expect(tag(page)).toHaveAttribute('data-color', 'base');
        await expect(tag(page)).toHaveAttribute('data-size', 'small');
        await expect(tag(page)).toHaveAttribute('data-variant', 'flat');
        await expect(tag(page).locator('[data-triangle]')).toHaveCount(0);

        await mount(page, '<pttrn-tag label="Draft" color="success" size="x-small" variant="corner-wrap"></pttrn-tag>');
        await expect(tag(page)).toHaveAttribute('data-color', 'success');
        await expect(tag(page)).toHaveAttribute('data-size', 'x-small');
        await expect(tag(page)).toHaveAttribute('data-variant', 'corner-wrap');
        await expect(tag(page).locator('[data-triangle]')).toHaveCount(1);
    },
    'passes-attributes': async ({ page }) => {
        await mount(
            page,
            '<pttrn-tag data-testid="status" id="status-tag" label="Draft" title="Not published"></pttrn-tag>',
        );
        const host = page.getByTestId('status');
        await expect(host).toHaveAttribute('id', 'status-tag');
        await expect(host).toHaveAttribute('title', 'Not published');
        await expect(host).toHaveText('Draft');
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-tag').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
