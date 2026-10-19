import { Divider } from './Divider';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render } from '-/rtl/util';

const divider = () => document.querySelector('[data-pttrn="divider"]') as HTMLElement;

describe('Divider (RTL)', () => {
    it('is hidden from assistive technology', () => {
        render(<Divider />);

        expect(divider()).toHaveAttribute('aria-hidden', 'true');
    });
});

describeBehaviors(spec, {
    'horizontal-by-default': () => {
        render(<Divider />);

        expect(divider()).toHaveAttribute('data-orientation', 'horizontal');
        expect(divider()).toHaveAttribute('aria-orientation', 'horizontal');
        expect(divider()).toHaveAttribute('data-thickness', 'light');
        expect(divider()).not.toHaveAttribute('data-hide-padding');
    },
    vertical: () => {
        render(<Divider orientation="vertical" />);

        expect(divider()).toHaveAttribute('data-orientation', 'vertical');
        expect(divider()).toHaveAttribute('aria-orientation', 'vertical');
    },
    'thickness-and-padding': () => {
        render(<Divider padding={false} thickness="heavy" />);

        expect(divider()).toHaveAttribute('data-thickness', 'heavy');
        expect(divider()).toHaveAttribute('data-hide-padding');
    },
    inset: () => {
        const { rerender } = render(<Divider inset={4} />);
        expect(divider()).toHaveStyle({ '--inset': 'calc(var(--usa-spacing-05) * 4)' });

        rerender(<Divider />);
        expect(divider()).toHaveStyle({ '--inset': '0px' });

        rerender(<Divider inset={13 as 12} />);
        expect(divider()).toHaveStyle({ '--inset': '0px' });
    },
    'axe-clean': async () => {
        await hasNoBasicA11yIssues(<Divider />)();
        await hasNoBasicA11yIssues(<Divider orientation="vertical" />)();
    },
});
