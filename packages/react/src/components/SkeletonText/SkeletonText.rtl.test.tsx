import { SkeletonText } from './SkeletonText';
import { presets } from './SkeletonTextExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const skeleton = () => document.querySelector('[data-pttrn="skeleton-text"]') as HTMLElement | null;
const lines = () => document.querySelectorAll('[data-line]');

describe('SkeletonText (RTL)', () => {
    it('renders', () => {
        render(<SkeletonText {...presets[0].propState} />);

        expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'shows-lines': () => {
        render(<SkeletonText lines={4} variant="heading-h3" />);

        expect(lines()).toHaveLength(4);
        expect(skeleton()?.style.getPropertyValue('--text-height')).not.toBe('');
    },
    'at-least-one-line': () => {
        render(<SkeletonText lines={0} />);

        expect(lines()).toHaveLength(1);
    },
    'announces-loading': () => {
        render(<SkeletonText />);

        const status = screen.getByRole('status', { name: 'Loading' });
        expect(status).toBe(skeleton());
        expect(status).toHaveAttribute('aria-busy', 'true');
    },
    'shows-content': () => {
        render(
            <SkeletonText>
                <p>Loaded</p>
            </SkeletonText>,
        );

        expect(screen.getByText('Loaded')).toBeInTheDocument();
        expect(skeleton()).toBeNull();
    },
    'axe-clean': async () => {
        for (const preset of presets) await hasNoBasicA11yIssues(<SkeletonText {...preset.propState} />)();
    },
});
