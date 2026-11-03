import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Select/spec';
import { mount as mountQuirks } from './mount';
import { describeBehaviors } from './spec';

/** Standards mode: the list items are `height: 100%`, which a page with no doctype stretches to the viewport. */
const mount = (page: Page, html: string) => mountQuirks(page, `<!doctype html>${html}`);

type Option = { value: string; label: string; disabled?: boolean; subText?: string; trailing?: string };

const item = ({ value, label, disabled, subText, trailing }: Option) =>
    `<pttrn-select-item value="${value}" label="${label}"${disabled ? ' disabled' : ''}${
        subText ? ` sub-text="${subText}"` : ''
    }>${trailing ? `<span slot="trailing">${trailing}</span>` : ''}</pttrn-select-item>`;

const select = (attributes = '', options: Option[] = OPTIONS) =>
    `<div style="width: 320px"><pttrn-select aria-label="Letter" name="letter" placeholder="Pick one" ${attributes}>${options
        .map(item)
        .join('')}</pttrn-select></div><p>Outside</p>`;

const OPTIONS: Option[] = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta', disabled: true },
    { value: 'c', label: 'Gamma' },
];

/** Mirrors the presets in `packages/react/src/components/Select/SelectExample.tsx`. */
const PRESETS = {
    Simple: select(
        'name="demo-select"',
        Array.from({ length: 10 }, (_, index) => ({ value: `${index + 1}`, label: `Option ${index + 1}` })),
    ),
    SubText: select('menu-width="600px"', [
        { value: 'Claude 4 Sonnet', label: 'Claude 4 Sonnet', subText: 'bedrock • claude-sonnet-4' },
        { value: 'GPT 4.1', label: 'GPT 4.1', subText: 'azure • gpt-41' },
    ]),
    'Long text': select('', [
        { value: '1', label: 'This is a very long option that should truncate' },
        { value: '3', label: 'Short option' },
    ]),
    'Trailing Text': select('value="1"', [
        { value: '1', label: 'Option A', trailing: '$4.00' },
        { value: '2', label: 'Option B', trailing: '$10.00' },
    ]),
};

const control = (page: Page) => page.getByRole('combobox');
const listbox = (page: Page) => page.locator('pttrn-select [role="listbox"]');
const option = (page: Page, name: string) => page.getByRole('option', { name, exact: true });

/** Records `pttrn-change` values on the page. */
const recordChanges = (page: Page) =>
    page.evaluate(() => {
        (window as unknown as { changes: string[] }).changes = [];
        document.addEventListener('pttrn-change', (event) =>
            (window as unknown as { changes: string[] }).changes.push((event as CustomEvent).detail.value),
        );
    });
const changes = (page: Page) => page.evaluate(() => (window as unknown as { changes: string[] }).changes);

test.describe('pttrn-select', () => {
    test('the list is as wide as the control, under it, unless menu-width says otherwise', async ({ page }) => {
        await mount(page, select());
        await control(page).click();
        const [button, list] = await Promise.all([control(page).boundingBox(), listbox(page).boundingBox()]);
        expect(list!.width).toBeCloseTo(button!.width, 0);
        expect(list!.y).toBeCloseTo(button!.y + button!.height + 4, 0);

        await mount(page, PRESETS.SubText);
        await control(page).click();
        expect((await listbox(page).boundingBox())!.width).toBeCloseTo(600, 0);
    });

    test('shows the selected option’s trailing content in the control', async ({ page }) => {
        await mount(page, PRESETS['Trailing Text']);
        await expect(control(page)).toContainText('$4.00');
    });

    test('submits its name and value with a form, and resets with it', async ({ page }) => {
        await mount(page, `<form>${select('value="a"')}</form>`);
        const data = () =>
            page.evaluate(() => Object.fromEntries(new FormData(document.querySelector('form')!).entries()));
        expect(await data()).toEqual({ letter: 'a' });
        await control(page).click();
        await option(page, 'Gamma').click();
        expect(await data()).toEqual({ letter: 'c' });
        await page.evaluate(() => document.querySelector('form')!.reset());
        expect(await data()).toEqual({ letter: 'a' });
    });

    test('scroll-limit caps the list at that many options', async ({ page }) => {
        await mount(page, PRESETS.Simple.replace('name="demo-select"', 'name="demo-select" scroll-limit="5"'));
        await control(page).click();
        const [list, first] = await Promise.all([
            listbox(page).boundingBox(),
            page.getByRole('option').first().boundingBox(),
        ]);
        expect(list!.height).toBeCloseTo(first!.height * 5, 0);
    });

    test('Tab leaves the control and closes the list; Escape closes it too', async ({ page }) => {
        await mount(page, `${select()}<button type="button">After</button>`);
        await control(page).focus();
        await page.keyboard.press('Enter');
        await expect(control(page)).toHaveAttribute('aria-expanded', 'true');
        await page.keyboard.press('Escape');
        await expect(control(page)).toHaveAttribute('aria-expanded', 'false');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Tab');
        await expect(control(page)).toHaveAttribute('aria-expanded', 'false');
    });
});

describeBehaviors(spec, {
    'closed-by-default': async ({ page }) => {
        await mount(page, select());
        await expect(control(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(control(page)).not.toHaveAttribute('aria-controls');
        await expect(listbox(page)).toBeHidden();
    },
    'opens-on-click': async ({ page }) => {
        await mount(page, select());
        await control(page).click();
        await expect(control(page)).toHaveAttribute('aria-expanded', 'true');
        await expect(control(page)).toHaveAttribute('aria-controls', (await listbox(page).getAttribute('id'))!);
        await expect(listbox(page)).toBeVisible();
        await expect(page.getByRole('option')).toHaveCount(3);
    },
    'select-option': async ({ page }) => {
        await mount(page, select());
        await recordChanges(page);
        await control(page).click();
        await option(page, 'Gamma').click();
        expect(await changes(page)).toEqual(['c']);
        await expect(control(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(page.locator('pttrn-select')).toHaveJSProperty('value', 'c');
    },
    'shows-selection': async ({ page }) => {
        await mount(page, `<form>${select()}</form>`);
        await expect(control(page)).toContainText('Pick one');
        const value = () => page.evaluate(() => new FormData(document.querySelector('form')!).get('letter'));
        expect(await value()).toBeNull();
        await page.locator('pttrn-select').evaluate((el) => ((el as HTMLElement & { value: string }).value = 'c'));
        await expect(control(page)).toContainText('Gamma');
        expect(await value()).toBe('c');
    },
    keyboard: async ({ page }) => {
        await mount(page, select());
        await recordChanges(page);
        await page.keyboard.press('Tab');
        await expect(control(page)).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(control(page)).toHaveAttribute('aria-expanded', 'true');
        const id = (name: string) => option(page, name).getAttribute('id');
        await expect(control(page)).toHaveAttribute('aria-activedescendant', (await id('Alpha'))!);

        await page.keyboard.press('ArrowDown');
        // Beta is disabled, so the active option skips to Gamma.
        await expect(control(page)).toHaveAttribute('aria-activedescendant', (await id('Gamma'))!);
        await page.keyboard.press('ArrowUp');
        await expect(control(page)).toHaveAttribute('aria-activedescendant', (await id('Alpha'))!);

        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        expect(await changes(page)).toEqual(['c']);
        await expect(control(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(control(page)).toBeFocused();
    },
    'outside-click-closes': async ({ page }) => {
        await mount(page, select());
        await control(page).click();
        await expect(control(page)).toHaveAttribute('aria-expanded', 'true');
        await page.getByText('Outside').click();
        await expect(control(page)).toHaveAttribute('aria-expanded', 'false');
    },
    'disabled-readonly': async ({ page }) => {
        await mount(page, select('disabled'));
        await expect(control(page)).toHaveAttribute('aria-disabled', 'true');
        await control(page).click({ force: true });
        await expect(control(page)).toHaveAttribute('aria-expanded', 'false');

        await mount(page, select('readonly'));
        await expect(control(page)).toHaveAttribute('aria-readonly', 'true');
        await control(page).click({ force: true });
        await control(page).focus();
        await page.keyboard.press('Enter');
        await expect(control(page)).toHaveAttribute('aria-expanded', 'false');
    },
    'disabled-option': async ({ page }) => {
        await mount(page, select());
        await recordChanges(page);
        await control(page).click();
        await option(page, 'Beta').click({ force: true });
        expect(await changes(page)).toEqual([]);
    },
    labelled: async ({ page }) => {
        await mount(page, select());
        await expect(control(page)).toHaveAccessibleName('Letter Pick one');
        await page.locator('pttrn-select').evaluate((el) => ((el as HTMLElement & { value: string }).value = 'a'));
        await expect(control(page)).toHaveAccessibleName('Letter Alpha');
        await page.locator('pttrn-select').evaluate((el) => el.removeAttribute('aria-label'));
        await expect(control(page)).toHaveAccessibleName('Alpha');
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            let results = await new AxeBuilder({ page }).include('pttrn-select').analyze();
            expect(results.violations).toEqual([]);
            await control(page).click();
            await expect(listbox(page)).toBeVisible();
            results = await new AxeBuilder({ page }).include('pttrn-select').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
