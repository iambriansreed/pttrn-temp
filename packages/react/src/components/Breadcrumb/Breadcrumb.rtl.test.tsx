import userEvent from '@testing-library/user-event';
import { Breadcrumb } from './Breadcrumb';
import { presets } from './BreadcrumbExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { cleanup, render, screen, waitFor } from '-/rtl/util';

const trail = (count: number) =>
    Array.from({ length: count }, (_, index) => ({ label: `Item ${index + 1}`, href: `#link-${index + 1}` }));
const overflow = () => screen.getByRole('button', { name: /more pages/ });

describe('Breadcrumb (RTL)', () => {
    it('renders', () => {
        render(<Breadcrumb {...presets[1].propState} />);

        expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'needs-two': () => {
        const { container } = render(<Breadcrumb items={trail(1)} />);

        expect(container).toBeEmptyDOMElement();
    },
    landmark: () => {
        render(<Breadcrumb items={trail(3)} />);

        const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
        expect(nav).toHaveAttribute('data-pttrn', 'breadcrumb');
        expect(nav.querySelector('ol')).toBeInTheDocument();
        expect(screen.getAllByRole('listitem')).toHaveLength(3);
    },
    'links-and-current': () => {
        render(<Breadcrumb items={trail(3)} />);

        expect(screen.getByRole('link', { name: 'Item 1' })).toHaveAttribute('href', '#link-1');
        expect(screen.getByRole('link', { name: 'Item 2' })).toHaveAttribute('href', '#link-2');
        expect(screen.queryByRole('link', { name: 'Item 3' })).not.toBeInTheDocument();
        const current = screen.getByText('Item 3').closest('li');
        expect(current).toHaveAttribute('aria-current', 'true');
    },
    'overflow-menu': async () => {
        const user = userEvent.setup();
        render(<Breadcrumb items={trail(7)} />);

        expect(screen.getAllByRole('link')).toHaveLength(1);
        expect(overflow()).toHaveAccessibleName('Show 5 more pages');
        expect(overflow()).toHaveAttribute('aria-haspopup', 'menu');
        expect(overflow()).toHaveAttribute('aria-expanded', 'false');

        await user.click(overflow());
        const menu = await screen.findByRole('menu', { name: '5 more pages' });
        expect(overflow()).toHaveAttribute('aria-expanded', 'true');
        expect(overflow()).toHaveAttribute('aria-controls', menu.id);
        const items = screen.getAllByRole('menuitem');
        expect(items.map((item) => item.textContent)).toEqual(['Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6']);
        expect(items[0]).toHaveAttribute('href', '#link-2');
    },
    'overflow-keyboard': async () => {
        const user = userEvent.setup();
        render(<Breadcrumb items={trail(7)} />);

        overflow().focus();
        await user.keyboard('{ArrowDown}');
        await screen.findByRole('menu');
        const [first, second] = screen.getAllByRole('menuitem');
        await waitFor(() => expect(first).toHaveFocus());

        await user.keyboard('{ArrowDown}');
        await waitFor(() => expect(second).toHaveFocus());
        await user.keyboard('{ArrowUp}');
        await waitFor(() => expect(first).toHaveFocus());

        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
        expect(overflow()).toHaveFocus();
    },
    'axe-clean': async () => {
        for (const preset of presets) await hasNoBasicA11yIssues(<Breadcrumb {...preset.propState} />)();
        cleanup();

        const user = userEvent.setup();
        render(<Breadcrumb items={trail(7)} />);
        await user.click(overflow());
        await screen.findByRole('menu');
        await hasNoBasicA11yIssues(<Breadcrumb items={trail(7)} />)();
    },
});
