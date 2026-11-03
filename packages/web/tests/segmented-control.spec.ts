import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/SegmentedControl/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** An icon in the shape of the `@ptrn/icons` files: a viewBox and no size of its own. */
const svg = (shape: string) =>
    `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">${shape}</svg>`;
const slotted = (icon: string, slot: string) => icon.replace('<svg', `<svg slot="${slot}"`);
const ICONS = {
    diamond: svg('<path d="M8 1l7 7-7 7-7-7z" fill="none" stroke="currentColor" />'),
    diamondFill: svg('<path d="M8 1l7 7-7 7-7-7z" />'),
    circle: svg('<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" />'),
    square: svg('<rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" />'),
    squareFill: svg('<rect x="2" y="2" width="12" height="12" />'),
};

type Option = { value: string; label: string; disabled?: boolean; icon?: string; iconSelected?: string };

const control = (options: Option[], attributes = 'label="View" value="list"') =>
    `<pttrn-segmented-control ${attributes}>${options
        .map(
            ({ value, label, disabled, icon, iconSelected }) =>
                `<pttrn-segmented-control-item value="${value}" label="${label}"${disabled ? ' disabled' : ''}>${
                    icon ? slotted(icon, 'icon') : ''
                }${iconSelected ? slotted(iconSelected, 'icon-selected') : ''}</pttrn-segmented-control-item>`,
        )
        .join('')}</pttrn-segmented-control>`;

const OPTIONS: Option[] = [
    { value: 'list', label: 'List' },
    { value: 'grid', label: 'Grid' },
    { value: 'map', label: 'Map' },
];
const WITH_ICONS = OPTIONS.map((option) => ({ ...option, icon: ICONS.circle }));

/** Mirrors the presets in `packages/react/src/components/SegmentedControl/SegmentedControlExample.tsx`. */
const PRESET_OPTIONS: Option[] = [
    { value: '1', label: 'Option 1', icon: ICONS.diamond, iconSelected: ICONS.diamondFill },
    { value: '2', label: 'Disabled 2', disabled: true, icon: ICONS.circle },
    { value: '3', label: 'Option 3', icon: ICONS.square, iconSelected: ICONS.squareFill },
];
const PRESETS = {
    Default: control(
        PRESET_OPTIONS.map(({ value, label, disabled }) => ({ value, label, disabled })),
        'label="Default"',
    ),
    'With icons': control(PRESET_OPTIONS, 'label="With icons" value="1"'),
    'Icons only': control(PRESET_OPTIONS, 'label="Icons only" value="1" icons-only'),
    'Long label text': control(
        PRESET_OPTIONS.map((option) => ({
            ...option,
            label: `${option.label} with a very long label text that should be truncated if it exceeds the width of the control`,
        })),
        'label="Long label text" value="1"',
    ),
};

const tab = (page: Page, name: string) => page.getByRole('tab', { name, exact: true });

/** Records `pttrn-change` values on the page. */
const recordChanges = (page: Page) =>
    page.evaluate(() => {
        (window as unknown as { changes: string[] }).changes = [];
        document.addEventListener('pttrn-change', (event) =>
            (window as unknown as { changes: string[] }).changes.push((event as CustomEvent).detail.value),
        );
    });
const changes = (page: Page) => page.evaluate(() => (window as unknown as { changes: string[] }).changes);

test.describe('pttrn-segmented-control', () => {
    test('shows the selected icon on the selected segment and the plain icon on the others', async ({ page }) => {
        await mount(page, PRESETS['With icons']);
        const visibleIcons = await page.evaluate(() =>
            [...document.querySelectorAll('pttrn-segmented-control-item')].map((item) =>
                [...item.shadowRoot!.querySelectorAll('[data-icon]')].map((span) => !span.hasAttribute('hidden')),
            ),
        );
        expect(visibleIcons).toEqual([
            [false, true],
            [true, false],
            [true, false],
        ]);
    });

    test('updates value and the selection on click, and ignores disabled segments', async ({ page }) => {
        await mount(page, PRESETS['With icons']);
        await recordChanges(page);
        await tab(page, 'Disabled 2').click({ force: true });
        await expect(tab(page, 'Option 1')).toHaveAttribute('aria-selected', 'true');
        await expect(tab(page, 'Disabled 2')).toHaveAttribute('aria-disabled', 'true');
        await tab(page, 'Option 3').click();
        await expect(page.locator('pttrn-segmented-control')).toHaveAttribute('value', '3');
        await expect(tab(page, 'Option 3')).toHaveAttribute('aria-selected', 'true');
        expect(await changes(page)).toEqual(['3']);
    });

    test('an icon-only segment shows its label as a tooltip on hover', async ({ page }) => {
        await mount(page, PRESETS['Icons only']);
        await tab(page, 'Option 3').hover();
        await expect(
            page.locator('pttrn-segmented-control-item').nth(2).locator('[data-pttrn="tooltip"]'),
        ).toBeVisible();
        await expect(page.getByText('Option 3', { exact: true }).last()).toBeVisible();
    });

    test('icons-only is ignored unless every segment has an icon', async ({ page }) => {
        await mount(page, control([{ ...OPTIONS[0], icon: ICONS.circle }, OPTIONS[1]], 'label="View" icons-only'));
        await expect(page.locator('pttrn-segmented-control-item[data-icons-only]')).toHaveCount(0);
        await expect(page.getByText('List')).toBeVisible();
    });

    test('keeps its sizes under a page reset, which reaches the item hosts', async ({ page }) => {
        await mount(page, PRESETS['With icons']);
        const before = await page
            .getByRole('tab')
            .evaluateAll((tabs) => tabs.map((t) => t.getBoundingClientRect().width));
        await page.addStyleTag({ content: '* { margin: 0; padding: 0; box-sizing: border-box; }' });
        const after = await page
            .getByRole('tab')
            .evaluateAll((tabs) => tabs.map((t) => t.getBoundingClientRect().width));
        expect(after).toEqual(before);
        // 16px padding each side, a 20px icon, an 8px gap and the label.
        const icon = await page.locator('pttrn-segmented-control-item svg[slot="icon-selected"]').first().boundingBox();
        expect(icon!.width).toBe(20);
    });

    test('fill stretches the control and its segments', async ({ page }) => {
        await mount(page, `<div style="width: 600px">${control(OPTIONS, 'label="View" width="fill"')}</div>`);
        const box = await page.getByRole('tablist').boundingBox();
        expect(box!.width).toBe(600);
    });
});

describeBehaviors(spec, {
    'renders-segments': async ({ page }) => {
        await mount(page, control(OPTIONS));
        await expect(page.getByRole('tablist', { name: 'View' })).toBeVisible();
        await expect(page.getByRole('tab')).toHaveCount(3);
    },
    'selected-segment': async ({ page }) => {
        await mount(page, control(OPTIONS, 'label="View" value="grid"'));
        await expect(tab(page, 'Grid')).toHaveAttribute('aria-selected', 'true');
        await expect(tab(page, 'List')).toHaveAttribute('aria-selected', 'false');
    },
    'click-selects': async ({ page }) => {
        await mount(page, control(OPTIONS));
        await recordChanges(page);
        await tab(page, 'Map').click();
        expect(await changes(page)).toEqual(['map']);
    },
    'icons-only': async ({ page }) => {
        await mount(page, control(WITH_ICONS, 'label="View" value="list" icons-only'));
        await expect(page.locator('pttrn-segmented-control-item').first().locator('[data-label]')).toHaveCount(0);
        await expect(tab(page, 'Grid')).toBeVisible();
        await expect(tab(page, 'Grid')).toHaveAccessibleName('Grid');
        const iconWrapper = page.locator('pttrn-segmented-control-item').first().locator('[data-icon]').first();
        await expect(iconWrapper).toHaveAttribute('aria-hidden', 'true');
    },
    'arrow-keys': async ({ page }) => {
        await mount(page, control(OPTIONS));
        await recordChanges(page);
        await page.keyboard.press('Tab');
        await expect(tab(page, 'List')).toBeFocused();
        await page.keyboard.press('ArrowRight');
        await expect(tab(page, 'Grid')).toBeFocused();
        await expect(tab(page, 'Grid')).toHaveAttribute('tabindex', '0');
        await expect(tab(page, 'List')).toHaveAttribute('tabindex', '-1');
        await page.keyboard.press('Enter');
        expect(await changes(page)).toEqual(['grid']);
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        await expect(tab(page, 'Map')).toBeFocused();
        await page.keyboard.press('Space');
        expect(await changes(page)).toEqual(['grid', 'map']);
    },
    'axe-clean': async ({ page }) => {
        for (const html of [
            ...Object.values(PRESETS),
            control(OPTIONS),
            control(WITH_ICONS, 'label="View" icons-only'),
        ]) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-segmented-control').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
