import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Rating',
    summary: 'Five stars that show a rating out of five, or let someone give one.',
    anatomy: [
        {
            part: 'rating',
            role: 'img',
            description: 'Without onChange, one image named "N out of 5 stars", or "Rating" before any value.',
        },
        {
            part: 'radio group',
            role: 'radiogroup',
            description: 'With onChange, a radio group named the same way, or "Select a star rating" before a choice.',
        },
        {
            part: 'stars',
            role: 'radio',
            description: 'Five star buttons named "Rate 1" to "Rate 5"; the chosen one is checked.',
        },
        { part: 'fill', description: 'Stars up to the value are full; a .5 value half-fills the next star.' },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Reaches the chosen star, or the first star before a choice.' },
        { keys: ['ArrowRight', 'ArrowDown'], description: 'Choose the next star.' },
        { keys: ['ArrowLeft', 'ArrowUp'], description: 'Choose the previous star.' },
        { keys: ['Enter', 'Space'], description: 'Choose the focused star.' },
    ],
    accessibility: {
        roles: 'Read-only, a single role img with presentational stars. Interactive, a role radiogroup of five role radio buttons with aria-checked, one of them the tab stop.',
        labels: 'The group is named "N out of 5 stars" once there is a value, else "Rating" or "Select a star rating". Each star is "Rate N".',
        focus: 'The chosen star is the only tab stop, or the first star before a choice; the arrows move both the choice and focus.',
        targetSize: 24,
    },
    behaviors: [
        {
            id: 'read-only-image',
            description: 'Without onChange the rating is an image named "N out of 5 stars", or "Rating" when empty.',
        },
        { id: 'fills', description: 'Stars up to the value are full and a .5 value half-fills the next star.' },
        {
            id: 'radiogroup',
            description: 'With onChange it is a radio group of five "Rate N" radios, the chosen one checked.',
        },
        { id: 'choose', description: 'Clicking a star calls onChange with its number.' },
        {
            id: 'keyboard',
            description:
                'The first or chosen star is the tab stop; the arrows move the choice and focus and call onChange.',
        },
        { id: 'sizes', description: 'size is an attribute; medium is the default.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
