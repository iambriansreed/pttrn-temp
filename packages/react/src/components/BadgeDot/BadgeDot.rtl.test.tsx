import { BadgeDot } from './BadgeDot';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const dot = () => document.querySelector('[data-pttrn="badge-dot"]') as HTMLElement;

describe('BadgeDot (RTL)', () => {
    it('renders its child content', () => {
        render(
            <BadgeDot>
                <div>dot content</div>
            </BadgeDot>,
        );

        expect(screen.getByText('dot content')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-dot': () => {
        render(<BadgeDot />);

        expect(dot().tagName).toBe('SUP');
        expect(dot()).toHaveAttribute('data-color', 'primary');
        expect(dot()).toHaveStyle({ '--size': '6px' });
        expect(dot()).not.toHaveAttribute('data-attachment');
        expect(dot().textContent).toBe('');
    },
    'attaches-to-child': () => {
        render(
            <BadgeDot>
                <button type="button">Messages</button>
            </BadgeDot>,
        );

        const wrapper = document.querySelector('[data-attachment-wrapper]');
        expect(wrapper).toContainElement(screen.getByRole('button', { name: 'Messages' }));
        expect(wrapper?.lastElementChild).toBe(dot());
        expect(dot()).toHaveAttribute('data-attachment');
    },
    'size-and-outline': () => {
        const { rerender } = render(<BadgeDot outline size={12} />);
        expect(dot()).toHaveStyle({ '--size': '12px', '--outline-width': '2px' });
        expect(dot()).toHaveAttribute('data-outline');

        rerender(<BadgeDot size={7 as 6} />);
        expect(dot()).toHaveStyle({ '--size': '6px', '--outline-width': '1px' });
    },
    color: () => {
        render(<BadgeDot color="secondary" />);

        expect(dot()).toHaveAttribute('data-color', 'secondary');
    },
    'axe-clean': hasNoBasicA11yIssues(
        <BadgeDot outline size={10}>
            <button type="button">Messages</button>
        </BadgeDot>,
    ),
});
