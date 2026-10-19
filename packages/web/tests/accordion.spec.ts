import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { spec } from '../../react/src/components/Accordion/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const CONTENT = ['Content one', 'Content two', 'Content three'];

/** Three sections, with per-section attributes, so each test states only what it changes. */
const accordion = (attributes: string[] = [], root = '') =>
    `<ptrn-accordion ${root}>${CONTENT.map(
        (content, index) =>
            `<ptrn-accordion-item heading="Section ${index + 1}" ${attributes[index] ?? ''}><p>${content}</p></ptrn-accordion-item>`,
    ).join('')}</ptrn-accordion>`;

/** Mirrors the presets in `packages/react/src/components/Accordion/AccordionExample.tsx`. */
const PRESETS = {
    Default: `
        <ptrn-accordion>
            <ptrn-accordion-item heading="Section 1" subtitle="Subtitle"><p>${CONTENT[0]}</p></ptrn-accordion-item>
            <ptrn-accordion-item heading="Section 2">
                <span slot="leading">Lead</span>
                <p>${CONTENT[1]}</p>
                <span slot="trailing">Trailing</span>
            </ptrn-accordion-item>
            <ptrn-accordion-item heading="Section 3"><p>${CONTENT[2]}</p></ptrn-accordion-item>
        </ptrn-accordion>`,
    '1 disabled': accordion(['', 'disabled']),
    '1 disabled and open (but not showing)': accordion(['', 'disabled open']),
};

test.describe('ptrn-accordion', () => {
    test('renders its sections', async ({ page }) => {
        await mount(page, PRESETS.Default);
        await expect(page.getByRole('button', { name: 'Section 2' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Section 3' })).toBeVisible();
    });

    test('shows leading and trailing slot content and the subtitle', async ({ page }) => {
        await mount(page, PRESETS.Default);
        await expect(page.getByText('Subtitle')).toBeVisible();
        await expect(page.getByText('Lead')).toBeVisible();
        await expect(page.getByText('Trailing')).toBeVisible();
    });

    test('fires ptrn-toggle with the new state', async ({ page }) => {
        await mount(page, accordion());
        const events = await page.evaluate(async () => {
            const seen: boolean[] = [];
            document.addEventListener('ptrn-toggle', (e) => seen.push((e as CustomEvent).detail.open));
            const button = document.querySelector('ptrn-accordion-item')!.shadowRoot!.querySelector('button')!;
            button.click();
            button.click();
            return seen;
        });
        expect(events).toEqual([true, false]);
    });

    test('reflects open and disabled as attributes', async ({ page }) => {
        await mount(page, accordion());
        const item = page.locator('ptrn-accordion-item').first();
        await page.getByRole('button', { name: 'Section 1' }).click();
        await expect(item).toHaveAttribute('open', '');
        await item.evaluate((el) => ((el as HTMLElement & { disabled: boolean }).disabled = true));
        await expect(item).toHaveAttribute('disabled', '');
    });

    test('can be loaded twice without throwing', async ({ page }) => {
        await mount(page, accordion());
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.addScriptTag({ path: (await import('./mount')).BUNDLE, type: 'module' });
        await page.waitForTimeout(50);
        expect(errors).toEqual([]);
    });
});

describeBehaviors(spec, {
    'closed-by-default': async ({ page }) => {
        await mount(page, accordion());
        for (const n of [1, 2, 3]) {
            await expect(page.getByRole('button', { name: `Section ${n}` })).toHaveAttribute('aria-expanded', 'false');
        }
        for (const content of CONTENT) await expect(page.getByText(content)).toBeHidden();
    },
    'open-initially': async ({ page }) => {
        await mount(page, accordion(['', 'open']));
        await expect(page.getByRole('button', { name: 'Section 2' })).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByText(CONTENT[1])).toBeVisible();
        await expect(page.getByRole('button', { name: 'Section 1' })).toHaveAttribute('aria-expanded', 'false');
    },
    'toggle-on-click': async ({ page }) => {
        await mount(page, accordion());
        const header = page.getByRole('button', { name: 'Section 1' });

        await header.click();
        await expect(header).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByText(CONTENT[0])).toBeVisible();

        await header.click();
        await expect(header).toHaveAttribute('aria-expanded', 'false');
        await expect(page.getByText(CONTENT[0])).toBeHidden();
    },
    'single-open': async ({ page }) => {
        await mount(page, accordion());
        const one = page.getByRole('button', { name: 'Section 1' });
        const two = page.getByRole('button', { name: 'Section 2' });
        await one.click();
        await two.click();
        await expect(one).toHaveAttribute('aria-expanded', 'false');
        await expect(two).toHaveAttribute('aria-expanded', 'true');
    },
    'multiple-open': async ({ page }) => {
        await mount(page, accordion([], 'multiple'));
        const one = page.getByRole('button', { name: 'Section 1' });
        const two = page.getByRole('button', { name: 'Section 2' });
        await one.click();
        await two.click();
        await expect(one).toHaveAttribute('aria-expanded', 'true');
        await expect(two).toHaveAttribute('aria-expanded', 'true');

        await one.click();
        await expect(one).toHaveAttribute('aria-expanded', 'false');
        await expect(two).toHaveAttribute('aria-expanded', 'true');
    },
    disabled: async ({ page }) => {
        await mount(page, PRESETS['1 disabled']);
        const disabled = page.getByRole('button', { name: 'Section 2' });
        await expect(disabled).toBeDisabled();
        await disabled.click({ force: true });
        await expect(disabled).toHaveAttribute('aria-expanded', 'false');
        await expect(page.getByText(CONTENT[1])).toBeHidden();
    },
    'disabled-ignores-open': async ({ page }) => {
        await mount(page, PRESETS['1 disabled and open (but not showing)']);
        await expect(page.getByRole('button', { name: 'Section 2' })).toHaveAttribute('aria-expanded', 'false');
        await expect(page.getByText(CONTENT[1])).toBeHidden();
    },
    'keyboard-toggle': async ({ page }) => {
        await mount(page, accordion());
        const header = page.getByRole('button', { name: 'Section 1' });
        await page.keyboard.press('Tab');
        await expect(header).toBeFocused();

        await page.keyboard.press('Enter');
        await expect(header).toHaveAttribute('aria-expanded', 'true');
        await expect(header).toBeFocused();

        await page.keyboard.press('Space');
        await expect(header).toHaveAttribute('aria-expanded', 'false');
    },
    'aria-controls': async ({ page }) => {
        await mount(page, accordion());
        const header = page.getByRole('button', { name: 'Section 1' });
        await expect(header).toHaveAttribute('aria-expanded', 'false');
        await header.click();
        await expect(header).toHaveAttribute('aria-expanded', 'true');
        const relationship = await page.evaluate(() => {
            const item = document.querySelector('ptrn-accordion-item')!;
            const button = item.shadowRoot!.querySelector('button')!;
            const panel = item.shadowRoot!.getElementById(button.getAttribute('aria-controls')!);
            return { found: !!panel, isContent: panel?.hasAttribute('data-content') };
        });
        expect(relationship).toEqual({ found: true, isContent: true });
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            // Scoped to the component, like the React suite, so page-level rules (title, lang, landmarks) do not apply.
            const results = await new AxeBuilder({ page }).include('ptrn-accordion').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
