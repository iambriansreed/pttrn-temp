import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { fireEvent, render, screen } from '-/rtl/util';

const button = (name: RegExp | string) => screen.getByRole('button', { name });

describe('Pagination (RTL)', () => {
    it('renders', () => {
        render(<Pagination numPages={4} onChange={() => {}} value={1} />);

        expect(button('First page')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-pages': () => {
        render(<Pagination numPages={4} onChange={() => {}} value={2} />);

        expect(screen.getByRole('group')).toBeInTheDocument();
        [1, 2, 3, 4].forEach((n) => expect(button(`Page ${n}`)).toBeInTheDocument());
        expect(button('Page 2')).toHaveAttribute('aria-current', 'page');
        expect(button('Page 1')).not.toHaveAttribute('aria-current');
        expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    },
    'previous-next': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        const { rerender } = render(<Pagination numPages={4} onChange={onChange} value={1} />);

        expect(button('First page')).toBeDisabled();
        await user.click(button('Next page (2)'));
        expect(onChange).toHaveBeenCalledWith(2);

        rerender(<Pagination numPages={4} onChange={onChange} value={4} />);
        expect(button('Last page')).toBeDisabled();
        await user.click(button('Previous page (3)'));
        expect(onChange).toHaveBeenCalledWith(3);
    },
    'click-page': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Pagination numPages={4} onChange={onChange} value={1} />);

        await user.click(button('Page 3'));
        expect(onChange).toHaveBeenCalledWith(3);
    },
    'page-field': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Pagination numPages={20} onChange={onChange} value={1} />);

        expect(screen.queryByRole('button', { name: 'Page 1' })).not.toBeInTheDocument();
        const field = screen.getByRole('spinbutton');
        expect(field).toHaveValue(1);
        expect(screen.getByText('of 20')).toBeInTheDocument();

        // Enter submits the form around the field; jsdom does not perform the implicit submission itself.
        const submit = () => fireEvent.submit(field.closest('form')!);
        await user.clear(field);
        await user.type(field, '7');
        submit();
        expect(onChange).toHaveBeenLastCalledWith(7);

        await user.clear(field);
        await user.type(field, '99');
        submit();
        expect(onChange).toHaveBeenLastCalledWith(20);

        await user.clear(field);
        await user.type(field, '3');
        await user.tab();
        expect(onChange).toHaveBeenLastCalledWith(3);
    },
    announces: async () => {
        const user = userEvent.setup();
        render(<Pagination numPages={4} onChange={() => {}} value={1} />);

        await user.click(button('Page 3'));
        expect(document.querySelector('[data-pttrn-aria-live]')).toHaveTextContent('Page 3 of 4');
        expect(document.querySelector('[data-pttrn-aria-live]')).toHaveAttribute('aria-live', 'polite');
    },
    'single-page': () => {
        const { container } = render(<Pagination numPages={1} onChange={() => {}} value={1} />);

        expect(container).toBeEmptyDOMElement();
    },
    'axe-clean': async () => {
        await hasNoBasicA11yIssues(<Pagination aria-label="Results" numPages={4} onChange={() => {}} value={1} />)();
        await hasNoBasicA11yIssues(<Pagination aria-label="Results" numPages={20} onChange={() => {}} value={5} />)();
    },
});
