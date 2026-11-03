import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Table/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

type Column = { key: string; label: string; sort?: string; width?: string; align?: string; valign?: string };
type Row = Record<string, string | number>;

// Alaska first, so that no sort order equals the order the rows arrive in.
const STATES: Row[] = [
    { state: 'Alaska', capital: 'Juneau', population: 32756 },
    { state: 'Vermont', capital: 'Montpelier', population: 7919 },
    { state: 'Alabama', capital: 'Montgomery', population: 198525 },
];
const COLUMNS: Column[] = [
    { key: 'state', label: 'State', width: '160px', sort: 'string' },
    { key: 'capital', label: 'Capital' },
    { key: 'population', label: 'Population', align: 'right', sort: 'number' },
];
/** Rows "State 1" to "State n", for paging. */
const many = (n: number): Row[] =>
    Array.from({ length: n }, (_, i) => ({ state: `State ${i + 1}`, capital: `Capital ${i + 1}`, population: i }));

/** The table as a Web Component user writes it: a plain `<table>` child, column options on each `th`. */
const table = ({
    columns = COLUMNS,
    rows = STATES,
    caption = 'State Capitals',
    attributes = '',
}: { columns?: Column[]; rows?: Row[]; caption?: string; attributes?: string } = {}) => {
    const th = columns
        .map(({ key, label, sort, width, align, valign }) => {
            const data = Object.entries({ key, sort, width, align, valign })
                .filter(([, value]) => value)
                .map(([name, value]) => ` data-${name}="${value}"`)
                .join('');
            return `<th${data}>${label}</th>`;
        })
        .join('');
    const tr = rows
        .map((row) => `<tr>${columns.map(({ key }) => `<td>${row[key] ?? ''}</td>`).join('')}</tr>`)
        .join('');
    return `<pttrn-table ${attributes}><table>${caption ? `<caption>${caption}</caption>` : ''}<thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></pttrn-table>`;
};

const PHASES = ['Stable', 'Stable', 'Dev', 'Stable', 'Backlog', 'Stable'];
/** Mirrors `packages/react/src/components/Table/TableExample.tsx`: the Usage example and the "Large dataset" preset. */
const PRESETS = {
    Usage: table({
        caption: 'States',
        columns: [
            { key: 'state', label: 'State', sort: 'string' },
            { key: 'capital', label: 'Capital', sort: 'string' },
            { key: 'abbreviation', label: 'Abbrev', align: 'center' },
            { key: 'population', label: 'Population', align: 'right', sort: 'number' },
        ],
        rows: Array.from({ length: 50 }, (_, i) => ({
            state: `State ${i + 1}`,
            capital: `Capital ${i + 1}`,
            abbreviation: `S${i}`,
            population: i * 1000,
        })),
        attributes: 'page-size="5"',
    }),
    'Large dataset': table({
        caption: 'Components',
        columns: [
            { key: 'name', label: 'Name', sort: 'string' },
            { key: 'phase', label: 'Phase', align: 'center', sort: 'string' },
            { key: 'cssLines', label: 'CSS Lines', sort: 'number', align: 'right' },
            { key: 'dependencies', label: 'Dependencies' },
            { key: 'description', label: 'Description', width: 'auto' },
        ],
        rows: PHASES.map((phase, i) => ({
            name: `Component ${i + 1}`,
            phase,
            cssLines: i * 10,
            dependencies: i % 2 ? 'Tooltip' : '',
            description: `Component ${i + 1} does a thing.`,
        })),
        attributes: 'page-size="5"',
    }),
    'Page buttons': table({ rows: many(12), attributes: 'page-size="5"' }),
};

const root = (page: Page) => page.locator('pttrn-table [data-pttrn="table"]');
const header = (page: Page, name: string) => page.getByRole('columnheader', { name });
const sortButton = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
/** The text of one column, top to bottom. */
const column = (page: Page, key: string) =>
    page
        .locator(`pttrn-table td[data-cell="${key}"]`)
        .evaluateAll((cells) => cells.map((cell) => cell.textContent?.trim()));
const liveRegion = (page: Page) => page.locator('pttrn-table [aria-live]');

/** Gives the table its data from script, the way the React props do. */
async function setData(page: Page, script: string) {
    await page.evaluate(`(() => { const table = document.querySelector('pttrn-table'); ${script} })()`);
    await page
        .locator('pttrn-table')
        .evaluate((el) => (el as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete);
}

test.describe('pttrn-table', () => {
    test('hides the child table it reads and draws its own', async ({ page }) => {
        await mount(page, table());
        await expect(page.getByRole('table')).toHaveCount(1);
        expect(await page.locator('pttrn-table > table').boundingBox()).toBeNull();
    });

    test('redraws when the child table changes', async ({ page }) => {
        await mount(page, table());
        await page
            .locator('pttrn-table > table td')
            .first()
            .evaluate((td) => (td.textContent = 'Arkansas'));
        await expect.poll(() => column(page, 'state')).toEqual(['Arkansas', 'Vermont', 'Alabama']);
    });

    test('sorts by data-sort-value when a cell has one', async ({ page }) => {
        await mount(page, table());
        await page
            .locator('pttrn-table > table td')
            .evaluateAll((cells) =>
                cells
                    .filter((_, index) => index % 3 === 2)
                    .forEach((cell, index) => cell.setAttribute('data-sort-value', ['3', '1', '2'][index])),
            );
        await sortButton(page, 'Population').click();
        await expect.poll(() => column(page, 'state')).toEqual(['Vermont', 'Alabama', 'Alaska']);
    });

    test('takes the caption attribute over the child caption', async ({ page }) => {
        await mount(page, table({ attributes: 'caption="Capitals"' }));
        await expect(page.getByRole('table', { name: 'Capitals' })).toBeVisible();
    });

    test('a page number past the last page goes to the last page', async ({ page }) => {
        await mount(page, PRESETS.Usage);
        const field = page.getByRole('spinbutton', { name: 'Page number' });
        await field.fill('99');
        await field.press('Enter');
        await expect(page.getByText('Showing 46-50 of 50 results')).toBeVisible();
        await expect(field).toHaveValue('10');
        await expect(liveRegion(page)).toHaveText('Page 10 of 10');

        await field.fill('');
        await field.blur();
        await expect(field).toHaveValue('10');
    });
});

describeBehaviors(spec, {
    'renders-table': async ({ page }) => {
        await mount(page, table());

        await expect(page.getByRole('table', { name: 'State Capitals' })).toBeVisible();
        await expect(root(page).locator('caption')).toHaveText('State Capitals');
        const headers = page.getByRole('columnheader');
        expect(await headers.evaluateAll((ths) => ths.map((th) => th.textContent?.trim()))).toEqual([
            'State',
            'Capital',
            'Population',
        ]);
        expect(await headers.evaluateAll((ths) => ths.map((th) => th.getAttribute('scope')))).toEqual([
            'col',
            'col',
            'col',
        ]);
        expect(
            await page
                .getByRole('table')
                .evaluate((el) => (el as HTMLElement).style.getPropertyValue('--template-columns')),
        ).toBe('minmax(min-content, 160px) minmax(min-content, 1fr) minmax(min-content, 1fr)');

        await expect(root(page).locator('tbody tr')).toHaveCount(3);
        expect(await column(page, 'capital')).toEqual(['Juneau', 'Montpelier', 'Montgomery']);
        const population = page.locator('pttrn-table td[data-cell="population"]').first();
        await expect(population).toHaveAttribute('data-align', 'right');
        await expect(population).toHaveAttribute('data-valign', 'center');
        await expect(page.locator('pttrn-table td[data-cell="state"]').first()).toHaveAttribute('data-align', 'left');

        await mount(page, table({ caption: '' }));
        await expect(root(page).locator('caption')).toHaveCount(0);
    },
    'aria-counts': async ({ page }) => {
        await mount(page, '<pttrn-table page-size="5"></pttrn-table>');
        await setData(
            page,
            `table.columns = [{ key: 'state', label: 'State', sort: 'string' }, false, { key: 'capital', label: 'Capital' }];
             table.data = Array.from({ length: 12 }, (_, i) => ({ id: 'r' + i, state: 'State ' + i, capital: 'Capital ' + i }));`,
        );

        await expect(page.getByRole('table')).toHaveAttribute('aria-colcount', '2');
        await expect(page.getByRole('columnheader')).toHaveCount(2);
        await expect(page.getByRole('table')).toHaveAttribute('aria-rowcount', '12');
        await expect(root(page).locator('tbody tr')).toHaveCount(5);
    },
    'formats-cells': async ({ page }) => {
        await mount(page, '<pttrn-table size="small"></pttrn-table>');
        await setData(
            page,
            `window.formatterCalls = [];
             const flag = document.createElement('em');
             flag.textContent = 'Flag of Vermont';
             table.columns = [
                 { key: 'state', label: 'State' },
                 { key: 'population', label: 'Population' },
                 { key: 'tags', label: 'Tags' },
                 { key: 'flag', label: 'Flag' },
                 { key: 'capital', label: 'Capital', formatter: (row, size) => {
                     window.formatterCalls.push([row.id, size]);
                     const bold = document.createElement('b');
                     bold.textContent = row.capital;
                     return bold;
                 } },
             ];
             table.data = [{ id: 'vt', state: 'Vermont', capital: 'Montpelier', population: 7919, tags: ['green', 'maple'], flag }];`,
        );

        expect(await column(page, 'state')).toEqual(['Vermont']);
        expect(await column(page, 'population')).toEqual(['7919']);
        expect(await column(page, 'tags')).toEqual(['green, maple']);
        await expect(page.locator('pttrn-table td[data-cell="flag"] em')).toHaveText('Flag of Vermont');
        await expect(page.locator('pttrn-table td[data-cell="capital"] b')).toHaveText('Montpelier');
        expect(
            await page.evaluate(() => (window as unknown as { formatterCalls: unknown[] }).formatterCalls),
        ).toContainEqual(['vt', 'small']);

        // From the child table, a cell's markup renders as it is.
        await mount(page, table({ rows: [{ state: '<em>Vermont</em>', capital: 'Montpelier', population: 1 }] }));
        await expect(page.locator('pttrn-table td[data-cell="state"] em')).toHaveText('Vermont');
    },
    'sort-cycle': async ({ page }) => {
        await mount(page, '<pttrn-table caption="State Capitals"></pttrn-table>');
        await setData(
            page,
            `window.rows = ${JSON.stringify(STATES.map((row, i) => ({ id: `r${i}`, ...row })))};
             table.columns = ${JSON.stringify(COLUMNS)};
             table.data = window.rows;`,
        );

        await expect(header(page, 'State')).toHaveAttribute('aria-sort', 'none');
        await expect(header(page, 'Capital')).not.toHaveAttribute('aria-sort');
        await expect(header(page, 'Capital').locator('button')).toHaveCount(0);
        expect(await column(page, 'state')).toEqual(['Alaska', 'Vermont', 'Alabama']);

        await sortButton(page, 'State').click();
        await expect(header(page, 'State')).toHaveAttribute('aria-sort', 'ascending');
        await expect(header(page, 'State').locator('[data-sort-icon]')).toHaveAttribute('aria-hidden', 'true');
        expect(await column(page, 'state')).toEqual(['Alabama', 'Alaska', 'Vermont']);

        await sortButton(page, 'State').click();
        await expect(header(page, 'State')).toHaveAttribute('aria-sort', 'descending');
        expect(await column(page, 'state')).toEqual(['Vermont', 'Alaska', 'Alabama']);

        await sortButton(page, 'State').click();
        await expect(header(page, 'State')).toHaveAttribute('aria-sort', 'none');
        await expect(header(page, 'State').locator('[data-sort-icon]')).toHaveCount(0);
        // Removing the sort restores the given order, and the caller's array was never reordered.
        expect(await column(page, 'state')).toEqual(['Alaska', 'Vermont', 'Alabama']);
        expect(await page.evaluate(() => (window as unknown as { rows: Row[] }).rows.map((row) => row.state))).toEqual([
            'Alaska',
            'Vermont',
            'Alabama',
        ]);
    },
    sorters: async ({ page }) => {
        // As text, "198525" would sort before "32756".
        await mount(page, table());
        await sortButton(page, 'Population').click();
        expect(await column(page, 'population')).toEqual(['7919', '32756', '198525']);

        await mount(page, '<pttrn-table></pttrn-table>');
        await setData(
            page,
            `window.compared = [];
             table.columns = [
                 { key: 'state', label: 'State', sort: 'string' },
                 { key: 'capital', label: 'Capital', sort: (a, b) => { window.compared.push([typeof a, typeof b]); return String(b).localeCompare(String(a)); } },
             ];
             table.data = ${JSON.stringify(STATES.map((row, i) => ({ id: `r${i}`, ...row })))};`,
        );
        await sortButton(page, 'Capital').click();
        expect(await page.evaluate(() => (window as unknown as { compared: string[][] }).compared)).toContainEqual([
            'string',
            'string',
        ]);
        expect(await column(page, 'capital')).toEqual(['Montpelier', 'Montgomery', 'Juneau']);
    },
    'multi-sort': async ({ page }) => {
        await mount(
            page,
            table({
                caption: '',
                columns: [
                    { key: 'region', label: 'Region', sort: 'string' },
                    { key: 'state', label: 'State', sort: 'string' },
                ],
                rows: [
                    { region: 'West', state: 'Washington' },
                    { region: 'South', state: 'Texas' },
                    { region: 'West', state: 'Oregon' },
                    { region: 'South', state: 'Georgia' },
                ],
            }),
        );

        await sortButton(page, 'Region').click();
        expect(await column(page, 'state')).toEqual(['Texas', 'Georgia', 'Washington', 'Oregon']);

        await sortButton(page, 'State').click();
        await expect(header(page, 'Region')).toHaveAttribute('aria-sort', 'ascending');
        await expect(header(page, 'State')).toHaveAttribute('aria-sort', 'ascending');
        expect(await column(page, 'state')).toEqual(['Georgia', 'Texas', 'Oregon', 'Washington']);

        await sortButton(page, 'State').click();
        await expect(header(page, 'State')).toHaveAttribute('aria-sort', 'descending');
        expect(await column(page, 'state')).toEqual(['Texas', 'Georgia', 'Washington', 'Oregon']);
    },
    'announces-sort': async ({ page }) => {
        await mount(page, table());

        await sortButton(page, 'State').click();
        await expect(liveRegion(page)).toHaveText('Sorted ascending by State');
        await expect(liveRegion(page)).toHaveAttribute('aria-live', 'polite');

        await sortButton(page, 'State').click();
        await expect(liveRegion(page)).toHaveText('Sorted descending by State');

        await sortButton(page, 'State').click();
        await expect(liveRegion(page)).toHaveText('Removed sorting by State');
    },
    'keyboard-sort': async ({ page }) => {
        await mount(page, table());

        await page.keyboard.press('Tab');
        await expect(sortButton(page, 'State')).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(header(page, 'State')).toHaveAttribute('aria-sort', 'ascending');
        await expect(sortButton(page, 'State')).toBeFocused();
        await page.keyboard.press('Space');
        await expect(header(page, 'State')).toHaveAttribute('aria-sort', 'descending');
        await expect(sortButton(page, 'State')).toBeFocused();

        // Capital is not sortable, so it has nothing to focus.
        await page.keyboard.press('Tab');
        await expect(sortButton(page, 'Population')).toBeFocused();
    },
    paginates: async ({ page }) => {
        await mount(page, table());
        await expect(page.getByRole('group')).toHaveCount(0);

        await mount(page, PRESETS['Page buttons']);
        expect(await column(page, 'state')).toEqual(['State 1', 'State 2', 'State 3', 'State 4', 'State 5']);
        await expect(page.getByText('Showing 1-5 of 12 results')).toBeVisible();
        await expect(
            page.getByRole('group', {
                name: 'The buttons inside this control allow you to paginate through the data in the table above, 5 rows at a time.',
            }),
        ).toBeVisible();

        await page.getByRole('button', { name: 'Page 2' }).click();
        expect(await column(page, 'state')).toEqual(['State 6', 'State 7', 'State 8', 'State 9', 'State 10']);
        await expect(page.getByText('Showing 6-10 of 12 results')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
        await expect(liveRegion(page)).toHaveText('Page 2 of 3');

        await page.getByRole('button', { name: 'Next page (3)' }).click();
        expect(await column(page, 'state')).toEqual(['State 11', 'State 12']);
        await expect(page.getByText('Showing 11-12 of 12 results')).toBeVisible();
        await expect(page.getByRole('table')).toHaveAttribute('aria-rowcount', '12');
        await expect(page.getByRole('button', { name: 'Last page' })).toBeDisabled();
    },
    'resets-page': async ({ page }) => {
        await mount(page, PRESETS['Page buttons']);

        await page.getByRole('button', { name: 'Page 3' }).click();
        await expect(page.getByText('Showing 11-12 of 12 results')).toBeVisible();

        await page
            .locator('pttrn-table > table tbody tr')
            .last()
            .evaluate((tr) => tr.remove());
        await expect(page.getByText('Showing 1-5 of 11 results')).toBeVisible();
        expect(await column(page, 'state')).toEqual(['State 1', 'State 2', 'State 3', 'State 4', 'State 5']);
    },
    variants: async ({ page }) => {
        await mount(page, table());
        await expect(root(page)).toHaveAttribute('data-size', 'medium');
        await expect(page.locator('pttrn-table')).toHaveAttribute('size', 'medium');
        await expect(root(page)).not.toHaveAttribute('data-has-pagination');

        await page.locator('pttrn-table').evaluate((el) => el.setAttribute('size', 'small'));
        await expect(root(page)).toHaveAttribute('data-size', 'small');

        await mount(page, PRESETS['Page buttons']);
        await expect(root(page)).toHaveAttribute('data-has-pagination');
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-table').analyze();
            expect(results.violations).toEqual([]);
        }
        // Sorted, so the arrow and the tinted column are covered too.
        await mount(page, PRESETS.Usage);
        await sortButton(page, 'State').click();
        const results = await new AxeBuilder({ page }).include('pttrn-table').analyze();
        expect(results.violations).toEqual([]);
    },
});
