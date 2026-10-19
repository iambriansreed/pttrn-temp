import { Skeleton } from './Skeleton';
import { presets } from './SkeletonExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const skeleton = () => document.querySelector('[data-pttrn="skeleton"]') as HTMLElement | null;

describe('Skeleton (RTL)', () => {
    it('renders', () => {
        render(<Skeleton {...presets[0].propState} />);

        expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'shows-placeholder': () => {
        render(<Skeleton />);

        const status = screen.getByRole('status', { name: 'Loading' });
        expect(status).toBe(skeleton());
        expect(status).toHaveAttribute('aria-busy', 'true');
    },
    size: () => {
        const { rerender } = render(<Skeleton height={40} width={200} />);
        expect(skeleton()).toHaveStyle({ '--width': '200px', '--height': '40px' });

        rerender(<Skeleton height="4rem" width="50%" />);
        expect(skeleton()).toHaveStyle({ '--width': '50%', '--height': '4rem' });
    },
    variant: () => {
        const { rerender } = render(<Skeleton />);
        expect(skeleton()).toHaveAttribute('data-variant', 'rectangular');

        rerender(<Skeleton variant="circular" />);
        expect(skeleton()).toHaveAttribute('data-variant', 'circular');
    },
    'shows-content': () => {
        render(
            <Skeleton>
                <p>Loaded</p>
            </Skeleton>,
        );

        expect(screen.getByText('Loaded')).toBeInTheDocument();
        expect(skeleton()).toBeNull();
    },
    'axe-clean': async () => {
        for (const preset of presets) await hasNoBasicA11yIssues(<Skeleton {...preset.propState} />)();
    },
});
