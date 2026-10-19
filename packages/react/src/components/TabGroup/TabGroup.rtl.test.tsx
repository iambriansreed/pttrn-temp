import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { TabGroup, TabGroupProps } from './TabGroup';
import { presets } from './TabGroupExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const OPTIONS = [
    { value: '1', label: 'First' },
    { value: '2', label: 'Second', disabled: true },
    { value: '3', label: 'Third' },
];

const Subject = (props: Partial<TabGroupProps>) => (
    <TabGroup label="Sections" onChange={() => {}} options={OPTIONS} value="1" {...props} />
);

const tab = (name: string) => screen.getByRole('tab', { name });
const active = () => document.querySelector('[role="tab"][data-active]');

describe('TabGroup (RTL)', () => {
    it('renders', () => {
        render(<TabGroup onChange={() => {}} {...presets[0].propState} />);

        expect(screen.getByLabelText(presets[0].propState.label)).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-tabs': () => {
        render(<Subject />);

        const list = screen.getByRole('tablist', { name: 'Sections' });
        expect(list).toHaveAttribute('data-pttrn', 'tab-group');
        expect(screen.getAllByRole('tab')).toHaveLength(3);
    },
    'selected-tab': () => {
        render(<Subject value="3" />);

        expect(tab('Third')).toHaveAttribute('aria-selected', 'true');
        expect(tab('First')).toHaveAttribute('aria-selected', 'false');
    },
    'click-selects': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        await user.click(tab('Third'));
        expect(onChange).toHaveBeenCalledWith('3');
    },
    'disabled-tab': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        expect(tab('Second')).toHaveAttribute('aria-disabled', 'true');
        await user.click(tab('Second'));
        expect(onChange).not.toHaveBeenCalled();
    },
    'arrow-keys': async () => {
        const user = userEvent.setup();
        render(<Subject />);

        await user.tab();
        expect(tab('First')).toHaveFocus();
        expect(tab('First')).toHaveAttribute('tabindex', '0');
        expect(tab('Third')).toHaveAttribute('tabindex', '-1');

        await user.keyboard('{ArrowRight}');
        expect(active()).toBe(tab('Third'));
        expect(tab('Third')).toHaveAttribute('tabindex', '0');

        await user.keyboard('{ArrowRight}');
        expect(active()).toBe(tab('First'));

        await user.keyboard('{ArrowLeft}');
        expect(active()).toBe(tab('Third'));
    },
    'enter-space-select': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        await user.tab();
        await user.keyboard('{ArrowRight}');
        await user.keyboard('{Enter}');
        expect(onChange).toHaveBeenLastCalledWith('3');

        await user.keyboard('{ArrowLeft}');
        await user.keyboard(' ');
        expect(onChange).toHaveBeenLastCalledWith('1');
    },
    'needs-two': () => {
        render(<Subject options={[OPTIONS[0]]} />);

        expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    },
    badge: () => {
        render(<Subject options={[{ ...OPTIONS[0], badge: 4 }, OPTIONS[2]]} />);

        expect(tab('First 4')).toContainElement(screen.getByText('4'));
    },
    'axe-clean': async () => {
        for (const preset of presets) {
            await hasNoBasicA11yIssues(<TabGroup onChange={() => {}} {...preset.propState} />)();
        }
    },
});
