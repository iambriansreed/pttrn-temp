import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { spec } from './spec';
import { Password, PasswordProps } from '.';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const Subject = (props: Partial<PasswordProps>) => (
    <Password aria-label="Password" name="password" onChange={() => {}} value="secret" {...props} />
);
const field = () => screen.getByLabelText('Password');

describe('Password (RTL)', () => {
    it('renders', () => {
        render(<Subject />);

        expect(field()).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'hidden-by-default': () => {
        render(<Subject />);

        expect(field()).toHaveAttribute('type', 'password');
    },
    'show-hide': async () => {
        const user = userEvent.setup();
        render(<Subject />);

        await user.click(screen.getByRole('button', { name: 'Show' }));
        expect(field()).toHaveAttribute('type', 'text');
        await user.click(screen.getByRole('button', { name: 'Hide' }));
        expect(field()).toHaveAttribute('type', 'password');
    },
    typing: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} value="" />);

        await user.type(field(), 'p');
        expect(onChange).toHaveBeenCalledWith('p', expect.anything());
    },
    'no-toggle-when-locked': () => {
        const { rerender } = render(<Subject disabled />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();

        rerender(<Subject readOnly />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    },
    'no-clear-or-autocomplete': () => {
        render(<Subject />);

        expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
        expect(field()).toHaveAttribute('autocomplete', 'off');
    },
    'axe-clean': hasNoBasicA11yIssues(<Subject />),
});
