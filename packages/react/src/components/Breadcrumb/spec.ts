import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Breadcrumb',
    summary:
        'The trail to the current page: links to its ancestors, the current page as plain text, long trails folded.',
    anatomy: [
        {
            part: 'nav',
            role: 'navigation',
            description: 'A nav landmark labelled "Breadcrumb" holding an ordered list.',
        },
        {
            part: 'crumbs',
            role: 'link',
            description: 'Every page but the last, as a small Link followed by a chevron.',
        },
        {
            part: 'overflow',
            role: 'button',
            description: 'With more than five pages, the middle ones fold into a "Show N more pages" menu button.',
        },
        { part: 'overflow menu', role: 'menu', description: 'The folded pages as menuitem links.' },
        { part: 'current', description: 'The last page as text, aria-current, not a link.' },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Moves through the links and the overflow button.' },
        {
            keys: ['Enter', 'Space', 'ArrowDown'],
            description: 'On the overflow button, open the menu and focus its first page.',
        },
        { keys: ['ArrowDown', 'ArrowUp'], description: 'Move through the folded pages, wrapping at the ends.' },
        { keys: ['Escape'], description: 'Closes the menu and returns focus to the button.' },
    ],
    accessibility: {
        roles: 'A navigation landmark with an ordered list. Ancestors are links; the current page is a list item with aria-current. The overflow control is a button with aria-haspopup menu, aria-expanded and aria-controls naming a role menu of menuitem links.',
        labels: 'The landmark is named "Breadcrumb". The overflow button reads "Show N more pages" from its tooltip and the menu is labelled "N more pages". Chevrons are aria-hidden.',
        focus: 'Opening the menu moves focus to its first page; Escape returns it to the button; a click outside or tabbing away closes the menu.',
        targetSize: 24,
    },
    behaviors: [
        { id: 'needs-two', description: 'Fewer than two items renders nothing.' },
        { id: 'landmark', description: 'The trail is a navigation landmark named "Breadcrumb" with an ordered list.' },
        {
            id: 'links-and-current',
            description: 'Every item but the last is a link to its href; the last is plain text marked aria-current.',
        },
        {
            id: 'overflow-menu',
            description: 'More than five items fold the middle ones into a menu button whose menu lists them as links.',
        },
        {
            id: 'overflow-keyboard',
            description:
                'ArrowDown opens the menu on its first page, the arrows move focus, Escape closes and refocuses the button.',
        },
        { id: 'axe-clean', description: 'Every preset passes axe-core, with the overflow menu open too.' },
    ],
};
