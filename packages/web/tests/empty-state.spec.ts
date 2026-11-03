import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/EmptyState/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const subject = (attributes = '', children = '') =>
    `<pttrn-empty-state body="Try changing your search." header="No results" ${attributes}>${children}</pttrn-empty-state>`;

/** Mirrors the presets in `packages/react/src/components/EmptyState/EmptyStateExample.tsx`. */
const PRESETS = {
    'With CallToAction':
        '<pttrn-empty-state action-label="Add payment method" body="Example body" header="Example header"></pttrn-empty-state>',
    'With Custom Content': `<pttrn-empty-state body="No results found" header="We couldn’t find any matching results. Try changing your search.">
            <div style="height: 200px; width: 200px">Illustration slot or icon slot</div>
        </pttrn-empty-state>`,
};

const text = (page: Page) => page.locator('pttrn-empty-state [data-text]');

describeBehaviors(spec, {
    'renders-text': async ({ page }) => {
        await mount(page, subject());
        await expect(page.getByText('No results')).toBeVisible();
        await expect(page.getByText('Try changing your search.')).toBeVisible();
        // Styled as a heading, not a heading element.
        await expect(page.getByRole('heading')).toHaveCount(0);
    },
    illustration: async ({ page }) => {
        await mount(
            page,
            subject('', '<img alt="" data-testid="art" src="data:," style="width: 40px; height: 40px" />'),
        );
        const [art, header] = await Promise.all([
            page.getByTestId('art').boundingBox(),
            page.getByText('No results').boundingBox(),
        ]);
        expect(art!.y + art!.height).toBeLessThanOrEqual(header!.y);
        // The 16 px gap of the column.
        expect(header!.y - (art!.y + art!.height)).toBe(16);
    },
    'call-to-action': async ({ page }) => {
        await mount(page, subject('action-label="Add item"'));
        const actions = await page.evaluateHandle(() => {
            const seen = { count: 0 };
            document.addEventListener('pttrn-action', () => seen.count++);
            return seen;
        });
        const button = page.getByRole('button', { name: 'Add item' });
        await expect(button).toHaveAttribute('data-variant', 'primary');
        await expect(button).toHaveAttribute('data-size', 'medium');
        await button.click();
        expect(await actions.evaluate((seen) => seen.count)).toBe(1);

        await mount(page, subject('action-label="Add item" action-size="small"'));
        await expect(page.getByRole('button', { name: 'Add item' })).toHaveAttribute('data-size', 'small');
    },
    'no-call-to-action': async ({ page }) => {
        await mount(page, subject());
        await expect(page.getByRole('button')).toHaveCount(0);
    },
    'body-align': async ({ page }) => {
        await mount(page, subject());
        await expect(text(page)).toHaveCSS('text-align', 'center');
        await expect(text(page)).toHaveCSS('align-items', 'center');

        await mount(page, subject('body-align="left"'));
        await expect(text(page)).toHaveCSS('text-align', 'left');
        await expect(text(page)).toHaveCSS('align-items', 'flex-start');
    },
    'axe-clean': async ({ page }) => {
        for (const html of [...Object.values(PRESETS), subject('action-label="Add item"')]) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-empty-state').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});

test.describe('pttrn-empty-state', () => {
    test('leaves out an empty header or body, as Txt renders nothing for them', async ({ page }) => {
        await mount(page, '<pttrn-empty-state body="Only a body"></pttrn-empty-state>');
        await expect(page.locator('pttrn-empty-state [data-header]')).toHaveCount(0);
        await expect(page.getByText('Only a body')).toBeVisible();
    });
});
