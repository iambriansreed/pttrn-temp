import { Menu } from './Menu';
import { spec } from './spec';
import { ListItem } from '-/components/ListItem';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const menu = () => document.querySelector('[data-pttrn-utility="menu"]') as HTMLElement;

describe('Menu (RTL)', () => {
    it('renders', () => {
        render(<Menu label="Example label">Menu Children</Menu>);

        expect(screen.getByText('Menu Children')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-children': () => {
        render(
            <Menu>
                <ListItem label="First" />
                <ListItem label="Second" />
            </Menu>,
        );

        expect(menu()).toContainElement(screen.getByText('First'));
        expect(menu()).toContainElement(screen.getByText('Second'));
    },
    labelled: () => {
        render(
            <Menu label="Account" role="menu">
                <ListItem label="Profile" role="menuitem" />
            </Menu>,
        );

        expect(screen.getByRole('menu', { name: 'Account' })).toBe(menu());
    },
    'as-element': () => {
        render(
            <Menu as="nav" label="Site">
                <ListItem href="#home" label="Home" />
            </Menu>,
        );

        expect(menu().tagName).toBe('NAV');
    },
    width: () => {
        render(<Menu width="240px">Content</Menu>);

        expect(menu()).toHaveStyle({ width: '240px' });
    },
    'axe-clean': hasNoBasicA11yIssues(
        <Menu label="Account" role="menu">
            <ListItem label="Profile" role="menuitem" />
            <ListItem label="Settings" role="menuitem" />
        </Menu>,
    ),
});
