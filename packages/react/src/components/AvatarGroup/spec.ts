import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'AvatarGroup',
    summary: 'A row of avatars, stacked or spread, that folds the rest into a "+N" menu past a maximum.',
    anatomy: [
        { part: 'group', description: 'The row, stacked (overlapping) or spread, in one size.' },
        {
            part: 'avatars',
            role: 'img',
            description: 'Up to max avatars, each a focusable image so its name can be read from the tooltip.',
        },
        {
            part: 'overflow button',
            role: 'button',
            description: 'Shows "+N" and reads "+N more avatars"; opens the overflow menu.',
        },
        {
            part: 'overflow menu',
            role: 'menu',
            description: 'The remaining people as menu items with their avatar and name.',
        },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Moves through the avatars and the overflow button.' },
        {
            keys: ['Enter', 'Space', 'ArrowDown'],
            description: 'On the overflow button, open the menu and focus its first item.',
        },
        { keys: ['ArrowDown', 'ArrowUp'], description: 'Move through the menu items, wrapping at the ends.' },
        { keys: ['Escape'], description: 'Closes the menu and returns focus to the button.' },
    ],
    accessibility: {
        roles: 'Each avatar is an image named after its person, in the tab order so its tooltip can show, and not a button because it does nothing. The overflow control is a button with aria-haspopup menu, aria-expanded and aria-controls naming the menu; the menu is role menu with menuitems.',
        labels: 'The overflow button\'s visible "+N" is part of its name ("+N more avatars"). The menu is labelled "N more avatars".',
        focus: 'Opening the menu moves focus to its first item; Escape returns it to the button; clicking outside or tabbing away closes the menu.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'renders-avatars', description: 'Every item up to max renders as a named avatar.' },
        { id: 'overflow-button', description: 'Past max, a "+N more avatars" button replaces the rest.' },
        {
            id: 'opens-menu',
            description:
                'The overflow button opens a labelled menu with the remaining names, expanded and controlling it.',
        },
        {
            id: 'menu-keyboard',
            description:
                'Focus lands on the first item; the arrows move it and Escape closes and refocuses the button.',
        },
        { id: 'outside-click-closes', description: 'A click outside the menu closes it.' },
        {
            id: 'variants',
            description: 'size and variant are reflected in the attributes; max is capped at the item count.',
        },
        { id: 'empty', description: 'Without items nothing renders.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core, with the overflow menu open too.' },
    ],
};
