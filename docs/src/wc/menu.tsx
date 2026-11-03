import '@ptrn/web/Avatar';
import '@ptrn/web/Divider';
import '@ptrn/web/ListItem';
import '@ptrn/web/Menu';
import '@ptrn/web/Switch';
import accountCircle from '@ptrn/icons/AccountCircle.svg?raw';
import darkMode from '@ptrn/icons/DarkMode.svg?raw';
import darkModeFill from '@ptrn/icons/DarkModeFill.svg?raw';
import help from '@ptrn/icons/Help.svg?raw';
import license from '@ptrn/icons/License.svg?raw';
import logout from '@ptrn/icons/Logout.svg?raw';
import menuBook from '@ptrn/icons/MenuBook.svg?raw';
import settings from '@ptrn/icons/Settings.svg?raw';
import { MenuProps } from '@ptrn/react/Menu';
import { ComponentType, useEffect, useRef } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { updateComponentContext } from 'src/components/ComponentProvider';
import { action } from 'src/utils/actions';
import { WebComponentDemo } from 'src/wc/types';

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** A raw `@ptrn/icons` SVG in a list item's `leading` slot. */
const leading = (svg: string) => svg.trim().replace('<svg', '<svg slot="leading" aria-hidden="true"');

type DemoProps = Partial<MenuProps> & { 'data-dark-mode'?: boolean };

/** The menu the React demo renders (MenuExample.tsx), as HTML, for a given dark mode switch state. */
function menuItems(darkModeOn: boolean) {
    return `<pttrn-list-item label="Michael Scott" sub-text="michael.scott@email.com">
    <pttrn-avatar slot="leading" image="/avatar-01.png" name="Michael Scott"></pttrn-avatar>
</pttrn-list-item>
<pttrn-divider inset="2"></pttrn-divider>
<pttrn-list-item href="#/my-profile" label="My profile">${leading(accountCircle)}</pttrn-list-item>
<pttrn-list-item href="#/settings" label="Settings">${leading(settings)}</pttrn-list-item>
<pttrn-list-item label="Dark mode">
    ${leading(darkModeOn ? darkModeFill : darkMode)}
    <pttrn-switch slot="trailing" aria-label="Toggle dark mode" name="dark-mode" value="dark-mode"${darkModeOn ? ' checked' : ''}></pttrn-switch>
</pttrn-list-item>
<pttrn-divider inset="2" hide-padding></pttrn-divider>
<pttrn-list-item href="#/guide-tutorial" label="Guide and tutorial">${leading(menuBook)}</pttrn-list-item>
<pttrn-list-item href="#/help-center" label="Help center">${leading(help)}</pttrn-list-item>
<pttrn-divider inset="2"></pttrn-divider>
<pttrn-list-item href="#/go-premium" label="Go premium">${leading(license)}</pttrn-list-item>
<pttrn-list-item label="Log out" role="button" clickable>${leading(logout)}</pttrn-list-item>`;
}

/** The attributes of `pttrn-menu` for the demo state. */
const menuAttributes = ({ label, role, width }: DemoProps) =>
    [
        label && `label="${escapeAttr(label)}"`,
        role && `role="${escapeAttr(String(role))}"`,
        width && `width="${escapeAttr(String(width))}"`,
        'style="padding: var(--usa-spacing-1) var(--usa-spacing-1)"',
    ]
        .filter(Boolean)
        .join(' ');

/**
 * The React demo rendered as the elements. The markup is the same HTML the generator writes, so the preview and the
 * code agree; the dark mode switch and the log out item are wired as in the React demo.
 */
function MenuWc(props: DemoProps) {
    const ref = useRef<HTMLDivElement>(null);
    const darkModeOn = !!props['data-dark-mode'];
    const html = `<pttrn-menu ${menuAttributes(props)}>${menuItems(darkModeOn)}</pttrn-menu>`;

    useEffect(() => {
        const root = ref.current;
        if (!root) return undefined;
        const onChange = (event: Event) => {
            if ((event.target as Element).localName !== 'pttrn-switch') return;
            updateComponentContext((prev: Record<string, unknown>) => ({ 'data-dark-mode': !prev['data-dark-mode'] }));
            action('Dark mode toggled');
        };
        const onClick = (event: Event) => {
            if ((event.target as Element).closest?.('pttrn-list-item[label="Log out"]')) action('Log out clicked');
        };
        root.addEventListener('pttrn-change', onChange);
        root.addEventListener('click', onClick);
        return () => {
            root.removeEventListener('pttrn-change', onChange);
            root.removeEventListener('click', onClick);
        };
    }, []);

    return <div dangerouslySetInnerHTML={{ __html: html }} ref={ref} style={{ display: 'contents' }} />;
}

/** The HTML a Web Component user writes for the current demo state. */
function menuToHtml(props: Record<string, unknown>) {
    const demo = props as DemoProps;
    return `<pttrn-menu ${menuAttributes(demo)}>\n${menuItems(!!demo['data-dark-mode'])}\n</pttrn-menu>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-menu label="Account" role="menu">
    <pttrn-list-item label="My profile" role="menuitem" clickable></pttrn-list-item>
    <pttrn-list-item label="Settings" role="menuitem" clickable></pttrn-list-item>
    <pttrn-divider></pttrn-divider>
    <pttrn-list-item label="Log out" role="menuitem" clickable></pttrn-list-item>
</pttrn-menu>`;

export const menuWc: WebComponentDemo = {
    tag: 'pttrn-menu',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. Fill the menu with `pttrn-list-item` and `pttrn-divider` elements, and give it a `role` and a `label` when the items follow a menu or listbox pattern.',
    Wrapper: MenuWc as ComponentType<any>,
    toHtml: menuToHtml,
};
