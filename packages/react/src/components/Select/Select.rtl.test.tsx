import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { presets } from './SelectExample';
import { spec } from './spec';
import { Select, SelectProps } from '.';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { fireEvent, render, screen, waitFor } from '-/rtl/util';

const OPTIONS = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta', disabled: true },
    { value: 'c', label: 'Gamma' },
];

const Subject = (props: Partial<SelectProps>) => (
    <Select
        aria-label="Letter"
        name="letter"
        onChange={() => {}}
        options={OPTIONS}
        placeholder="Pick one"
        value=""
        {...props}
    />
);

const control = () => screen.getByRole('combobox');
const listbox = () => document.querySelector('[role="listbox"]') as HTMLElement;
const isOpen = () => control().getAttribute('aria-expanded') === 'true';
// The list is positioned a tick after it opens and refuses pointer events until then.
const openList = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(control());
    await waitFor(() => expect(listbox()).toHaveStyle({ pointerEvents: 'auto' }));
};

describe('Select (RTL)', () => {
    it('renders the placeholder', () => {
        render(<Select {...presets[0].propState} name="example" onChange={() => {}} placeholder="Select an option" />);

        expect(screen.getByText('Select an option')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'closed-by-default': () => {
        render(<Subject />);

        expect(isOpen()).toBe(false);
        expect(control()).not.toHaveAttribute('aria-controls');
        expect(listbox()).toHaveStyle({ display: 'none' });
    },
    'opens-on-click': async () => {
        const user = userEvent.setup();
        render(<Subject />);

        await user.click(control());
        expect(isOpen()).toBe(true);
        expect(control()).toHaveAttribute('aria-controls', listbox().id);
        await waitFor(() => expect(listbox()).not.toHaveStyle({ display: 'none' }));
        expect(screen.getAllByRole('option')).toHaveLength(3);
    },
    'select-option': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        await openList(user);
        await user.click(screen.getByRole('option', { name: 'Gamma' }));
        expect(onChange).toHaveBeenCalledWith('c');
        await waitFor(() => expect(isOpen()).toBe(false));
    },
    'shows-selection': () => {
        const { rerender } = render(<Subject />);
        expect(control()).toHaveTextContent('Pick one');
        expect(document.querySelector('input[name="letter"]')).toHaveValue('');

        rerender(<Subject value="c" />);
        expect(control()).toHaveTextContent('Gamma');
        expect(document.querySelector('input[name="letter"]')).toHaveValue('c');
    },
    keyboard: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        await user.tab();
        expect(control()).toHaveFocus();
        await user.keyboard('{Enter}');
        expect(isOpen()).toBe(true);
        const alpha = await screen.findByRole('option', { name: 'Alpha' });
        expect(control()).toHaveAttribute('aria-activedescendant', alpha.id);

        await user.keyboard('{ArrowDown}');
        // Beta is disabled, so the active option skips to Gamma.
        expect(control()).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Gamma' }).id);
        await user.keyboard('{ArrowUp}');
        expect(control()).toHaveAttribute('aria-activedescendant', alpha.id);

        await user.keyboard('{ArrowDown}');
        await user.keyboard('{Enter}');
        expect(onChange).toHaveBeenCalledWith('c');
        await waitFor(() => expect(isOpen()).toBe(false));
    },
    'outside-click-closes': async () => {
        const user = userEvent.setup();
        render(
            <>
                <Subject />
                <p>Outside</p>
            </>,
        );

        await user.click(control());
        expect(isOpen()).toBe(true);
        fireEvent.mouseDown(screen.getByText('Outside'));
        await waitFor(() => expect(isOpen()).toBe(false));
    },
    'disabled-readonly': async () => {
        const user = userEvent.setup();
        const { rerender } = render(<Subject disabled />);

        expect(control()).toHaveAttribute('aria-disabled', 'true');
        await user.click(control());
        expect(isOpen()).toBe(false);

        rerender(<Subject readOnly />);
        expect(control()).toHaveAttribute('aria-readonly', 'true');
        await user.click(control());
        expect(isOpen()).toBe(false);
    },
    'disabled-option': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        await openList(user);
        await user.click(screen.getByRole('option', { name: 'Beta' }));
        expect(onChange).not.toHaveBeenCalled();
    },
    labelled: () => {
        const { rerender } = render(<Subject />);
        expect(control()).toHaveAccessibleName('Letter Pick one');

        rerender(<Subject value="a" />);
        expect(control()).toHaveAccessibleName('Letter Alpha');

        rerender(<Subject aria-label={undefined} />);
        expect(control()).toHaveAccessibleName('Pick one');
    },
    'axe-clean': async () => {
        for (const preset of presets) {
            await hasNoBasicA11yIssues(
                <Select {...preset.propState} aria-label="Example" name="example" onChange={() => {}} />,
            )();
        }
    },
});
