import { ProgressionStepper, ProgressionStepperProps } from './ProgressionStepper';
import { presets } from './ProgressionStepperExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const STEPS = [{ name: 'Account' }, { name: 'Address', subtext: 'Where we ship' }, { name: 'Review' }];

const Subject = (props: Partial<ProgressionStepperProps>) => (
    <ProgressionStepper completedStep={1} steps={STEPS} {...props} />
);

const container = () => document.querySelector('[data-pttrn="progression-stepper"]') as HTMLElement;
const item = (step: number) => container().querySelector(`li[data-step="${step}"]`) as HTMLElement;
const circle = (step: number) => item(step).querySelector('[data-circle]') as HTMLElement;
const statuses = () => screen.getAllByRole('listitem').map((li) => li.getAttribute('data-status'));
const header = (part: 'subtitle' | 'title') => container().querySelector(`[data-header] [data-${part}]`);

describe('ProgressionStepper (RTL)', () => {
    presets.forEach((preset) => {
        it(
            `has no basic a11y issues - ${preset.label}`,
            hasNoBasicA11yIssues(<ProgressionStepper {...preset.propState} />),
        );
    });

    it('renders', () => {
        const { getByText } = render(<ProgressionStepper {...presets[0].propState} />);

        expect(getByText('Name of step 1')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-steps': () => {
        render(<Subject />);

        expect(screen.getByRole('list').tagName).toBe('OL');
        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(3);
        items.forEach((li, index) => expect(li).toHaveAttribute('data-step', `${index + 1}`));
        expect(item(1).querySelector('[data-name]')).toHaveTextContent('Account');
        expect(item(1).querySelector('[data-subtext]')).toBeNull();
        expect(item(2).querySelector('[data-name]')).toHaveTextContent('Address');
        expect(item(2).querySelector('[data-subtext]')).toHaveTextContent('Where we ship');
        expect(circle(2)).toHaveTextContent('2');
        expect(circle(3)).toHaveTextContent('3');
    },
    'step-status': () => {
        const { rerender } = render(<ProgressionStepper steps={STEPS} />);
        expect(statuses()).toEqual(['current', 'incomplete', 'incomplete']);

        rerender(<Subject completedStep={1} />);
        expect(statuses()).toEqual(['complete', 'current', 'incomplete']);

        rerender(<Subject completedStep={2} />);
        expect(statuses()).toEqual(['complete', 'complete', 'current']);
    },
    'current-step': () => {
        const { rerender } = render(<Subject completedStep={1} />);
        expect(item(2)).toHaveAttribute('aria-current', 'step');
        expect(container().querySelectorAll('[aria-current]')).toHaveLength(1);

        rerender(<Subject completedStep={0} />);
        expect(item(1)).toHaveAttribute('aria-current', 'step');
        expect(item(2)).not.toHaveAttribute('aria-current');
    },
    'complete-check': () => {
        render(<Subject completedStep={1} />);

        const check = circle(1).querySelector('svg');
        expect(check).toHaveAttribute('aria-hidden', 'true');
        expect(check).toHaveAttribute('data-pttrn-name', 'Check');
        expect(circle(1)).toHaveTextContent('');
        expect(item(1)).toHaveTextContent('Account');
        expect(circle(2).querySelector('svg')).toBeNull();
        expect(circle(2)).toHaveTextContent('2');
    },
    clamps: () => {
        const { rerender } = render(<Subject completedStep={-4} />);
        expect(statuses()).toEqual(['current', 'incomplete', 'incomplete']);

        rerender(<Subject completedStep={10} />);
        expect(statuses()).toEqual(['complete', 'complete', 'complete']);
        expect(container().querySelector('[aria-current]')).toBeNull();
    },
    'widget-header': () => {
        const { rerender } = render(<Subject completedStep={0} variant="widget" />);
        expect(header('title')).toHaveTextContent('Account');
        expect(header('subtitle')).toHaveTextContent('Step 1 of 3');

        rerender(<Subject completedStep={1} variant="widget" />);
        expect(header('title')).toHaveTextContent('Address');
        expect(header('subtitle')).toHaveTextContent('Where we ship');

        rerender(<Subject completedStep={3} variant="widget" />);
        expect(header('title')).toHaveTextContent('Review');
        expect(header('subtitle')).toHaveTextContent('Completed');

        rerender(<Subject variant="horizontal" />);
        expect(container().querySelector('[data-header]')).toBeNull();
    },
    'widget-list': () => {
        render(<Subject completedStep={1} variant="widget" />);

        expect(screen.getAllByRole('listitem')).toHaveLength(3);
        expect(container().querySelector('[data-content]')).toBeNull();
        expect(container().querySelector('[data-name]')).toBeNull();
        expect(circle(1).querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
        expect(circle(2)).toHaveTextContent('2');
        expect(item(2)).toHaveAttribute('aria-current', 'step');
        expect(circle(3)).toBeEmptyDOMElement();
    },
    variants: () => {
        const { rerender } = render(<Subject />);
        expect(container()).toHaveAttribute('data-variant', 'horizontal');

        rerender(<Subject variant="vertical" />);
        expect(container()).toHaveAttribute('data-variant', 'vertical');

        rerender(<Subject variant="widget" />);
        expect(container()).toHaveAttribute('data-variant', 'widget');
    },
    empty: () => {
        const { container: root } = render(<ProgressionStepper steps={[]} />);

        expect(root).toBeEmptyDOMElement();
    },
    'axe-clean': async () => {
        for (const preset of presets) await hasNoBasicA11yIssues(<ProgressionStepper {...preset.propState} />)();
    },
});
