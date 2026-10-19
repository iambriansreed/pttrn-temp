import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { ListItem } from './ListItem';
import { presets as presetsFor } from './ListItemExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const presets = presetsFor(() => {});
const item = () => document.querySelector('[data-pttrn="list-item"]') as HTMLElement;

describe('ListItem (RTL)', () => {
    it('renders', () => {
        render(<ListItem {...presets[0].propState} />);

        expect(screen.getByText(presets[0].propState.label)).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-label': () => {
        render(<ListItem label="File 13" subText="Last modified: Jan 21, 2024" />);

        expect(item()).toHaveTextContent('File 13');
        expect(item().querySelector('[data-sub-text]')).toHaveTextContent('Last modified: Jan 21, 2024');
        expect(item()).not.toHaveAttribute('role');
        expect(item()).toHaveAttribute('tabindex', '-1');
    },
    'leading-trailing': () => {
        render(<ListItem label="File" leading={<i data-testid="lead" />} trailing={<b data-testid="trail" />} />);

        expect(item().querySelector('[data-leading]')).toContainElement(screen.getByTestId('lead'));
        expect(item().querySelector('[data-trailing]')).toContainElement(screen.getByTestId('trail'));
    },
    clickable: async () => {
        const user = userEvent.setup();
        const onClick = jest.fn();
        render(<ListItem label="Open" onClick={onClick} />);

        const button = screen.getByRole('button', { name: 'Open' });
        expect(button).toHaveAttribute('tabindex', '0');
        await user.click(button);
        await user.keyboard('{Enter}');
        await user.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(3);
    },
    link: () => {
        render(<ListItem href="/files/13" label="File 13" />);

        const link = screen.getByRole('link', { name: 'File 13' });
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href', '/files/13');
    },
    'disabled-readonly': async () => {
        const user = userEvent.setup();
        const onClick = jest.fn();
        const { rerender } = render(<ListItem disabled label="Open" onClick={onClick} />);
        expect(item()).toHaveAttribute('data-disabled');
        expect(item()).not.toHaveAttribute('data-action');
        await user.click(item());
        expect(onClick).not.toHaveBeenCalled();

        rerender(<ListItem label="Open" onClick={onClick} readOnly />);
        expect(item()).toHaveAttribute('data-readonly');
        await user.click(item());
        expect(onClick).not.toHaveBeenCalled();
    },
    'role-override': () => {
        render(<ListItem aria-selected={false} label="Option A" onClick={() => {}} role="option" />);

        expect(screen.getByRole('option', { name: 'Option A' })).toBe(item());
    },
    'empty-label': () => {
        const { container } = render(<ListItem label="" />);

        expect(container).toBeEmptyDOMElement();
    },
    'axe-clean': async () => {
        for (const preset of presets) await hasNoBasicA11yIssues(<ListItem {...preset.propState} />)();
    },
});
