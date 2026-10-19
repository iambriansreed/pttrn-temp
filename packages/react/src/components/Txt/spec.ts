import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Txt',
    summary: "Text in one of the system's type styles, as any element, with a skeleton while it loads.",
    anatomy: [
        {
            part: 'element',
            description: "A span by default, or the element given by `as`, carrying the variant's font.",
        },
        {
            part: 'skeleton',
            description:
                "SkeletonText lines in the variant's size while there is no content, when skeletonLines is set.",
        },
    ],
    keyboard: [],
    accessibility: {
        roles: 'Whatever the chosen element brings: a heading when rendered as h1 to h6, a paragraph as p. The skeleton is a status region labelled "Loading".',
        labels: 'The content is the text.',
        focus: 'Never focusable on its own.',
    },
    behaviors: [
        { id: 'renders-text', description: 'The content renders as text in a span.' },
        { id: 'as-element', description: '`as` renders the text as another element.' },
        { id: 'variant-font', description: 'The variant sets the font, unless inherit leaves it to the parent.' },
        { id: 'skeleton-fallback', description: 'Without content, skeletonLines renders that many skeleton lines.' },
        { id: 'empty', description: 'Without content and without skeletonLines nothing renders.' },
        { id: 'axe-clean', description: 'Text and its skeleton pass axe-core.' },
    ],
};
