import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Tooltip/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const ICON = '<svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16"><circle cx="8" cy="8" r="6" /></svg>';
/** An icon-only button: a trigger with no name of its own, which the tooltip names. */
const ICON_BUTTON = `<button type="button">${ICON}</button>`;

const tooltip = (attributes = 'label="Example label"', trigger = ICON_BUTTON) =>
    `<div style="padding: 80px 240px"><pttrn-tooltip ${attributes}>${trigger}</pttrn-tooltip></div>`;

/**
 * Mirrors the presets in `packages/react/src/components/Tooltip/TooltipExample.tsx`, with buttons as triggers so they
 * can take focus.
 */
const PRESETS = {
    Default: tooltip('label="Example label" placement="top"'),
    'Long Label Tooltip': tooltip(
        'label="This is a longer tooltip label to demonstrate how the tooltip handles more content." placement="top"',
        '<button type="button">Long Tooltip Label</button>',
    ),
    'No Label': tooltip('label="" placement="top"', '<button type="button">No Label</button>'),
};

const trigger = (page: Page) => page.getByRole('button');
/** The floating box in the shadow root (the top-layer popover). */
const floating = (page: Page) => page.locator('pttrn-tooltip [data-pttrn="tooltip"]');

test.describe('pttrn-tooltip', () => {
    test('renders the label inside the floating box', async ({ page }) => {
        await mount(page, PRESETS.Default);
        await trigger(page).hover();
        await expect(floating(page)).toBeVisible();
        await expect(page.getByRole('tooltip')).toHaveText('Example label');
    });

    test('places the tooltip on the requested side, with the arrow aimed at the trigger', async ({ page }) => {
        for (const placement of ['top', 'bottom', 'left', 'right'] as const) {
            await mount(page, tooltip(`label="Example label" placement="${placement}"`));
            await trigger(page).hover();
            await expect(floating(page)).toHaveAttribute('data-placement', placement);
            const [box, button, arrow] = await Promise.all([
                floating(page).boundingBox(),
                trigger(page).boundingBox(),
                page.locator('pttrn-tooltip [data-arrow]').boundingBox(),
            ]);
            const gap = {
                top: button!.y - (box!.y + box!.height),
                bottom: box!.y - (button!.y + button!.height),
                left: button!.x - (box!.x + box!.width),
                right: box!.x - (button!.x + button!.width),
            }[placement];
            expect(gap).toBeCloseTo(8, 0);
            const vertical = placement === 'top' || placement === 'bottom';
            const arrowCenter = vertical ? arrow!.x + arrow!.width / 2 : arrow!.y + arrow!.height / 2;
            const triggerCenter = vertical ? button!.x + button!.width / 2 : button!.y + button!.height / 2;
            expect(arrowCenter).toBeCloseTo(triggerCenter, 0);
        }
    });

    test('flips to the other side when there is no room', async ({ page }) => {
        await mount(
            page,
            '<pttrn-tooltip label="Example label" placement="top"><button type="button">Trigger button</button></pttrn-tooltip>',
        );
        await trigger(page).hover();
        await expect(floating(page)).toHaveAttribute('data-placement', 'bottom');
    });

    test('hide-tail hides the arrow and halves the gap', async ({ page }) => {
        await mount(page, tooltip('label="Example label" hide-tail'));
        await trigger(page).hover();
        await expect(page.locator('pttrn-tooltip [data-arrow]')).toHaveCSS('opacity', '0');
        const [box, button] = await Promise.all([floating(page).boundingBox(), trigger(page).boundingBox()]);
        expect(button!.y - (box!.y + box!.height)).toBeCloseTo(4, 0);
    });

    test('a trigger with a name of its own is described by the tooltip instead', async ({ page }) => {
        for (const button of [
            '<button type="button">Save</button>',
            `<button aria-label="Save" type="button">${ICON}</button>`,
        ]) {
            await mount(page, tooltip('label="Saves your work"', button));
            await expect(trigger(page)).toHaveAccessibleName('Save');
            await expect(trigger(page)).toHaveAccessibleDescription('Saves your work');
            await expect(trigger(page)).not.toHaveAttribute('aria-labelledby');
        }
    });

    test('removes its wiring when the label is cleared, and restores it when set again', async ({ page }) => {
        await mount(page, PRESETS.Default);
        const element = page.locator('pttrn-tooltip');
        await element.evaluate((el) => el.setAttribute('label', ''));
        await expect(trigger(page)).not.toHaveAttribute('aria-labelledby');
        await expect(page.locator('[role="tooltip"]')).toHaveCount(0);
        await element.evaluate((el) => el.setAttribute('label', 'Back again'));
        await expect(trigger(page)).toHaveAccessibleName('Back again');
    });
});

describeBehaviors(spec, {
    'hidden-by-default': async ({ page }) => {
        await mount(page, PRESETS.Default);
        await expect(page.locator('[role="tooltip"]')).toHaveCount(1);
        await expect(floating(page)).toBeHidden();
        await expect(page.getByText('Example label')).toBeHidden();
    },
    'shows-on-hover': async ({ page }) => {
        await mount(page, PRESETS.Default);
        await trigger(page).hover();
        await expect(page.getByText('Example label')).toBeVisible();

        await page.mouse.move(0, 0);
        await expect(page.getByText('Example label')).toBeHidden();
    },
    'shows-on-focus': async ({ page }) => {
        await mount(page, PRESETS.Default);
        await page.keyboard.press('Tab');
        await expect(trigger(page)).toBeFocused();
        await expect(page.getByText('Example label')).toBeVisible();

        await page.keyboard.press('Tab');
        await expect(trigger(page)).not.toBeFocused();
        await expect(page.getByText('Example label')).toBeHidden();
    },
    'labels-trigger': async ({ page }) => {
        await mount(page, PRESETS.Default);
        const id = await page.locator('[role="tooltip"]').getAttribute('id');
        await expect(trigger(page)).toHaveAttribute('aria-labelledby', id!);
        await expect(trigger(page)).toHaveAccessibleName('Example label');
    },
    'no-label': async ({ page }) => {
        await mount(page, PRESETS['No Label']);
        await expect(page.locator('[role="tooltip"]')).toHaveCount(0);
        await expect(trigger(page)).not.toHaveAttribute('aria-labelledby');
        await expect(trigger(page)).toHaveAccessibleName('No Label');
        await trigger(page).hover();
        await expect(floating(page)).toBeHidden();
    },
    disabled: async ({ page }) => {
        await mount(page, tooltip('label="Example label" disabled'));
        await expect(page.locator('[role="tooltip"]')).toHaveCount(0);
        await expect(trigger(page)).not.toHaveAttribute('aria-labelledby');
        await trigger(page).hover();
        await expect(floating(page)).toBeHidden();
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            await trigger(page).hover();
            const results = await new AxeBuilder({ page }).include('pttrn-tooltip').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
