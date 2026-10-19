import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { ChipGroup } from './ChipGroup';
import { presets } from './ChipGroupExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const ITEMS = [
    { label: 'suggestion 1', onClick: () => {} },
    { label: 'suggestion 2', onClick: () => {} },
    { label: 'suggestion 3', onClick: () => {} },
];
const group = () => document.querySelector('[data-pttrn="chip-group"]') as HTMLElement;

describe('ChipGroup (RTL)', () => {
    it('renders', () => {
        render(<ChipGroup {...presets[1].propState} items={ITEMS} />);

        expect(screen.getByText('suggestion 1')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-chips': async () => {
        const user = userEvent.setup();
        const onClick = jest.fn();
        render(<ChipGroup items={[...ITEMS, { label: 'last', onClick, selected: true }]} />);

        expect(screen.getAllByRole('button')).toHaveLength(4);
        const last = screen.getByRole('button', { name: 'last' });
        expect(last).toHaveAttribute('aria-pressed', 'true');
        await user.click(last);
        expect(onClick).toHaveBeenCalledTimes(1);
    },
    overflow: () => {
        const { rerender } = render(<ChipGroup items={ITEMS} />);
        expect(group()).not.toHaveAttribute('data-scroll');

        rerender(<ChipGroup items={ITEMS} overflow="scroll" />);
        expect(group()).toHaveAttribute('data-scroll');
    },
    empty: () => {
        render(<ChipGroup />);

        expect(group()).toBeEmptyDOMElement();
    },
    'axe-clean': async () => {
        for (const preset of presets) await hasNoBasicA11yIssues(<ChipGroup {...preset.propState} items={ITEMS} />)();
    },
});
