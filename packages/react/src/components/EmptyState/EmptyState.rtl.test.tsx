import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { EmptyState, EmptyStateProps } from './EmptyState';
import { presets } from './EmptyStateExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const Subject = (props: Partial<EmptyStateProps>) => (
    <EmptyState body="Try changing your search." header="No results" {...props} />
);
const container = () => document.querySelector('[data-pttrn="empty-state"]') as HTMLElement;

describe('EmptyState (RTL)', () => {
    it('renders', () => {
        render(<EmptyState {...presets[0].propState} />);

        expect(screen.getByText('No results found')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-text': () => {
        render(<Subject />);

        expect(container()).toContainElement(screen.getByText('No results'));
        expect(container()).toContainElement(screen.getByText('Try changing your search.'));
    },
    illustration: () => {
        render(
            <Subject>
                <img alt="" data-testid="art" src="data:," />
            </Subject>,
        );

        const art = screen.getByTestId('art');
        expect(container().firstElementChild).toBe(art);
        expect(
            art.compareDocumentPosition(screen.getByText('No results')) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    },
    'call-to-action': async () => {
        const user = userEvent.setup();
        const onClick = jest.fn();
        const { rerender } = render(<Subject callToAction={{ label: 'Add item', onClick }} />);

        const button = screen.getByRole('button', { name: 'Add item' });
        expect(button).toHaveAttribute('data-variant', 'primary');
        expect(button).toHaveAttribute('data-size', 'medium');
        await user.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);

        rerender(<Subject callToAction={{ label: 'Add item', onClick, size: 'small' }} />);
        expect(screen.getByRole('button', { name: 'Add item' })).toHaveAttribute('data-size', 'small');
    },
    'no-call-to-action': () => {
        render(<Subject />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    },
    'body-align': () => {
        const { rerender } = render(<Subject />);
        const text = () => screen.getByText('No results').parentElement as HTMLElement;
        expect(text()).toHaveStyle({ textAlign: 'center', alignItems: 'center' });

        rerender(<Subject bodyAlign="left" />);
        expect(text()).toHaveStyle({ textAlign: 'left', alignItems: 'flex-start' });
    },
    'axe-clean': async () => {
        for (const preset of presets) await hasNoBasicA11yIssues(<EmptyState {...preset.propState} />)();
        await hasNoBasicA11yIssues(<Subject callToAction={{ label: 'Add item', onClick: () => {} }} />)();
    },
});
