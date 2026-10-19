import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Carousel',
    summary: 'A horizontal row of slides, one active at a time, moved with buttons, arrow keys or a swipe.',
    anatomy: [
        {
            part: 'region',
            role: 'region',
            description: 'The carousel, named by label, with the role description "carousel".',
        },
        { part: 'track', description: 'The scrolling row of slides; swiping and the arrow keys act here.' },
        {
            part: 'slide',
            role: 'group',
            description:
                'One child, labelled "Slide N of M" with the role description "slide". Only the active slide is focusable.',
        },
        { part: 'controls', description: 'Previous and next buttons around a page indicator.' },
        { part: 'live region', description: 'Announces "Slide N of M" when the active slide changes.' },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Moves to the active slide, then to the controls.' },
        { keys: ['ArrowRight', 'ArrowLeft'], description: 'On the track, move to the next or previous slide.' },
    ],
    accessibility: {
        roles: 'A region with aria-roledescription carousel; each slide is a group with aria-roledescription slide. The page indicator is an image labelled "Page N of M".',
        labels: 'label names the region; slides are "Slide N of M"; the buttons are "Previous Slide" and "Next Slide".',
        focus: 'Moving to a slide focuses it; inactive slides are out of the tab order.',
        motion: "Slides scroll into view smoothly; the scroll follows the user's reduced-motion setting through the browser.",
        targetSize: 44,
    },
    behaviors: [
        { id: 'renders-slides', description: 'Every child is a labelled slide inside a labelled region.' },
        { id: 'previous-next', description: 'Next and previous move the active slide and are disabled at the ends.' },
        { id: 'arrow-keys', description: 'ArrowRight and ArrowLeft on the track move the active slide.' },
        { id: 'announces', description: 'The live region reads "Slide N of M" for the active slide.' },
        { id: 'active-focusable', description: 'Only the active slide is in the tab order, and moving focuses it.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
