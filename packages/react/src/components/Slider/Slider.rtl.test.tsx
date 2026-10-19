import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Slider, SliderProps, SliderValue } from './Slider';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const knob = (name: string) => screen.getByRole('slider', { name });

/** The slider is controlled, so a test that moves it twice needs a parent that keeps the value. */
function Stateful<V extends SliderValue>({ onChange, value: initial, ...props }: SliderProps<V>) {
    const [value, setValue] = useState(initial);
    return (
        <Slider
            {...props}
            onChange={(next) => {
                setValue(next);
                onChange(next);
            }}
            value={value}
        />
    );
}
const input = () => document.querySelector('input[type="hidden"]') as HTMLInputElement;

describe('Slider (RTL)', () => {
    it('renders', () => {
        render(<Slider label="Volume" max={100} min={0} name="volume" onChange={() => {}} value={5} />);

        expect(screen.getByText('Volume')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-values': () => {
        render(
            <Slider
                formatNumber={(n) => `${n}%`}
                label="Volume"
                max={100}
                min={0}
                name="volume"
                onChange={() => {}}
                value={40}
            />,
        );

        expect(screen.getByText('Volume')).toBeInTheDocument();
        expect(document.querySelector('[data-value-label]')).toHaveTextContent('40%');
        expect(document.querySelector('[data-min-label]')).toHaveTextContent('0%');
        expect(document.querySelector('[data-max-label]')).toHaveTextContent('100%');
    },
    'exposes-value': () => {
        render(<Slider label="Volume" max={100} min={0} name="volume" onChange={() => {}} value={40} />);

        const volume = knob('Volume');
        expect(volume).toHaveAttribute('aria-valuemin', '0');
        expect(volume).toHaveAttribute('aria-valuemax', '100');
        expect(volume).toHaveAttribute('aria-valuenow', '40');
        expect(volume).toHaveAttribute('aria-valuetext', '40');
    },
    controlled: () => {
        const { rerender } = render(
            <Slider label="Volume" max={100} min={0} name="volume" onChange={() => {}} value={40} />,
        );
        expect(knob('Volume')).toHaveAttribute('aria-valuenow', '40');

        rerender(<Slider label="Volume" max={100} min={0} name="volume" onChange={() => {}} value={70} />);
        expect(knob('Volume')).toHaveAttribute('aria-valuenow', '70');
        expect(input()).toHaveValue('70');
    },
    'arrow-keys': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Stateful label="Volume" max={100} min={0} name="volume" onChange={onChange} step={5} value={90} />);

        knob('Volume').focus();
        await user.keyboard('{ArrowRight}');
        expect(onChange).toHaveBeenLastCalledWith(95);
        await user.keyboard('{ArrowLeft}');
        expect(onChange).toHaveBeenLastCalledWith(90);

        await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
        expect(onChange).toHaveBeenLastCalledWith(100);
        expect(knob('Volume')).toHaveAttribute('aria-valuenow', '100');
    },
    range: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Stateful label="Price" max={100} min={0} name="price" onChange={onChange} value={[20, 60]} />);

        expect(input()).toHaveValue('20,60');
        expect(document.querySelector('[data-value-label]')).toHaveTextContent('20 - 60');

        knob('Price start').focus();
        await user.keyboard('{ArrowRight}');
        expect(onChange).toHaveBeenLastCalledWith([21, 60]);

        knob('Price end').focus();
        await user.keyboard('{ArrowLeft}');
        expect(onChange).toHaveBeenLastCalledWith([21, 59]);
    },
    disabled: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Slider disabled label="Volume" max={100} min={0} name="volume" onChange={onChange} value={40} />);

        expect(knob('Volume')).toHaveAttribute('tabindex', '-1');
        knob('Volume').focus();
        await user.keyboard('{ArrowRight}');
        expect(onChange).not.toHaveBeenCalled();
    },
    'read-only': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Slider label="Volume" max={100} min={0} name="volume" onChange={onChange} readOnly value={40} />);

        expect(knob('Volume')).toHaveAttribute('tabindex', '0');
        knob('Volume').focus();
        await user.keyboard('{ArrowRight}');
        expect(onChange).not.toHaveBeenCalled();
    },
    'hidden-input': () => {
        render(<Slider label="Volume" max={100} min={0} name="volume" onChange={() => {}} value={40} />);

        expect(input()).toHaveAttribute('name', 'volume');
        expect(input()).toHaveValue('40');
    },
    'axe-clean': async () => {
        await hasNoBasicA11yIssues(
            <Slider label="Volume" max={100} min={0} name="volume" onChange={() => {}} value={5} />,
        )();
        await hasNoBasicA11yIssues(
            <Slider label="Price" marks max={10} min={0} name="price" onChange={() => {}} value={[2, 6]} />,
        )();
    },
});
