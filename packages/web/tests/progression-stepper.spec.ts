import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/ProgressionStepper/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

type Step = { name: string; subtext?: string };

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const stepper = (steps: Step[], attributes = '') =>
    `<pttrn-progression-stepper ${attributes}>${steps
        .map(
            ({ name, subtext }) =>
                `<pttrn-progression-stepper-item name="${escape(name)}"${subtext ? ` subtext="${escape(subtext)}"` : ''}></pttrn-progression-stepper-item>`,
        )
        .join('')}</pttrn-progression-stepper>`;

const STEPS: Step[] = [{ name: 'Account' }, { name: 'Address', subtext: 'Where we ship' }, { name: 'Review' }];

const names = (count: number, last: Step = { name: 'Review' }) => [
    ...Array.from({ length: count }, (_, index) => ({ name: `Name of step ${index + 1}` })),
    last,
];

/** Mirrors the presets in `packages/react/src/components/ProgressionStepper/ProgressionStepperExample.tsx`. */
const PRESETS = {
    Horizontal: stepper(
        [
            { name: 'Name of step 1' },
            { name: 'Name of step 2', subtext: 'Subtext of step 2' },
            { name: 'Name of step 3' },
        ],
        'variant="horizontal" completed-step="2"',
    ),
    Vertical: stepper(
        [1, 2, 3].map((n) => ({ name: `Name of step ${n}`, subtext: `Subtext of step ${n}` })),
        'variant="vertical" completed-step="2"',
    ),
    Widget: stepper(names(6), 'variant="widget" completed-step="3"'),
    'Widget (w/ subtext)': stepper(
        names(6, { name: 'Review', subtext: 'Whoop, there it is...' }),
        'variant="widget" completed-step="6"',
    ),
};

/** The stepper's container inside its shadow root. */
const container = (page: Page) => page.locator('pttrn-progression-stepper [data-pttrn="progression-stepper"]');
const item = (page: Page, step: number) => container(page).locator(`li[data-step="${step}"]`);
const circle = (page: Page, step: number) => item(page, step).locator('[data-circle]');
const statuses = (page: Page) =>
    container(page)
        .locator('li')
        .evaluateAll((items) => items.map((li) => li.getAttribute('data-status')));
const header = (page: Page, part: 'subtitle' | 'title') => container(page).locator(`[data-header] [data-${part}]`);
const setAttribute = (page: Page, name: string, value: string) =>
    page.locator('pttrn-progression-stepper').evaluate((el, [n, v]) => el.setAttribute(n, v), [name, value]);

test.describe('pttrn-progression-stepper', () => {
    test('renders the steps of every preset', async ({ page }) => {
        await mount(page, PRESETS.Horizontal);
        await expect(page.getByText('Name of step 1')).toBeVisible();
        await expect(page.getByText('Subtext of step 2')).toBeVisible();
    });

    test('redraws when a step is added, removed or renamed', async ({ page }) => {
        await mount(page, stepper(STEPS));
        await page.locator('pttrn-progression-stepper').evaluate((el) => {
            const extra = document.createElement('pttrn-progression-stepper-item');
            extra.setAttribute('name', 'Pay');
            el.append(extra);
        });
        await expect(page.getByRole('listitem')).toHaveCount(4);
        await expect(item(page, 4).locator('[data-name]')).toHaveText('Pay');

        await page
            .locator('pttrn-progression-stepper-item')
            .first()
            .evaluate((el) => el.remove());
        await expect(page.getByRole('listitem')).toHaveCount(3);
        await expect(item(page, 1).locator('[data-name]')).toHaveText('Address');

        // A property set from code redraws too, not only an attribute.
        await page
            .locator('pttrn-progression-stepper-item')
            .first()
            .evaluate((el) => ((el as HTMLElement & { name: string }).name = 'Shipping'));
        await expect(item(page, 1).locator('[data-name]')).toHaveText('Shipping');
    });

    test('items render nothing of their own', async ({ page }) => {
        await mount(page, stepper(STEPS));
        const box = await page.locator('pttrn-progression-stepper-item').first().boundingBox();
        expect(box).toBeNull();
    });

    test('follows completed-step set after mount', async ({ page }) => {
        await mount(page, stepper(STEPS));
        await setAttribute(page, 'completed-step', '2');
        await expect.poll(() => statuses(page)).toEqual(['complete', 'complete', 'current']);
    });
});

describeBehaviors(spec, {
    'renders-steps': async ({ page }) => {
        await mount(page, stepper(STEPS, 'completed-step="1"'));
        await expect(page.getByRole('list')).toHaveCount(1);
        expect(
            await container(page)
                .locator('ol')
                .evaluate((ol) => ol.tagName),
        ).toBe('OL');
        const items = page.getByRole('listitem');
        await expect(items).toHaveCount(3);
        expect(
            await container(page)
                .locator('li')
                .evaluateAll((li) => li.map((el) => el.dataset.step)),
        ).toEqual(['1', '2', '3']);
        await expect(item(page, 1).locator('[data-name]')).toHaveText('Account');
        await expect(item(page, 1).locator('[data-subtext]')).toHaveCount(0);
        await expect(item(page, 2).locator('[data-name]')).toHaveText('Address');
        await expect(item(page, 2).locator('[data-subtext]')).toHaveText('Where we ship');
        await expect(circle(page, 2)).toHaveText('2');
        await expect(circle(page, 3)).toHaveText('3');
    },
    'step-status': async ({ page }) => {
        await mount(page, stepper(STEPS));
        expect(await statuses(page)).toEqual(['current', 'incomplete', 'incomplete']);

        await setAttribute(page, 'completed-step', '1');
        await expect.poll(() => statuses(page)).toEqual(['complete', 'current', 'incomplete']);

        await setAttribute(page, 'completed-step', '2');
        await expect.poll(() => statuses(page)).toEqual(['complete', 'complete', 'current']);
    },
    'current-step': async ({ page }) => {
        await mount(page, stepper(STEPS, 'completed-step="1"'));
        await expect(item(page, 2)).toHaveAttribute('aria-current', 'step');
        await expect(container(page).locator('[aria-current]')).toHaveCount(1);

        await setAttribute(page, 'completed-step', '0');
        await expect(item(page, 1)).toHaveAttribute('aria-current', 'step');
        await expect(item(page, 2)).not.toHaveAttribute('aria-current');
    },
    'complete-check': async ({ page }) => {
        await mount(page, stepper(STEPS, 'completed-step="1"'));

        const check = circle(page, 1).locator('svg');
        await expect(check).toHaveAttribute('aria-hidden', 'true');
        await expect(check).toHaveAttribute('data-pttrn-name', 'Check');
        await expect(circle(page, 1)).toHaveText('');
        await expect(item(page, 1).locator('[data-sr-only]')).toHaveText(', completed');
        // The step reads as its name followed by "completed".
        expect((await item(page, 1).textContent())?.replace(/\s+/g, '')).toBe('Account,completed');
        await expect(circle(page, 2).locator('svg')).toHaveCount(0);
        await expect(circle(page, 2)).toHaveText('2');
        await expect(item(page, 2)).not.toContainText('completed');
    },
    clamps: async ({ page }) => {
        await mount(page, stepper(STEPS, 'completed-step="-4"'));
        expect(await statuses(page)).toEqual(['current', 'incomplete', 'incomplete']);

        await setAttribute(page, 'completed-step', '10');
        await expect.poll(() => statuses(page)).toEqual(['complete', 'complete', 'complete']);
        await expect(container(page).locator('[aria-current]')).toHaveCount(0);
    },
    'widget-header': async ({ page }) => {
        await mount(page, stepper(STEPS, 'completed-step="0" variant="widget"'));
        await expect(header(page, 'title')).toHaveText('Account');
        await expect(header(page, 'subtitle')).toHaveText('Step 1 of 3');

        await setAttribute(page, 'completed-step', '1');
        await expect(header(page, 'title')).toHaveText('Address');
        await expect(header(page, 'subtitle')).toHaveText('Where we ship');

        await setAttribute(page, 'completed-step', '3');
        await expect(header(page, 'title')).toHaveText('Review');
        await expect(header(page, 'subtitle')).toHaveText('Completed');

        await setAttribute(page, 'variant', 'horizontal');
        await expect(container(page).locator('[data-header]')).toHaveCount(0);
    },
    'widget-list': async ({ page }) => {
        await mount(page, stepper(STEPS, 'completed-step="1" variant="widget"'));

        await expect(page.getByRole('listitem')).toHaveCount(3);
        await expect(container(page).locator('[data-content]')).toHaveCount(0);
        await expect(container(page).locator('[data-name]')).toHaveCount(0);
        await expect(circle(page, 1).locator('svg')).toHaveAttribute('aria-hidden', 'true');
        await expect(circle(page, 2)).toHaveText('2');
        await expect(item(page, 2)).toHaveAttribute('aria-current', 'step');
        expect(await circle(page, 3).evaluate((el) => el.childElementCount + (el.textContent ?? '').length)).toBe(0);
        expect(
            await container(page)
                .locator('li')
                .evaluateAll((items) => items.map((li) => li.querySelector('[data-sr-only]')?.textContent)),
        ).toEqual(['Account, completed', 'Address', 'Review']);
    },
    variants: async ({ page }) => {
        await mount(page, stepper(STEPS));
        await expect(container(page)).toHaveAttribute('data-variant', 'horizontal');
        await expect(page.locator('pttrn-progression-stepper')).toHaveAttribute('variant', 'horizontal');

        for (const variant of ['vertical', 'widget']) {
            await setAttribute(page, 'variant', variant);
            await expect(container(page)).toHaveAttribute('data-variant', variant);
        }
    },
    empty: async ({ page }) => {
        await mount(page, '<pttrn-progression-stepper></pttrn-progression-stepper>');
        const rendered = await page
            .locator('pttrn-progression-stepper')
            .evaluate(
                (el) => el.shadowRoot!.querySelectorAll('*').length - el.shadowRoot!.querySelectorAll('style').length,
            );
        expect(rendered).toBe(0);
        await expect(page.getByRole('list')).toHaveCount(0);
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-progression-stepper').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
