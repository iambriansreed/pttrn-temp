import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Button',
    summary:
        'A control that performs an action when activated, with an optional icon, a tooltip and three visual weights.',
    anatomy: [
        {
            part: 'button',
            role: 'button',
            description: 'The control. A native button by default; `as` renders another element with role button.',
        },
        { part: 'icon', description: 'Optional, decorative; before the label, or alone when iconOnly.' },
        {
            part: 'label',
            description: 'The visible text. Hidden when iconOnly, and then carried by the tooltip and aria-label.',
        },
        { part: 'touch target', description: 'An invisible area that extends the pointer target to the minimum size.' },
    ],
    keyboard: [{ keys: ['Enter', 'Space'], description: 'Activate the button.' }],
    accessibility: {
        roles: 'A native button, or role button on another element. The icon is aria-hidden.',
        labels: 'The label is the accessible name, through aria-label; a consumer aria-label overrides it. A tooltip names an icon-only button and describes a button with a visible label.',
        focus: 'Native focus; a disabled button is disabled, not aria-disabled, so it leaves the tab order.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'renders-label', description: 'The label is visible and is the accessible name.' },
        { id: 'click', description: 'Activating the button calls onClick.' },
        { id: 'disabled', description: 'A disabled button is disabled and does not call onClick.' },
        {
            id: 'icon-only',
            description: 'With an icon and iconOnly, the label text is hidden and still names the button.',
        },
        { id: 'icon-decorative', description: 'The icon renders aria-hidden.' },
        {
            id: 'tooltip',
            description:
                'A tooltip names an icon-only button, unless aria-label does, and describes a button with a visible label.',
        },
        {
            id: 'aria-label-wins',
            description: 'A consumer aria-label is the name, even on an icon-only button with a tooltip.',
        },
        {
            id: 'as-element',
            description: 'Rendered as another element, the button keeps role button and drops the type attribute.',
        },
        { id: 'children-label', description: 'String children are the label.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
