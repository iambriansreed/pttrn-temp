import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { Rating } from './Rating';
import { presets } from './RatingExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { cleanup, render, screen } from '-/rtl/util';

const stars = () => Array.from(document.querySelectorAll<HTMLElement>('[data-pttrn="rating"] > [data-star]'));
const radio = (n: number) => screen.getByRole('radio', { name: `Rate ${n}` });

describe('Rating (RTL)', () => {
    it('renders', () => {
        render(<Rating {...presets[0].propState} />);

        expect(screen.getByLabelText('Rating')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'read-only-image': () => {
        render(<Rating value={4.5} />);
        expect(screen.getByRole('img', { name: '4.5 out of 5 stars' })).toHaveAttribute('data-pttrn', 'rating');
        expect(screen.queryByRole('radio')).not.toBeInTheDocument();

        cleanup();
        render(<Rating />);
        expect(screen.getByRole('img', { name: 'Rating' })).toBeInTheDocument();
    },
    fills: () => {
        render(<Rating value={4.5} />);
        expect(stars().map((star) => star.getAttribute('data-fill'))).toEqual(['full', 'full', 'full', 'full', 'half']);

        cleanup();
        render(<Rating value={2} />);
        expect(stars().map((star) => star.getAttribute('data-fill'))).toEqual(['full', 'full', null, null, null]);
    },
    radiogroup: () => {
        render(<Rating onChange={() => {}} value={3} />);
        expect(screen.getByRole('radiogroup', { name: '3 out of 5 stars' })).toBeInTheDocument();
        expect(screen.getAllByRole('radio').map((star) => star.getAttribute('aria-label'))).toEqual([
            'Rate 1',
            'Rate 2',
            'Rate 3',
            'Rate 4',
            'Rate 5',
        ]);
        expect(radio(3)).toBeChecked();
        expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(1);

        cleanup();
        render(<Rating onChange={() => {}} />);
        expect(screen.getByRole('radiogroup', { name: 'Select a star rating' })).toBeInTheDocument();
        expect(screen.queryAllByRole('radio', { checked: true })).toHaveLength(0);
    },
    choose: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Rating onChange={onChange} />);

        await user.click(radio(4));
        expect(onChange).toHaveBeenCalledWith(4);
        expect(radio(4)).toBeChecked();
        expect(screen.getByRole('radiogroup', { name: '4 out of 5 stars' })).toBeInTheDocument();
    },
    keyboard: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Rating onChange={onChange} />);

        await user.tab();
        expect(radio(1)).toHaveFocus();
        expect(stars().map((star) => star.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1', '-1']);

        await user.keyboard('{ArrowRight}');
        expect(onChange).toHaveBeenLastCalledWith(1);
        await user.keyboard('{ArrowRight}');
        expect(onChange).toHaveBeenLastCalledWith(2);
        expect(radio(2)).toBeChecked();
        expect(radio(2)).toHaveFocus();
        expect(stars().map((star) => star.getAttribute('tabindex'))).toEqual(['-1', '0', '-1', '-1', '-1']);

        await user.keyboard('{ArrowLeft}');
        expect(onChange).toHaveBeenLastCalledWith(1);
        expect(radio(1)).toHaveFocus();
        await user.keyboard('{ArrowLeft}');
        expect(onChange).toHaveBeenLastCalledWith(1);
    },
    sizes: () => {
        const { rerender } = render(<Rating value={3} />);
        expect(screen.getByRole('img')).toHaveAttribute('data-size', 'medium');

        rerender(<Rating size="large" value={3} />);
        expect(screen.getByRole('img')).toHaveAttribute('data-size', 'large');
    },
    'axe-clean': async () => {
        for (const preset of presets) await hasNoBasicA11yIssues(<Rating {...preset.propState} />)();
    },
});
