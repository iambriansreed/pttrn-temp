import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Popover/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const popover = (attributes = '') =>
    `<div style="padding: 200px 300px"><pttrn-popover header="Popover Header" content="This is a popover content" ${attributes}><button type="button">Toggle popover</button></pttrn-popover></div><p>Outside</p>`;

/** Mirrors the presets in `packages/react/src/components/Popover/PopoverExample.tsx`. */
const PRESETS = {
    Default: popover(),
    'With CallToAction': popover(
        'header="With CallToAction" content="With CallToAction body" action-label="CTA Button"',
    ),
    'With both CallToActions': popover(
        'header="With both CallToActions" content="With both CallToActions body" action-label="Primary" secondary-action-label="Secondary"',
    ),
};

const trigger = (page: Page) => page.getByRole('button', { name: 'Toggle popover' });
const panel = (page: Page) => page.locator('pttrn-popover [data-pttrn="popover"]');

/** Records `pttrn-action` events on the page. */
const recordActions = (page: Page) =>
    page.evaluate(() => {
        (window as unknown as { actions: string[] }).actions = [];
        document.addEventListener('pttrn-action', (event) =>
            (window as unknown as { actions: string[] }).actions.push((event as CustomEvent).detail.action),
        );
    });

test.describe('pttrn-popover', () => {
    test('Tab and Shift+Tab stay in the panel', async ({ page }) => {
        await mount(page, PRESETS['With both CallToActions']);
        await trigger(page).click();
        const close = page.getByRole('button', { name: 'Close' });
        await expect(panel(page)).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(close).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(page.getByRole('button', { name: 'Secondary' })).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(page.getByRole('button', { name: 'Primary' })).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(close).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(page.getByRole('button', { name: 'Primary' })).toBeFocused();
    });

    test('Escape and the close button return focus to the trigger', async ({ page }) => {
        await mount(page, PRESETS.Default);
        await trigger(page).click();
        await page.keyboard.press('Escape');
        await expect(panel(page)).toHaveCount(0);
        await expect(trigger(page)).toBeFocused();

        await trigger(page).click();
        await page.getByRole('button', { name: 'Close' }).click();
        await expect(panel(page)).toHaveCount(0);
        await expect(trigger(page)).toBeFocused();
    });

    test('sits 22px above the trigger, with the arrow aimed at it', async ({ page }) => {
        await mount(page, PRESETS.Default);
        await trigger(page).click();
        await expect(panel(page)).toHaveAttribute('data-placement', 'top');
        const [box, button, arrow] = await Promise.all([
            panel(page).boundingBox(),
            trigger(page).boundingBox(),
            page.locator('pttrn-popover [data-pttrn="popover"] > [data-arrow]').boundingBox(),
        ]);
        expect(button!.y - (box!.y + box!.height)).toBeCloseTo(22, 0);
        expect(arrow!.x + arrow!.width / 2).toBeCloseTo(button!.x + button!.width / 2, 0);
    });

    test('fires pttrn-toggle with the new state', async ({ page }) => {
        await mount(page, PRESETS.Default);
        const events = await page.evaluate(() => {
            const seen: boolean[] = [];
            document.addEventListener('pttrn-toggle', (e) => seen.push((e as CustomEvent).detail.open));
            const button = document.querySelector('pttrn-popover button') as HTMLButtonElement;
            button.click();
            button.click();
            return seen;
        });
        expect(events).toEqual([true, false]);
    });
});

describeBehaviors(spec, {
    'closed-by-default': async ({ page }) => {
        await mount(page, PRESETS.Default);
        await expect(trigger(page)).toBeVisible();
        await expect(panel(page)).toHaveCount(0);
        await expect(page.getByText('This is a popover content')).toBeHidden();
    },
    'toggle-on-click': async ({ page }) => {
        await mount(page, PRESETS.Default);
        await trigger(page).click();
        await expect(page.getByText('Popover Header', { exact: true })).toBeVisible();
        await expect(page.getByText('This is a popover content', { exact: true })).toBeVisible();
        await trigger(page).click();
        await expect(panel(page)).toHaveCount(0);
    },
    'close-button': async ({ page }) => {
        await mount(page, PRESETS.Default);
        await trigger(page).click();
        await page.getByRole('button', { name: 'Close' }).click();
        await expect(panel(page)).toHaveCount(0);
    },
    'outside-click-closes': async ({ page }) => {
        await mount(page, PRESETS.Default);
        await trigger(page).click();
        await expect(panel(page)).toBeVisible();
        await page.getByText('Outside').click();
        await expect(panel(page)).toHaveCount(0);
    },
    'describes-trigger': async ({ page }) => {
        await mount(page, PRESETS.Default);
        const id = await trigger(page).getAttribute('aria-describedby');
        expect(id).toBeTruthy();
        await trigger(page).click();
        await expect(page.locator(`#${id}`)).toHaveText('Popover Header This is a popover content');
        await expect(trigger(page)).toHaveAccessibleDescription(/Popover Header/);
    },
    'calls-to-action': async ({ page }) => {
        await mount(page, PRESETS['With both CallToActions']);
        await recordActions(page);
        await trigger(page).click();
        await page.getByRole('button', { name: 'Primary' }).click();
        await page.getByRole('button', { name: 'Secondary' }).click();
        expect(await page.evaluate(() => (window as unknown as { actions: string[] }).actions)).toEqual([
            'primary',
            'secondary',
        ]);
        await expect(panel(page)).toBeVisible();
    },
    disabled: async ({ page }) => {
        await mount(page, popover('disabled'));
        await expect(trigger(page)).not.toHaveAttribute('aria-describedby');
        await trigger(page).click();
        await expect(panel(page)).toHaveCount(0);
    },
    'focus-moves-in': async ({ page }) => {
        await mount(page, PRESETS.Default);
        await trigger(page).click();
        await expect(panel(page)).toBeFocused();
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            await trigger(page).click();
            await expect(panel(page)).toBeVisible();
            const results = await new AxeBuilder({ page }).include('pttrn-popover').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
