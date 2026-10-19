import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { SwitchOption, SwitchOptionProps } from './SwitchOption';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const Subject = (props: Partial<SwitchOptionProps>) => (
    <SwitchOption checked label="Dark mode" name="dark" onChange={() => {}} value="on" {...props} />
);

describe('SwitchOption (RTL)', () => {
    it('renders', () => {
        render(<Subject />);

        expect(screen.getByLabelText('Dark mode')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    renders: () => {
        render(<Subject description="Easier on the eyes at night." />);

        expect(screen.getByText('Easier on the eyes at night.')).toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'Dark mode - Easier on the eyes at night.' })).toBeChecked();
    },
    toggle: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject checked={false} onChange={onChange} />);

        await user.click(screen.getByText('Dark mode'));
        expect(onChange).toHaveBeenLastCalledWith(true, expect.anything());

        screen.getByRole('switch').focus();
        await user.keyboard(' ');
        expect(onChange).toHaveBeenCalledTimes(2);
    },
    disabled: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject disabled onChange={onChange} />);

        expect(screen.getByRole('switch')).toBeDisabled();
        expect(document.querySelector('[data-pttrn="list-item"]')).toHaveAttribute('data-disabled');
        await user.click(screen.getByText('Dark mode'));
        expect(onChange).not.toHaveBeenCalled();
    },
    'axe-clean': hasNoBasicA11yIssues(<Subject />),
});
