import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { SearchBar, SearchBarProps } from './SearchBar';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen, waitFor, within } from '-/rtl/util';

const ITEMS = [{ label: 'Apple Pie' }, { label: 'Apple Tart' }, { label: 'Banana Split' }, { label: 'Cherry Tart' }];

/** A SearchBar that keeps what is typed, as an app would. */
function Stateful({ onChange, ...props }: Partial<SearchBarProps>) {
    const [value, setValue] = useState('');
    return (
        <SearchBar
            aria-label="Desserts"
            items={ITEMS}
            name="dessert"
            onChange={(next, item) => {
                setValue(next ?? '');
                onChange?.(next, item);
            }}
            placeholder="Search"
            value={value}
            {...props}
        />
    );
}

const field = () => screen.getByRole('combobox', { name: 'Desserts' });
const isOpen = () => field().getAttribute('aria-expanded') === 'true';
const active = () => document.getElementById(field().getAttribute('aria-activedescendant') || '');
const visibleOptions = () =>
    screen.getAllByRole('option', { hidden: true }).filter((option) => !option.hasAttribute('aria-disabled'));

describe('SearchBar (RTL)', () => {
    it('renders', () => {
        render(<Stateful />);

        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    combobox: () => {
        render(<Stateful />);

        expect(field()).toHaveAttribute('aria-autocomplete', 'list');
        expect(field()).toHaveAttribute('aria-haspopup', 'listbox');
        expect(isOpen()).toBe(false);
        expect(field()).not.toHaveAttribute('aria-controls');
    },
    filters: async () => {
        const user = userEvent.setup();
        render(<Stateful />);

        await user.type(field(), 'tart');
        await waitFor(() => expect(isOpen()).toBe(true));
        const listbox = screen.getByRole('listbox', { name: 'Search results', hidden: true });
        expect(field()).toHaveAttribute('aria-controls', listbox.id);
        expect(visibleOptions().map((option) => option.textContent)).toEqual(['Apple Tart', 'Cherry Tart']);
        expect(active()).toHaveTextContent('Apple Tart');
    },
    'text-editing': async () => {
        const user = userEvent.setup();
        render(<Stateful />);

        await user.type(field(), 'Apple Pie');
        expect(field()).toHaveValue('Apple Pie');
        await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}X');
        expect(field()).toHaveValue('Apple XPie');
    },
    'arrow-keys': async () => {
        const user = userEvent.setup();
        render(<Stateful />);

        await user.type(field(), 'a');
        await waitFor(() => expect(active()).toHaveTextContent('Apple Pie'));
        await user.keyboard('{ArrowDown}');
        expect(active()).toHaveTextContent('Apple Tart');
        await user.keyboard('{ArrowUp}');
        expect(active()).toHaveTextContent('Apple Pie');
    },
    choose: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Stateful onChange={onChange} />);

        await user.type(field(), 'cher');
        await waitFor(() => expect(active()).toHaveTextContent('Cherry Tart'));
        await user.keyboard('{Enter}');
        expect(onChange).toHaveBeenLastCalledWith('Cherry Tart', expect.objectContaining({ label: 'Cherry Tart' }));
        expect(field()).toHaveValue('Cherry Tart');
        expect(isOpen()).toBe(false);

        await user.type(field(), 'x');
        await user.clear(field());
        await user.type(field(), 'ban');
        await waitFor(() => expect(isOpen()).toBe(true));
        await user.click(screen.getByRole('option', { name: 'Banana Split', hidden: true }));
        expect(onChange).toHaveBeenLastCalledWith('Banana Split', expect.objectContaining({ label: 'Banana Split' }));
        expect(isOpen()).toBe(false);
    },
    'escape-closes': async () => {
        const user = userEvent.setup();
        render(<Stateful />);

        await user.type(field(), 'a');
        await waitFor(() => expect(isOpen()).toBe(true));
        await user.keyboard('{Escape}');
        expect(isOpen()).toBe(false);
        expect(field()).toHaveFocus();

        await user.type(field(), 'p');
        await waitFor(() => expect(isOpen()).toBe(true));
    },
    'no-results': async () => {
        const user = userEvent.setup();
        render(<Stateful noResultsMessage="Try another dessert" />);

        await user.type(field(), 'zzz');
        await waitFor(() => expect(isOpen()).toBe(true));
        const listbox = screen.getByRole('listbox', { hidden: true });
        expect(within(listbox).getByText('No results found')).toBeInTheDocument();
        expect(within(listbox).getByText('Try another dessert')).toBeInTheDocument();
        expect(active()).toHaveAttribute('aria-disabled', 'true');
        const live = document.querySelector('[data-pttrn-aria-live]');
        expect(live).toHaveTextContent('No results found');
        expect(live).toHaveAttribute('aria-live', 'assertive');
    },
    'axe-clean': async () => {
        await hasNoBasicA11yIssues(<Stateful />)();

        const user = userEvent.setup();
        render(<Stateful />);
        await user.type(screen.getAllByRole('combobox')[0], 'a');
        await waitFor(() => expect(screen.getAllByRole('combobox')[0]).toHaveAttribute('aria-expanded', 'true'));
        await hasNoBasicA11yIssues(<Stateful />)();
    },
});
