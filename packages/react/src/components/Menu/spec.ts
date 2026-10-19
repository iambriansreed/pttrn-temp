import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Menu',
    summary:
        'A container for a list of ListItem and Divider children, presented as a panel; Select and other components build on it.',
    anatomy: [
        {
            part: 'container',
            description:
                'A div by default, or the element given by `as`, with the menu styling and an optional fixed width.',
        },
        { part: 'items', description: 'The children: ListItem and Divider components.' },
    ],
    keyboard: [],
    accessibility: {
        roles: 'None by default; the consumer sets role (menu, listbox) when the children follow that pattern, and then names it with label.',
        labels: 'The label prop becomes aria-label. Required when the role is menu or listbox.',
        focus: 'The container takes no focus; the items decide their own.',
    },
    behaviors: [
        { id: 'renders-children', description: 'The children render inside the container.' },
        { id: 'labelled', description: 'label becomes aria-label and role passes through.' },
        { id: 'as-element', description: '`as` renders the container as another element.' },
        { id: 'width', description: 'width sets the container width.' },
        { id: 'axe-clean', description: 'A menu of list items passes axe-core.' },
    ],
};
