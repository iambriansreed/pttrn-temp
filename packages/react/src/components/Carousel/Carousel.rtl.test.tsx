import userEvent from '@testing-library/user-event';
import { Carousel } from './Carousel';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const Subject = ({ count = 3 }: { count?: number }) => (
    <Carousel label="Featured">
        {Array.from({ length: count }, (_, i) => (
            <div key={i}>Slide content {i + 1}</div>
        ))}
    </Carousel>
);

const slide = (n: number, total = 3) => screen.getByRole('group', { name: `Slide ${n} of ${total}` });
const next = () => screen.getByRole('button', { name: 'Next Slide' });
const previous = () => screen.getByRole('button', { name: 'Previous Slide' });
const live = () => document.querySelector('[aria-live="polite"]');

describe('Carousel (RTL)', () => {
    it('renders', () => {
        render(<Subject />);

        expect(screen.getByText('Slide content 2')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-slides': () => {
        render(<Subject />);

        const region = screen.getByRole('region', { name: 'Featured' });
        expect(region).toHaveAttribute('aria-roledescription', 'carousel');
        [1, 2, 3].forEach((n) => expect(slide(n)).toHaveAttribute('aria-roledescription', 'slide'));
        expect(screen.getByRole('img', { name: 'Page 1 of 3' })).toBeInTheDocument();
    },
    'previous-next': async () => {
        const user = userEvent.setup();
        render(<Subject />);

        expect(previous()).toBeDisabled();
        await user.click(next());
        expect(slide(2)).toHaveAttribute('data-active');
        expect(previous()).toBeEnabled();

        await user.click(next());
        expect(slide(3)).toHaveAttribute('data-active');
        expect(next()).toBeDisabled();

        await user.click(previous());
        expect(slide(2)).toHaveAttribute('data-active');
    },
    'arrow-keys': async () => {
        const user = userEvent.setup();
        render(<Subject />);

        slide(1).focus();
        await user.keyboard('{ArrowRight}');
        expect(slide(2)).toHaveAttribute('data-active');
        await user.keyboard('{ArrowRight}');
        await user.keyboard('{ArrowRight}');
        expect(slide(3)).toHaveAttribute('data-active');
        await user.keyboard('{ArrowLeft}');
        expect(slide(2)).toHaveAttribute('data-active');
    },
    announces: async () => {
        const user = userEvent.setup();
        render(<Subject />);

        expect(live()).toHaveTextContent('Slide 1 of 3');
        await user.click(next());
        expect(live()).toHaveTextContent('Slide 2 of 3');
    },
    'active-focusable': async () => {
        const user = userEvent.setup();
        render(<Subject />);

        expect(slide(1)).toHaveAttribute('tabindex', '0');
        expect(slide(2)).toHaveAttribute('tabindex', '-1');
        await user.click(next());
        expect(slide(2)).toHaveAttribute('tabindex', '0');
        expect(slide(1)).toHaveAttribute('tabindex', '-1');
        expect(slide(2)).toHaveFocus();
    },
    'axe-clean': async () => {
        await hasNoBasicA11yIssues(<Subject />)();
        await hasNoBasicA11yIssues(<Subject count={7} />)();
    },
});
