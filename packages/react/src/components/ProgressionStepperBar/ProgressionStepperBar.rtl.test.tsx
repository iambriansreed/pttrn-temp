import { ProgressionStepperBar } from './ProgressionStepperBar';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const bar = () => document.querySelector('[data-pttrn="progression-stepper-bar"]') as HTMLElement;
const segments = () => Array.from(bar().querySelectorAll<HTMLElement>('[data-step]'));
const completed = () => segments().map((segment) => segment.hasAttribute('data-complete'));

describe('ProgressionStepperBar (RTL)', () => {
    it('renders', () => {
        render(<ProgressionStepperBar stepCompleted={2} stepCount={4} />);

        expect(screen.getByText('2 of 4 steps completed.')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    segments: () => {
        render(<ProgressionStepperBar stepCompleted={2} stepCount={4} />);

        expect(segments()).toHaveLength(4);
        expect(completed()).toEqual([true, true, false, false]);
        expect(bar()).toHaveStyle({ '--steps': '4' });
    },
    'count-text': () => {
        render(<ProgressionStepperBar stepCompleted={1} stepCount={3} />);

        expect(bar().querySelector('[data-label]')).toHaveTextContent('1 of 3 steps completed.');
        expect(bar().querySelector('[data-steps]')).toHaveAttribute('aria-hidden', 'true');
        expect(bar()).not.toHaveAttribute('role');
    },
    clamps: () => {
        const { rerender } = render(<ProgressionStepperBar stepCompleted={-2} stepCount={3} />);
        expect(screen.getByText('0 of 3 steps completed.')).toBeInTheDocument();
        expect(completed()).toEqual([false, false, false]);

        rerender(<ProgressionStepperBar stepCompleted={9} stepCount={3} />);
        expect(screen.getByText('3 of 3 steps completed.')).toBeInTheDocument();
        expect(completed()).toEqual([true, true, true]);
    },
    sizes: () => {
        const { rerender } = render(<ProgressionStepperBar stepCompleted={1} stepCount={3} />);
        expect(bar()).toHaveAttribute('data-size', 'large');

        rerender(<ProgressionStepperBar size="small" stepCompleted={1} stepCount={3} />);
        expect(bar()).toHaveAttribute('data-size', 'small');
    },
    'axe-clean': async () => {
        await hasNoBasicA11yIssues(<ProgressionStepperBar stepCompleted={2} stepCount={4} />)();
        await hasNoBasicA11yIssues(<ProgressionStepperBar stepCompleted={4} stepCount={4} />)();
    },
});
