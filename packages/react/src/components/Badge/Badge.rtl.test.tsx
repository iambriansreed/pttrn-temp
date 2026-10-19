import { Badge } from './Badge';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const badge = () => document.querySelector('[data-pttrn="badge"]') as HTMLElement;

describe('Badge (RTL)', () => {
    it('renders', () => {
        render(<Badge count={3}>Example Content</Badge>);

        expect(screen.getByText('Example Content')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-count': () => {
        render(<Badge count={5} />);

        expect(badge()).toHaveTextContent('5');
        expect(badge().tagName).toBe('SUP');
    },
    'no-count': () => {
        const { container } = render(
            <Badge>
                <span>Messages</span>
            </Badge>,
        );

        expect(screen.getByText('Messages')).toBeInTheDocument();
        expect(container.querySelector('[data-pttrn="badge"]')).toBeNull();
        expect(container.querySelector('[data-attachment-wrapper]')).toBeNull();
    },
    'caps-at-99': () => {
        const { rerender } = render(<Badge count={99} />);
        expect(badge()).toHaveTextContent('99');

        rerender(<Badge count={100} />);
        expect(badge()).toHaveTextContent('99+');
    },
    'attaches-to-child': () => {
        render(
            <Badge count={5}>
                <button aria-label="Messages, 5 unread" type="button">
                    Messages
                </button>
            </Badge>,
        );

        const wrapper = document.querySelector('[data-attachment-wrapper]');
        expect(wrapper).toContainElement(screen.getByRole('button'));
        expect(wrapper?.lastElementChild).toBe(badge());
        expect(badge()).toHaveAttribute('data-attachment');
    },
    variants: () => {
        const { rerender } = render(<Badge count={5} />);
        expect(badge()).toHaveAttribute('data-size', 'small');
        expect(badge()).toHaveAttribute('data-color', 'primary');
        expect(badge()).not.toHaveAttribute('data-surface-border');

        rerender(<Badge color="secondary" count={5} size="x-small" surfaceBorder />);
        expect(badge()).toHaveAttribute('data-size', 'x-small');
        expect(badge()).toHaveAttribute('data-color', 'secondary');
        expect(badge()).toHaveAttribute('data-surface-border');
    },
    'axe-clean': hasNoBasicA11yIssues(
        <Badge count={5}>
            <button aria-label="Messages, 5 unread" type="button">
                Messages
            </button>
        </Badge>,
    ),
});
