import { SvgAccountCircle } from '@ptrn/icons/AccountCircle';
import { SvgDarkMode } from '@ptrn/icons/DarkMode';
import { SvgDarkModeFill } from '@ptrn/icons/DarkModeFill';
import { SvgHelp } from '@ptrn/icons/Help';
import { SvgLicense } from '@ptrn/icons/License';
import { SvgLogout } from '@ptrn/icons/Logout';
import { SvgMenuBook } from '@ptrn/icons/MenuBook';
import { SvgSettings } from '@ptrn/icons/Settings';

import { MenuProps } from '.';
import { Avatar } from '-/components/Avatar';
import { Divider } from '-/components/Divider';
import { ListItem } from '-/components/ListItem';
import { Switch } from '-/components/Switch';
import { ComponentExampleFn } from '-/utils/demo';

export const MenuExample: ComponentExampleFn<MenuProps & { style?: unknown; 'data-dark-mode'?: boolean }> = ({
    action,
}) => ({
    render: ({ props, Component, setState }) => {
        return (
            <Component {...props} style={{ padding: 'var(--usa-spacing-1) var(--usa-spacing-1)' }}>
                <ListItem
                    label="Michael Scott"
                    leading={<Avatar image="/avatar-01.png" name="Michael Scott" />}
                    subText="michael.scott@email.com"
                />
                <Divider inset={2} padding />
                <ListItem href="#/my-profile" label="My profile" leading={<SvgAccountCircle />} />
                <ListItem href="#/settings" label="Settings" leading={<SvgSettings />} />
                <ListItem
                    as="label"
                    label="Dark mode"
                    leading={props['data-dark-mode'] ? <SvgDarkModeFill /> : <SvgDarkMode />}
                    trailing={
                        <Switch
                            aria-label="Toggle dark mode"
                            checked={!!props['data-dark-mode']}
                            name="dark-mode"
                            onChange={() => {
                                setState((prev) => ({ 'data-dark-mode': !prev['data-dark-mode'] }));
                                action('Dark mode toggled');
                            }}
                            value="dark-mode"
                        />
                    }
                />
                <Divider inset={2} padding={false} thickness="light" />
                <ListItem href="#/guide-tutorial" label="Guide and tutorial" leading={<SvgMenuBook />} />
                <ListItem href="#/help-center" label="Help center" leading={<SvgHelp />} />
                <Divider inset={2} padding />
                <ListItem href="#/go-premium" label="Go premium" leading={<SvgLicense />} />
                <ListItem
                    label="Log out"
                    leading={<SvgLogout />}
                    onClick={() => {
                        action('Log out clicked');
                    }}
                    role="button"
                />
            </Component>
        );
    },
    variants: false,
});
