import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { Fab } from './Fab';
import { FabExample } from './FabExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const icon = <svg data-testid="icon" />;
const fab = () => document.querySelector('[data-pttrn="fab"]') as HTMLElement;
const tooltip = () => document.querySelector('[role="tooltip"]') as HTMLElement | null;

describe('Fab (RTL)', () => {
    it('renders', () => {
        render(<Fab label="Example label" placement="bottom-right" variant="neutral" />);

        expect(screen.getByLabelText('Example label')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'labelled-button': () => {
        const { rerender } = render(<Fab label="Compose" />);
        expect(screen.getByRole('button', { name: 'Compose' })).toBe(fab());
        expect(fab()).toHaveTextContent('Compose');

        rerender(<Fab aria-label="Write a message" label="Compose" />);
        expect(screen.getByRole('button', { name: 'Write a message' })).toBe(fab());
    },
    icon: () => {
        const { rerender } = render(<Fab icon={icon} label="Compose" />);
        expect(fab().querySelector('[data-fab-icon]')).toHaveAttribute('aria-hidden', 'true');
        expect(fab().querySelector('[data-fab-icon]')).toContainElement(screen.getByTestId('icon'));
        expect(fab().querySelector('[data-fab-label]')).toHaveTextContent('Compose');
        expect(fab()).not.toHaveAttribute('data-round');

        rerender(<Fab icon={icon} iconOnly label="Compose" />);
        expect(fab().querySelector('[data-fab-label]')).toBeNull();
        expect(fab()).toHaveAttribute('data-round');

        rerender(<Fab iconOnly label="Compose" />);
        expect(fab().querySelector('[data-fab-label]')).toHaveTextContent('Compose');
        expect(fab()).not.toHaveAttribute('data-round');
    },
    tooltip: () => {
        const { rerender } = render(<Fab label="Compose" tooltip="Write a message" />);
        expect(tooltip()).toHaveTextContent('Write a message');
        expect(screen.getByRole('button', { name: 'Compose' })).toHaveAttribute('aria-describedby', tooltip()!.id);
        expect(fab()).not.toHaveAttribute('aria-labelledby');

        rerender(<Fab icon={icon} iconOnly label="Compose" />);
        expect(tooltip()).toHaveTextContent('Compose');
        expect(screen.getByRole('button', { name: 'Compose' })).toHaveAttribute('aria-labelledby', tooltip()!.id);
        expect(fab()).not.toHaveAttribute('aria-describedby');

        rerender(<Fab label="Compose" />);
        expect(tooltip()).toBeNull();
    },
    click: async () => {
        const user = userEvent.setup();
        const onClick = jest.fn();
        render(<Fab label="Compose" onClick={onClick} />);

        await user.click(screen.getByRole('button', { name: 'Compose' }));
        expect(onClick).toHaveBeenCalledTimes(1);
    },
    placement: () => {
        const { rerender } = render(<Fab label="Compose" />);
        expect(fab()).toHaveAttribute('data-placement', 'bottom-right');
        expect(fab()).toHaveAttribute('data-container', 'local');
        expect(fab()).toHaveAttribute('data-position', 'absolute');

        rerender(<Fab container="page" label="Compose" placement="top-left" />);
        expect(fab()).toHaveAttribute('data-placement', 'top-left');
        expect(fab()).toHaveAttribute('data-container', 'page');
        expect(fab()).toHaveAttribute('data-position', 'fixed');
    },
    'as-element': () => {
        render(<Fab as="a" href="#compose" label="Compose" />);

        expect(screen.getByRole('link', { name: 'Compose' })).toHaveAttribute('href', '#compose');
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    },
    variants: () => {
        const { rerender } = render(<Fab label="Compose" />);
        expect(fab()).toHaveAttribute('data-size', 'medium');
        expect(fab()).toHaveAttribute('data-variant', 'primary');

        rerender(<Fab label="Compose" size="x-large" variant="secondary" />);
        expect(fab()).toHaveAttribute('data-size', 'x-large');
        expect(fab()).toHaveAttribute('data-variant', 'secondary');
    },
    'axe-clean': async () => {
        for (const preset of FabExample.presets ?? []) await hasNoBasicA11yIssues(<Fab {...preset.propState} />)();
        await hasNoBasicA11yIssues(<Fab icon={icon} iconOnly label="Compose" />)();
    },
});
