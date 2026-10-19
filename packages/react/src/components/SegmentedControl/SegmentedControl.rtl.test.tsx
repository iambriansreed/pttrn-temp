import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { SegmentedControl, SegmentedControlProps } from './SegmentedControl';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const icon = <svg data-testid="icon" />;
const OPTIONS = [
    { value: 'list', label: 'List' },
    { value: 'grid', label: 'Grid' },
    { value: 'map', label: 'Map' },
];
const WITH_ICONS = OPTIONS.map((option) => ({ ...option, icon }));
const Subject = (props: Partial<SegmentedControlProps>) => (
    <SegmentedControl label="View" onChange={() => {}} options={OPTIONS} value="list" {...props} />
);
const tab = (name: string) => screen.getByRole('tab', { name });

describe('SegmentedControl (RTL)', () => {
    it('renders', () => {
        render(<Subject />);

        expect(screen.getByLabelText('View')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-segments': () => {
        render(<Subject />);

        expect(screen.getByRole('tablist', { name: 'View' })).toHaveAttribute('data-pttrn', 'segmented-control');
        expect(screen.getAllByRole('tab')).toHaveLength(3);
    },
    'selected-segment': () => {
        render(<Subject value="grid" />);

        expect(tab('Grid')).toHaveAttribute('aria-selected', 'true');
        expect(tab('List')).toHaveAttribute('aria-selected', 'false');
    },
    'click-selects': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        await user.click(tab('Map'));
        expect(onChange).toHaveBeenCalledWith('map');
    },
    'icons-only': () => {
        render(<Subject iconsOnly options={WITH_ICONS} />);

        expect(document.querySelectorAll('[role="tab"] [data-label]')).toHaveLength(0);
        expect(tab('Grid')).toBeInTheDocument();
        expect(screen.getAllByTestId('icon')[0].parentElement).toHaveAttribute('aria-hidden', 'true');
    },
    'arrow-keys': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        await user.tab();
        expect(tab('List')).toHaveFocus();
        await user.keyboard('{ArrowRight}');
        await user.keyboard('{Enter}');
        expect(onChange).toHaveBeenLastCalledWith('grid');
        await user.keyboard('{ArrowLeft}{ArrowLeft}');
        await user.keyboard(' ');
        expect(onChange).toHaveBeenLastCalledWith('map');
    },
    'axe-clean': async () => {
        await hasNoBasicA11yIssues(<Subject />)();
        await hasNoBasicA11yIssues(<Subject iconsOnly options={WITH_ICONS} />)();
    },
});
