import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Card',
    summary: 'A surface that groups related content, raised off the page or outlined.',
    anatomy: [
        {
            part: 'card',
            description: 'A block with rounded corners, a shadow when elevated or a border when outlined.',
        },
    ],
    keyboard: [],
    accessibility: {
        roles: 'A plain block with no role. The card itself never acts: put a link or button inside it, or pass a role and the matching attributes when the whole card is one.',
        labels: 'None of its own; the content provides them. Pass aria-labelledby pointing at the heading when the card is a region.',
        focus: 'Never focusable itself.',
    },
    behaviors: [
        { id: 'renders-children', description: 'The children render inside the card.' },
        { id: 'variants', description: 'variant is reflected as an attribute; elevated is the default.' },
        { id: 'passes-attributes', description: 'Other attributes reach the card element.' },
        { id: 'inner-ref', description: 'innerRef receives the card element.' },
        { id: 'axe-clean', description: 'A card with content passes axe-core.' },
    ],
};
