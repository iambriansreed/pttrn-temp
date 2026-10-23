import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'SearchBar',
    summary: 'A search field that filters a list of results as you type and lets you pick one.',
    anatomy: [
        {
            part: 'field',
            role: 'combobox',
            description: 'A text input with a search icon, aria-autocomplete list, controlling the results while open.',
        },
        {
            part: 'results',
            role: 'listbox',
            description: 'The items whose label contains the query, named "Search results".',
        },
        { part: 'result', role: 'option', description: 'One item, aria-selected when its label is the value.' },
        {
            part: 'no results',
            role: 'option',
            description: '"No results found" and noResultsMessage, a disabled option shown when nothing matches.',
        },
    ],
    keyboard: [
        { keys: ['ArrowDown'], description: 'Opens the results on the first one, or moves to the next.' },
        { keys: ['ArrowUp'], description: 'Moves to the previous result while the list is open.' },
        {
            keys: ['Enter'],
            description: 'Chooses the active result while the list is open; otherwise it is left to the form.',
        },
        { keys: ['Escape'], description: 'Closes the results until the next keystroke.' },
        { keys: ['ArrowLeft', 'ArrowRight', 'Space'], description: 'Edit the text as in any field.' },
    ],
    accessibility: {
        roles: 'The input is a combobox with aria-haspopup listbox, aria-expanded, and aria-controls naming the listbox while it is open. The active result is aria-activedescendant; focus stays in the field.',
        labels: 'The field is named by aria-label (or a Field around it). The listbox is "Search results". A query with no matches is announced as "No results found".',
        focus: 'Focus never leaves the field. Choosing a result or pressing Escape closes the list until the next keystroke.',
    },
    behaviors: [
        { id: 'combobox', description: 'The field is a named combobox with list autocomplete, closed at first.' },
        {
            id: 'filters',
            description: 'Typing opens the results filtered by the query, case-insensitive, with the first one active.',
        },
        {
            id: 'text-editing',
            description: 'Space, ArrowLeft and ArrowRight edit the text instead of moving through the results.',
        },
        { id: 'arrow-keys', description: 'ArrowDown and ArrowUp move the active result.' },
        {
            id: 'choose',
            description:
                'Enter or a click chooses a result: onChange gets its label and the item, and the list stays closed.',
        },
        { id: 'escape-closes', description: 'Escape closes the results, and typing opens them again.' },
        {
            id: 'no-results',
            description: 'A query without matches shows "No results found" with noResultsMessage and announces it.',
        },
        { id: 'axe-clean', description: 'Closed and open, the search bar passes axe-core.' },
    ],
};
