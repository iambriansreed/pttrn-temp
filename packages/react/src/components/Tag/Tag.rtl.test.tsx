import { Tag } from './Tag';
import { presets } from './TagExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const tag = () => document.querySelector('[data-pttrn="tag"]') as HTMLElement;

describe('Tag (RTL)', () => {
    it('renders', () => {
        render(<Tag {...presets[0].propState} />);

        expect(screen.getByText(presets[0].propState.label)).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-label': () => {
        render(<Tag label="Draft" />);

        expect(tag()).toHaveTextContent('Draft');
        expect(tag().tagName).toBe('SPAN');
    },
    variants: () => {
        const { rerender } = render(<Tag label="Draft" />);
        expect(tag()).toHaveAttribute('data-color', 'base');
        expect(tag()).toHaveAttribute('data-size', 'small');
        expect(tag()).toHaveAttribute('data-variant', 'flat');
        expect(tag().querySelector('[data-triangle]')).toBeNull();

        rerender(<Tag color="success" label="Draft" size="x-small" variant="corner-wrap" />);
        expect(tag()).toHaveAttribute('data-color', 'success');
        expect(tag()).toHaveAttribute('data-size', 'x-small');
        expect(tag()).toHaveAttribute('data-variant', 'corner-wrap');
        expect(tag().querySelector('[data-triangle]')).not.toBeNull();
    },
    'passes-attributes': () => {
        render(<Tag data-testid="status" id="status-tag" label="Draft" title="Not published" />);

        expect(screen.getByTestId('status')).toBe(tag());
        expect(tag()).toHaveAttribute('id', 'status-tag');
        expect(tag()).toHaveAttribute('title', 'Not published');
    },
    'axe-clean': async () => {
        for (const preset of presets) await hasNoBasicA11yIssues(<Tag {...preset.propState} />)();
    },
});
