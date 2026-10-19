import { ProgressCircle, ProgressCircleProps } from './ProgressCircle';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const Subject = (props: Partial<ProgressCircleProps>) => <ProgressCircle label="Loading results" {...props} />;
const circle = () => screen.getByRole('progressbar');

describe('ProgressCircle (RTL)', () => {
    it('renders', () => {
        render(<Subject />);

        expect(screen.getByLabelText('Loading results')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-label': () => {
        render(<Subject />);

        expect(circle()).toHaveAccessibleName('Loading results');
        expect(circle()).toHaveAttribute('data-pttrn', 'progress-circle');
        expect(circle()).toContainElement(screen.getByText('Loading results'));
    },
    'default-label': () => {
        render(<Subject label="" />);

        expect(circle()).toHaveAccessibleName('Loading ...');
    },
    indeterminate: () => {
        render(<Subject />);

        expect(circle()).not.toHaveAttribute('aria-valuenow');
        expect(circle()).not.toHaveAttribute('aria-valuemin');
        expect(circle()).not.toHaveAttribute('aria-valuemax');
    },
    size: () => {
        const { rerender } = render(<Subject />);
        expect(circle()).toHaveAttribute('data-size', 'medium');

        rerender(<Subject size="small" />);
        expect(circle()).toHaveAttribute('data-size', 'small');

        rerender(<Subject size="large" />);
        expect(circle()).toHaveAttribute('data-size', 'large');
    },
    'label-position': () => {
        const { rerender } = render(<Subject />);
        expect(circle()).not.toHaveAttribute('data-label-position');

        rerender(<Subject labelPosition="right" />);
        expect(circle()).toHaveAttribute('data-label-position', 'right');
    },
    'ring-animated': () => {
        render(<Subject />);

        const ring = circle().querySelector('svg');
        expect(ring).toHaveAttribute('data-animated');
        expect(ring?.querySelectorAll('path')).toHaveLength(3);
    },
    'axe-clean': async () => {
        for (const size of ['small', 'medium', 'large'] as const) await hasNoBasicA11yIssues(<Subject size={size} />)();
    },
});
