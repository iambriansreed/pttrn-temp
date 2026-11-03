import { test, expect, Page } from '@playwright/test';

import { gotoUrl } from './utils';

/**
 * The site search finds every kind of thing the site documents: components, types and hooks from the component
 * metadata, markdown pages by heading, design tokens from `@ptrn/styles/tokens` and icons from `@ptrn/icons`. Results
 * are grouped by kind, the field is a combobox whose highlighted option is `aria-activedescendant`, Up and Down move
 * the highlight, and Enter opens the highlighted result.
 */

async function search(page: Page, query: string) {
    await gotoUrl(page, '/get-started');
    await page.locator('[data-search-button]').click();
    const field = page.getByRole('combobox', { name: 'Search' });
    await field.fill(query);
    await expect(page.locator('[data-search-status]')).toHaveText(/^\d+ results?$/);
    return field;
}

/** The id of the highlighted option, and that option. */
async function highlighted(page: Page) {
    const id = await page.getByRole('combobox', { name: 'Search' }).getAttribute('aria-activedescendant');
    expect(id, 'an option is highlighted').toBeTruthy();
    return page.locator(`[id="${id}"]`);
}

/** The result groups, in the order they are shown. */
async function groupKinds(page: Page) {
    return page.locator('[data-search-group]').evaluateAll((groups) => groups.map((g) => g.dataset.searchGroup));
}

test('a markdown heading is found, and Enter opens the page at that heading', async ({ page }) => {
    const field = await search(page, 'deprecation policy');

    const pages = page.getByRole('group', { name: /^Pages/ });
    await expect(pages.getByRole('option').first()).toContainText('Deprecation policy');
    await expect(pages.getByRole('option').first()).toContainText('Governance');
    await expect(await highlighted(page)).toContainText('Deprecation policy');

    await field.press('Enter');

    await expect(page).toHaveURL(/\/governance#deprecation-policy$/);
    await expect(page.getByRole('heading', { name: 'Deprecation policy' })).toBeInViewport();
});

test('a design token is found, and Enter opens it in the token catalog', async ({ page }) => {
    const field = await search(page, '--theme-color-ink');

    expect((await groupKinds(page))[0], 'the exact token comes before pages that mention it').toBe('token');
    const tokens = page.getByRole('group', { name: /^Design tokens/ });
    await expect(tokens.getByRole('option').first()).toContainText('--theme-color-ink');
    await expect(await highlighted(page)).toContainText('--theme-color-ink');

    await field.press('Enter');

    await expect(page).toHaveURL(/\/tokens\?token=--theme-color-ink#token-catalog$/);
    await expect(page.getByRole('textbox', { name: 'Search tokens' })).toHaveValue('--theme-color-ink');
    const catalog = page.getByRole('table', { name: 'Design tokens' });
    await expect(catalog.getByRole('row').nth(1)).toContainText('--theme-color-ink');
});

test('an icon is found by its search terms, and Enter opens it on the icons page', async ({ page }) => {
    const field = await search(page, 'wheelchair');

    const icons = page.getByRole('group', { name: /^Icons/ });
    const target = icons.getByRole('option', { name: /^Accessible material\b/ });
    await expect(target).toHaveCount(1);

    // Move the highlight to that icon, then open it.
    const targetId = await target.getAttribute('id');
    for (let step = 0; step < 50 && (await field.getAttribute('aria-activedescendant')) !== targetId; step++) {
        await field.press('ArrowDown');
    }
    await expect(field).toHaveAttribute('aria-activedescendant', targetId!);
    await expect(target).toHaveAttribute('aria-selected', 'true');

    await field.press('Enter');

    await expect(page).toHaveURL(/\/icons\?icon=Accessible$/);
    await expect(page.getByRole('dialog').locator('[data-selected-icon] [data-title]')).toHaveText('Accessible');
});

test('Up and Down move the highlight and Enter opens the highlighted result', async ({ page }) => {
    const field = await search(page, 'button');

    const options = page.getByRole('option');
    const first = await options.nth(0).getAttribute('id');
    const second = await options.nth(1).getAttribute('id');
    await expect(options.nth(0)).toContainText('Button');
    await expect(field).toHaveAttribute('aria-activedescendant', first!);

    // Left and Right move the caret in the field, not the highlight.
    await field.press('ArrowRight');
    await expect(field).toHaveAttribute('aria-activedescendant', first!);

    await field.press('ArrowDown');
    await expect(field).toHaveAttribute('aria-activedescendant', second!);
    await field.press('ArrowUp');
    await expect(field).toHaveAttribute('aria-activedescendant', first!);
    await field.press('ArrowDown');

    const name = (await options.nth(1).locator('[data-search-result-name]').textContent())!;
    expect(name).toBe('ButtonDock');

    await field.press('Enter');

    await expect(page).toHaveURL(/\/button-dock$/);
});
