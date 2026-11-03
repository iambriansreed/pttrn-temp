import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/BadgeDot/spec';
import { tokenColor } from './computed';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const BUTTON = '<button type="button">Messages</button>';

/** Mirrors `packages/react/src/components/BadgeDot/BadgeDotExample.tsx`: attached by default, and the outline sizes. */
const PRESETS = {
    Default: `<pttrn-badge-dot>${BUTTON}</pttrn-badge-dot>`,
    Alone: '<pttrn-badge-dot></pttrn-badge-dot>',
    ...Object.fromEntries(
        [6, 8, 10, 12].map((size) => [
            `Outline ${size}`,
            `<pttrn-badge-dot outline size="${size}">${BUTTON}</pttrn-badge-dot>`,
        ]),
    ),
};

const dot = (page: Page) => page.locator('pttrn-badge-dot [data-pttrn="badge-dot"]').first();

const box = (page: Page) =>
    dot(page).evaluate((element) => {
        const style = getComputedStyle(element);
        return { width: style.width, height: style.height, border: style.borderTopWidth, color: style.backgroundColor };
    });

test.describe('pttrn-badge-dot', () => {
    test('whitespace around no children leaves the dot unattached', async ({ page }) => {
        await mount(page, '<pttrn-badge-dot>\n    \n</pttrn-badge-dot>');
        await expect(dot(page)).not.toHaveAttribute('data-attachment');
    });

    test('attaches and detaches as children come and go', async ({ page }) => {
        await mount(page, PRESETS.Alone);
        await page.locator('pttrn-badge-dot').evaluate((element) => (element.innerHTML = '<button>Inbox</button>'));
        await expect(dot(page)).toHaveAttribute('data-attachment');
        await page.locator('pttrn-badge-dot').evaluate((element) => (element.innerHTML = ''));
        await expect(dot(page)).not.toHaveAttribute('data-attachment');
    });
});

describeBehaviors(spec, {
    'renders-dot': async ({ page }) => {
        await mount(page, PRESETS.Alone);
        await expect(dot(page)).toHaveJSProperty('tagName', 'SUP');
        await expect(dot(page)).toHaveAttribute('data-color', 'primary');
        await expect(dot(page)).not.toHaveAttribute('data-attachment');
        await expect(dot(page)).toHaveText('');
        expect(await box(page)).toEqual({
            width: '6px',
            height: '6px',
            border: '0px',
            color: await tokenColor(page, '--theme-color-primary-medium'),
        });
    },
    'attaches-to-child': async ({ page }) => {
        await mount(page, PRESETS.Default);
        const button = page.getByRole('button', { name: 'Messages' });
        await expect(button).toBeVisible();
        await expect(dot(page)).toHaveAttribute('data-attachment');
        // The dot comes after the child and sits centered on its top right corner.
        const [buttonBox, dotBox] = await Promise.all([button.boundingBox(), dot(page).boundingBox()]);
        expect(dotBox!.x + dotBox!.width / 2).toBeCloseTo(buttonBox!.x + buttonBox!.width, 0);
        expect(dotBox!.y + dotBox!.height / 2).toBeCloseTo(buttonBox!.y, 0);
        const order = await page
            .locator('pttrn-badge-dot')
            .evaluate((element) =>
                [...element.shadowRoot!.querySelector('[data-wrapper]')!.children].map((c) => c.tagName),
            );
        expect(order).toEqual(['SLOT', 'SUP']);
    },
    'size-and-outline': async ({ page }) => {
        await mount(page, PRESETS['Outline 12']);
        await expect(dot(page)).toHaveAttribute('data-outline');
        expect(await box(page)).toMatchObject({ width: '12px', height: '12px', border: '2px' });

        await mount(page, `<pttrn-badge-dot outline size="7">${BUTTON}</pttrn-badge-dot>`);
        expect(await box(page)).toMatchObject({ width: '6px', height: '6px', border: '1px' });
    },
    color: async ({ page }) => {
        await mount(page, '<pttrn-badge-dot color="secondary"></pttrn-badge-dot>');
        await expect(dot(page)).toHaveAttribute('data-color', 'secondary');
        expect((await box(page)).color).toBe(await tokenColor(page, '--theme-color-secondary-dark'));
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-badge-dot').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
