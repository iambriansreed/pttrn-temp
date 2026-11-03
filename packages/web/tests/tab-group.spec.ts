import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/TabGroup/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** An icon in the shape of the `@ptrn/icons` files: a viewBox and no size of its own. */
const svg = (shape: string) =>
    `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">${shape}</svg>`;
const ICONS = {
    diamond: svg('<path d="M8 1l7 7-7 7-7-7z" fill="none" stroke="currentColor" />'),
    diamondFill: svg('<path d="M8 1l7 7-7 7-7-7z" />'),
    circle: svg('<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" />'),
    square: svg('<rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" />'),
    squareFill: svg('<rect x="2" y="2" width="12" height="12" />'),
};
const slotted = (icon: string, slot: string) => icon.replace('<svg', `<svg slot="${slot}"`);

type Option = {
    value: string;
    label: string;
    disabled?: boolean;
    badge?: number;
    icon?: string;
    iconSelected?: string;
};

const group = (options: Option[], attributes = 'label="Sections" value="1"') =>
    `<pttrn-tab-group ${attributes}>${options
        .map(
            ({ value, label, disabled, badge, icon, iconSelected }) =>
                `<pttrn-tab-group-item value="${value}" label="${label}"${disabled ? ' disabled' : ''}${
                    badge ? ` badge="${badge}"` : ''
                }>${icon ? slotted(icon, 'icon') : ''}${
                    iconSelected ? slotted(iconSelected, 'icon-selected') : ''
                }</pttrn-tab-group-item>`,
        )
        .join('')}</pttrn-tab-group>`;

const OPTIONS: Option[] = [
    { value: '1', label: 'First' },
    { value: '2', label: 'Second', disabled: true },
    { value: '3', label: 'Third' },
];

/** Mirrors the presets in `packages/react/src/components/TabGroup/TabGroupExample.tsx`. */
const PRESET_OPTIONS: Option[] = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Disabled 2', disabled: true },
    { value: '3', label: 'Option 3' },
];
const ICON_SETS = [
    { icon: ICONS.diamond, iconSelected: ICONS.diamondFill },
    { icon: ICONS.circle },
    { icon: ICONS.square, iconSelected: ICONS.squareFill },
];
const withIcons = (options: Option[]) => options.map((option, index) => ({ ...option, ...ICON_SETS[index] }));
const withBadges = (options: Option[]) =>
    options.map((option, index) => ({ ...option, badge: Math.round((index + 1) * 2.6) }));
const PRESETS = {
    Default: group(PRESET_OPTIONS, 'label="Default"'),
    'With icons': group(withIcons(PRESET_OPTIONS), 'label="Tabs with icons" value="1"'),
    'With badges': group(withBadges(PRESET_OPTIONS), 'label="Tabs with badges" value="1"'),
    'With icons & badges': group(
        withBadges(withIcons(PRESET_OPTIONS)),
        'label="Tabs with icons &amp; badges" value="1"',
    ),
    'Long Text only': group(
        PRESET_OPTIONS.map((option) => ({
            ...option,
            label: `${option.label} with a very long label that never seems to end and goes on forever`,
        })),
        'label="Tabs with long text" value="1"',
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

test.describe('pttrn-tab-group', () => {
    test('underlines the selected tab, inside its padding', async ({ page }) => {
        await mount(page, group(OPTIONS));
        const box = await tab(page, 'First').boundingBox();
        const line = await tab(page, 'First').evaluate((el) => {
            const after = getComputedStyle(el.shadowRoot!.querySelector('[data-tab]')!, '::after');
            return { width: after.width, height: after.height, color: after.backgroundColor };
        });
        expect(line.height).toBe('2px');
        expect(parseFloat(line.width)).toBeCloseTo(box!.width - 32, 0);
    });

    test('show-trail draws the line across the full width', async ({ page }) => {
        await mount(page, `<div style="width: 600px">${group(OPTIONS, 'label="Sections" show-trail')}</div>`);
        const list = page.getByRole('tablist');
        expect((await list.boundingBox())!.width).toBe(600);
        await expect(list).toHaveCSS('border-bottom-width', '1px');
        await expect(tab(page, 'First')).toHaveCSS('border-bottom-width', '0px');
    });

    test('keeps its sizes under a page reset, which reaches the item hosts', async ({ page }) => {
        await mount(page, PRESETS['With icons & badges']);
        const widths = () =>
            page.getByRole('tab').evaluateAll((tabs) => tabs.map((t) => t.getBoundingClientRect().width));
        const before = await widths();
        await page.addStyleTag({ content: '* { margin: 0; padding: 0; box-sizing: border-box; }' });
        expect(await widths()).toEqual(before);
    });

    test('a large tab gets the small badge', async ({ page }) => {
        await mount(page, group(withBadges(OPTIONS), 'label="Sections" size="large"'));
        const badge = page.locator('pttrn-tab-group-item').first().locator('[data-badge]');
        await expect(badge).toHaveCSS('height', '24px');
    });

    test('updates value on click and fires pttrn-change once per change', async ({ page }) => {
        await mount(page, group(OPTIONS));
        await recordChanges(page);
        await tab(page, 'Third').click();
        await tab(page, 'Third').click();
        await expect(page.locator('pttrn-tab-group')).toHaveAttribute('value', '3');
        expect(await changes(page)).toEqual(['3']);
    });
});

describeBehaviors(spec, {
    'renders-tabs': async ({ page }) => {
        await mount(page, group(OPTIONS));
        await expect(page.getByRole('tablist', { name: 'Sections' })).toBeVisible();
        await expect(page.getByRole('tab')).toHaveCount(3);
    },
    'selected-tab': async ({ page }) => {
        await mount(page, group(OPTIONS, 'label="Sections" value="3"'));
        await expect(tab(page, 'Third')).toHaveAttribute('aria-selected', 'true');
        await expect(tab(page, 'First')).toHaveAttribute('aria-selected', 'false');
    },
    'click-selects': async ({ page }) => {
        await mount(page, group(OPTIONS));
        await recordChanges(page);
        await tab(page, 'Third').click();
        expect(await changes(page)).toEqual(['3']);
    },
    'disabled-tab': async ({ page }) => {
        await mount(page, group(OPTIONS));
        await recordChanges(page);
        await expect(tab(page, 'Second')).toHaveAttribute('aria-disabled', 'true');
        await tab(page, 'Second').click({ force: true });
        expect(await changes(page)).toEqual([]);
        await expect(tab(page, 'First')).toHaveAttribute('aria-selected', 'true');
    },
    'arrow-keys': async ({ page }) => {
        await mount(page, group(OPTIONS));
        await page.keyboard.press('Tab');
        await expect(tab(page, 'First')).toBeFocused();
        await expect(tab(page, 'First')).toHaveAttribute('tabindex', '0');
        await expect(tab(page, 'Third')).toHaveAttribute('tabindex', '-1');

        await page.keyboard.press('ArrowRight');
        await expect(tab(page, 'Third')).toBeFocused();
        await expect(tab(page, 'Third')).toHaveAttribute('data-active', '');
        await expect(tab(page, 'Third')).toHaveAttribute('tabindex', '0');

        await page.keyboard.press('ArrowRight');
        await expect(tab(page, 'First')).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await expect(tab(page, 'Third')).toBeFocused();
    },
    'enter-space-select': async ({ page }) => {
        await mount(page, group(OPTIONS));
        await recordChanges(page);
        await page.keyboard.press('Tab');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        expect(await changes(page)).toEqual(['3']);
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('Space');
        expect(await changes(page)).toEqual(['3', '1']);
    },
    'needs-two': async ({ page }) => {
        await mount(page, group([OPTIONS[0]]));
        await expect(page.getByRole('tablist')).toHaveCount(0);
        await expect(page.getByRole('tab')).toHaveCount(0);
    },
    badge: async ({ page }) => {
        await mount(page, group([{ ...OPTIONS[0], badge: 4 }, OPTIONS[2]]));
        const first = page.getByRole('tab', { name: /First/ });
        await expect(first).toHaveAccessibleName(/^First\s?4$/);
        await expect(first.locator('[data-badge]')).toHaveText('4');
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-tab-group').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
