import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { TableExample } from './TableExample';
import { spec } from './spec';
import { Table, TableColumn, TableProps, TableRow } from '.';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';
import { ComponentMeta } from '-/types/meta';

type StateRow = TableRow & { capital: string; population: number; state: string };

// Alaska first, so that no sort order equals the order the rows arrive in.
const STATES: StateRow[] = [
    { id: 'ak', state: 'Alaska', capital: 'Juneau', population: 32756 },
    { id: 'vt', state: 'Vermont', capital: 'Montpelier', population: 7919 },
    { id: 'al', state: 'Alabama', capital: 'Montgomery', population: 198525 },
];
const COLUMNS: TableColumn<StateRow>[] = [
    { key: 'state', label: 'State', width: '160px', sort: 'string' },
    { key: 'capital', label: 'Capital' },
    { key: 'population', label: 'Population', align: 'right', sort: 'number' },
];
const states = () => STATES.map((row) => ({ ...row }));
/** Rows "State 1" to "State n", for paging. */
const many = (n: number): StateRow[] =>
    Array.from({ length: n }, (_, i) => ({
        id: `r${i + 1}`,
        state: `State ${i + 1}`,
        capital: `Capital ${i + 1}`,
        population: i,
    }));
/** Enough component meta for the "Large dataset" preset, which builds its rows from it. */
const META: ComponentMeta[] = [
    {
        name: 'Button',
        slug: 'button',
        file: 'Button.tsx',
        phase: 'Stable',
        dependencies: ['Tooltip'],
        css: 'a {}\nb {}\n',
        hasTouchTarget: true,
        description: 'A button.',
    },
    {
        name: 'Table',
        slug: 'table',
        file: 'Table.tsx',
        phase: 'Dev',
        dependencies: ['Pagination'],
        css: 'a {}\n',
        hasTouchTarget: false,
        description: 'A table.',
    },
    {
        name: 'Truncated',
        slug: 'truncated',
        file: 'Truncated.tsx',
        phase: 'Utility',
        dependencies: [],
        css: '',
        hasTouchTarget: false,
    },
];

const Subject = (props: Partial<TableProps<StateRow>>) => (
    <Table columns={COLUMNS} data={states()} title="State Capitals" {...props} />
);

const root = () => document.querySelector('[data-pttrn="table"]') as HTMLElement;
const table = () => screen.getByRole('table');
const header = (name: string) => screen.getByRole('columnheader', { name });
const sortButton = (name: string) => screen.getByRole('button', { name });
const bodyRows = () => Array.from(document.querySelectorAll('tbody tr'));
/** The text of one column, top to bottom. */
const column = (key: string) =>
    Array.from(document.querySelectorAll(`td[data-cell="${key}"]`), (cell) => cell.textContent);
const liveRegion = () => document.querySelector('[data-pttrn-aria-live]');

describe('Table (RTL)', () => {
    it('has no basic a11y issues', hasNoBasicA11yIssues(<Subject />));

    it('renders', () => {
        render(<Subject />);

        expect(screen.getByText('State Capitals')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-table': () => {
        const { rerender } = render(<Subject />);

        expect(screen.getByRole('table', { name: 'State Capitals' })).toBeInTheDocument();
        expect(document.querySelector('caption')).toHaveTextContent('State Capitals');
        const headers = screen.getAllByRole('columnheader');
        expect(headers.map((th) => th.textContent)).toEqual(['State', 'Capital', 'Population']);
        headers.forEach((th) => expect(th).toHaveAttribute('scope', 'col'));
        expect(table().style.getPropertyValue('--template-columns')).toBe(
            'minmax(min-content, 160px) minmax(min-content, 1fr) minmax(min-content, 1fr)',
        );

        expect(bodyRows()).toHaveLength(3);
        expect(column('capital')).toEqual(['Juneau', 'Montpelier', 'Montgomery']);
        const population = document.querySelector('td[data-cell="population"]');
        expect(population).toHaveAttribute('data-align', 'right');
        expect(population).toHaveAttribute('data-valign', 'center');
        expect(document.querySelector('td[data-cell="state"]')).toHaveAttribute('data-align', 'left');

        rerender(<Subject title={undefined} />);
        expect(document.querySelector('caption')).toBeNull();
    },
    'aria-counts': () => {
        render(<Subject columns={[COLUMNS[0], false, COLUMNS[1]]} data={many(12)} pageSize={5} />);

        expect(table()).toHaveAttribute('aria-colcount', '2');
        expect(screen.getAllByRole('columnheader')).toHaveLength(2);
        expect(table()).toHaveAttribute('aria-rowcount', '12');
        expect(bodyRows()).toHaveLength(5);
    },
    'formats-cells': () => {
        const formatter = jest.fn((row: TableRow) => <b>{String(row.capital)}</b>);
        render(
            <Table
                columns={[
                    { key: 'state', label: 'State' },
                    { key: 'population', label: 'Population' },
                    { key: 'tags', label: 'Tags' },
                    { key: 'flag', label: 'Flag' },
                    { key: 'capital', label: 'Capital', formatter },
                ]}
                data={[
                    {
                        id: 'vt',
                        state: 'Vermont',
                        capital: 'Montpelier',
                        population: 7919,
                        tags: ['green', 'maple'],
                        flag: <em>Flag of Vermont</em>,
                    },
                ]}
                size="small"
            />,
        );

        expect(column('state')).toEqual(['Vermont']);
        expect(column('population')).toEqual(['7919']);
        expect(column('tags')).toEqual(['green, maple']);
        expect(document.querySelector('td[data-cell="flag"] em')).toHaveTextContent('Flag of Vermont');
        expect(document.querySelector('td[data-cell="capital"] b')).toHaveTextContent('Montpelier');
        expect(formatter).toHaveBeenCalledWith(expect.objectContaining({ id: 'vt' }), 'small');
    },
    'sort-cycle': async () => {
        const user = userEvent.setup();
        const rows = states();
        render(<Subject data={rows} />);

        expect(header('State')).toHaveAttribute('aria-sort', 'none');
        expect(header('Capital')).not.toHaveAttribute('aria-sort');
        expect(header('Capital').querySelector('button')).toBeNull();
        expect(column('state')).toEqual(['Alaska', 'Vermont', 'Alabama']);

        await user.click(sortButton('State'));
        expect(header('State')).toHaveAttribute('aria-sort', 'ascending');
        expect(header('State').querySelector('[data-sort-icon]')).toHaveAttribute('aria-hidden', 'true');
        expect(column('state')).toEqual(['Alabama', 'Alaska', 'Vermont']);

        await user.click(sortButton('State'));
        expect(header('State')).toHaveAttribute('aria-sort', 'descending');
        expect(column('state')).toEqual(['Vermont', 'Alaska', 'Alabama']);

        await user.click(sortButton('State'));
        expect(header('State')).toHaveAttribute('aria-sort', 'none');
        expect(header('State').querySelector('[data-sort-icon]')).toBeNull();
        // Removing the sort restores the given order, and the caller's array was never reordered.
        expect(column('state')).toEqual(['Alaska', 'Vermont', 'Alabama']);
        expect(rows.map((row) => row.state)).toEqual(['Alaska', 'Vermont', 'Alabama']);
    },
    sorters: async () => {
        const user = userEvent.setup();
        const reverse = jest.fn((a: unknown, b: unknown) => String(b).localeCompare(String(a)));
        const { unmount } = render(<Subject />);

        // As text, "198525" would sort before "32756".
        await user.click(sortButton('Population'));
        expect(column('population')).toEqual(['7919', '32756', '198525']);
        unmount();

        render(<Subject columns={[COLUMNS[0], { key: 'capital', label: 'Capital', sort: reverse }, COLUMNS[2]]} />);
        await user.click(sortButton('Capital'));
        expect(reverse).toHaveBeenCalledWith(expect.any(String), expect.any(String));
        expect(column('capital')).toEqual(['Montpelier', 'Montgomery', 'Juneau']);
    },
    'multi-sort': async () => {
        const user = userEvent.setup();
        render(
            <Table
                columns={[
                    { key: 'region', label: 'Region', sort: 'string' },
                    { key: 'state', label: 'State', sort: 'string' },
                ]}
                data={[
                    { id: '1', region: 'West', state: 'Washington' },
                    { id: '2', region: 'South', state: 'Texas' },
                    { id: '3', region: 'West', state: 'Oregon' },
                    { id: '4', region: 'South', state: 'Georgia' },
                ]}
            />,
        );

        await user.click(sortButton('Region'));
        expect(column('state')).toEqual(['Texas', 'Georgia', 'Washington', 'Oregon']);

        await user.click(sortButton('State'));
        expect(header('Region')).toHaveAttribute('aria-sort', 'ascending');
        expect(header('State')).toHaveAttribute('aria-sort', 'ascending');
        expect(column('state')).toEqual(['Georgia', 'Texas', 'Oregon', 'Washington']);

        await user.click(sortButton('State'));
        expect(header('State')).toHaveAttribute('aria-sort', 'descending');
        expect(column('state')).toEqual(['Texas', 'Georgia', 'Washington', 'Oregon']);
    },
    'announces-sort': async () => {
        const user = userEvent.setup();
        render(<Subject />);

        await user.click(sortButton('State'));
        expect(liveRegion()).toHaveTextContent('Sorted ascending by State');
        expect(liveRegion()).toHaveAttribute('aria-live', 'polite');

        await user.click(sortButton('State'));
        expect(liveRegion()).toHaveTextContent('Sorted descending by State');

        await user.click(sortButton('State'));
        expect(liveRegion()).toHaveTextContent('Removed sorting by State');
    },
    'keyboard-sort': async () => {
        const user = userEvent.setup();
        render(<Subject />);

        await user.tab();
        expect(sortButton('State')).toHaveFocus();
        await user.keyboard('{Enter}');
        expect(header('State')).toHaveAttribute('aria-sort', 'ascending');
        expect(sortButton('State')).toHaveFocus();
        await user.keyboard(' ');
        expect(header('State')).toHaveAttribute('aria-sort', 'descending');
        expect(sortButton('State')).toHaveFocus();

        // Capital is not sortable, so it has nothing to focus.
        await user.tab();
        expect(sortButton('Population')).toHaveFocus();
    },
    paginates: async () => {
        const user = userEvent.setup();
        const { rerender } = render(<Subject />);
        expect(screen.queryByRole('group')).not.toBeInTheDocument();

        rerender(<Subject data={many(12)} pageSize={5} />);
        expect(column('state')).toEqual(['State 1', 'State 2', 'State 3', 'State 4', 'State 5']);
        expect(screen.getByText('Showing 1-5 of 12 results')).toBeInTheDocument();
        expect(
            screen.getByRole('group', {
                name: 'The buttons inside this control allow you to paginate through the data in the table above, 5 rows at a time.',
            }),
        ).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Page 2' }));
        expect(column('state')).toEqual(['State 6', 'State 7', 'State 8', 'State 9', 'State 10']);
        expect(screen.getByText('Showing 6-10 of 12 results')).toBeInTheDocument();
        expect(liveRegion()).toHaveTextContent('Page 2 of 3');

        await user.click(screen.getByRole('button', { name: 'Next page (3)' }));
        expect(column('state')).toEqual(['State 11', 'State 12']);
        expect(screen.getByText('Showing 11-12 of 12 results')).toBeInTheDocument();
        expect(table()).toHaveAttribute('aria-rowcount', '12');
    },
    'resets-page': async () => {
        const user = userEvent.setup();
        const { rerender } = render(<Subject data={many(12)} pageSize={5} />);

        await user.click(screen.getByRole('button', { name: 'Page 3' }));
        expect(screen.getByText('Showing 11-12 of 12 results')).toBeInTheDocument();

        rerender(<Subject data={many(11)} pageSize={5} />);
        expect(screen.getByText('Showing 1-5 of 11 results')).toBeInTheDocument();
        expect(column('state')).toEqual(['State 1', 'State 2', 'State 3', 'State 4', 'State 5']);
    },
    variants: () => {
        const { rerender } = render(<Subject />);
        expect(root()).toHaveAttribute('data-size', 'medium');
        expect(root()).not.toHaveAttribute('data-has-pagination');

        rerender(<Subject size="small" />);
        expect(root()).toHaveAttribute('data-size', 'small');

        rerender(<Subject data={many(12)} pageSize={5} />);
        expect(root()).toHaveAttribute('data-has-pagination');
    },
    'axe-clean': async () => {
        const { defaultState, presets = [] } = TableExample({
            action: () => {},
            componentsMeta: META,
            setState: () => {},
        });
        for (const preset of presets) {
            await hasNoBasicA11yIssues(<Table {...preset.propState} />)();
        }
        // The Usage example: fifty rows, five to a page, so the footer and its page field are covered too.
        await hasNoBasicA11yIssues(<Table {...(defaultState as TableProps<TableRow>)} title="States" />)();
    },
});
