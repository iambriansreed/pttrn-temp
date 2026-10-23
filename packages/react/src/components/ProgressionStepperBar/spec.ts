import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'ProgressionStepperBar',
    summary: 'A segmented bar that shows how many of a fixed number of steps are complete, with the count as text.',
    anatomy: [
        { part: 'container', description: 'The bar and its count, large or small.' },
        {
            part: 'segments',
            description: 'One segment per step, the completed ones filled. Decorative and aria-hidden.',
        },
        { part: 'count', description: 'The text "N of M steps completed."' },
    ],
    keyboard: [],
    accessibility: {
        roles: 'No role. The segments are aria-hidden, so assistive technology reads only the count text.',
        labels: 'The count is the whole message; put the bar next to the step it measures or under a heading that names the task.',
        focus: 'Never focusable.',
    },
    behaviors: [
        { id: 'segments', description: 'stepCount segments render, the first stepCompleted of them marked complete.' },
        { id: 'count-text', description: 'The count reads "N of M steps completed." and is the only text exposed.' },
        { id: 'clamps', description: 'A completed count below 0 reads 0 and one above stepCount reads stepCount.' },
        { id: 'sizes', description: 'size is an attribute; large is the default.' },
        { id: 'axe-clean', description: 'Partly and fully complete bars pass axe-core.' },
    ],
};
