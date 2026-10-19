import { ProgressBar, ProgressBarProps } from './ProgressBar';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const Subject = (props: Partial<ProgressBarProps>) => <ProgressBar completion={50} label="Uploading" {...props} />;
const bar = () => screen.getByRole('progressbar');
const container = () => document.querySelector('[data-pttrn="progress-bar"]') as HTMLElement;

describe('ProgressBar (RTL)', () => {
    it('renders', () => {
        render(<Subject />);

        expect(screen.getByText('Uploading')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-label': () => {
        render(<Subject />);

        expect(bar()).toHaveAccessibleName('Uploading');
        expect(bar().tagName).toBe('PROGRESS');
        expect(screen.getByText('Uploading').tagName).toBe('LABEL');
    },
    value: () => {
        const { rerender } = render(<Subject completion={42.4} />);
        expect(bar()).toHaveAttribute('aria-valuenow', '42');
        expect(bar()).toHaveAttribute('value', '42');
        expect(bar()).toHaveAttribute('max', '100');
        expect(bar()).toHaveAttribute('aria-valuemin', '0');
        expect(bar()).toHaveAttribute('aria-valuemax', '100');
        expect(container().querySelector('[data-bar]')).toHaveAttribute('aria-hidden', 'true');
        expect(container().querySelector('[data-bar]')).toHaveStyle({ '--width': '42%' });

        rerender(<Subject completion={0} />);
        expect(bar()).toHaveAttribute('aria-valuenow', '0');
    },
    clamps: () => {
        const { rerender } = render(<Subject completion={-20} />);
        expect(bar()).toHaveAttribute('aria-valuenow', '0');

        rerender(<Subject completion={250} />);
        expect(bar()).toHaveAttribute('aria-valuenow', '100');
    },
    busy: () => {
        const { rerender } = render(<Subject completion={99} />);
        expect(bar()).toHaveAttribute('aria-busy', 'true');

        rerender(<Subject completion={100} />);
        expect(bar()).toHaveAttribute('aria-busy', 'false');
    },
    layout: () => {
        const { rerender } = render(<Subject />);
        expect(container()).toHaveAttribute('data-size', 'large');
        expect(container()).toHaveAttribute('data-align', 'center');

        rerender(<Subject align="left" size="small" />);
        expect(container()).toHaveAttribute('data-size', 'small');
        expect(container()).toHaveAttribute('data-align', 'left');
    },
    success: () => {
        const { rerender } = render(<Subject completion={100} />);
        expect(container()).not.toHaveAttribute('data-success');

        rerender(<Subject completion={100} successColor />);
        expect(container()).toHaveAttribute('data-success', 'color');

        rerender(<Subject completion={99} successColor />);
        expect(container()).not.toHaveAttribute('data-success');

        rerender(<Subject completion={100} successHidden />);
        expect(container()).toBeNull();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    },
    'axe-clean': async () => {
        await hasNoBasicA11yIssues(<Subject />)();
        await hasNoBasicA11yIssues(<Subject align="left" completion={100} size="small" />)();
    },
});
