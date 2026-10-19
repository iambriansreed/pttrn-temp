import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'BannerAlert',
    summary:
        'A page-level message about a status or the content below it, with an optional action and a way to close it.',
    anatomy: [
        {
            part: 'alert',
            role: 'alert',
            description: 'A full-width block in one of the four alert colors, elevated when asked.',
        },
        { part: 'icon bar', description: 'The icon for the variant, decorative.' },
        { part: 'header', description: 'The header text, with the close button beside it.' },
        {
            part: 'close button',
            role: 'button',
            description: 'A small icon-only button named "Close"; only rendered when onClose is given.',
        },
        { part: 'body', description: 'The body text.' },
        {
            part: 'call to action',
            role: 'button',
            description:
                'A small tertiary button named by callToAction.label; only rendered with a label and an onClick.',
        },
    ],
    keyboard: [{ keys: ['Enter', 'Space'], description: 'On the close or call-to-action button, activate it.' }],
    accessibility: {
        roles: 'The block is role alert, so it is announced when it appears. Render it in response to something, not on every page load. The variant icon is aria-hidden.',
        labels: 'The header and body are the content. The close button is named "Close" and the call to action by its label. Color never carries meaning the text does not.',
        focus: 'Nothing is focused when the alert appears; the buttons sit in the tab order where the alert sits.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'renders-content', description: 'The header and body render inside an alert.' },
        {
            id: 'variant',
            description: 'variant is reflected as an attribute and picks the icon; informational is the default.',
        },
        {
            id: 'close-button',
            description: 'With onClose, a button named "Close" calls it; without onClose there is none.',
        },
        {
            id: 'call-to-action',
            description: 'callToAction renders a button with its label that calls its onClick; it needs both.',
        },
        { id: 'elevated', description: 'elevated is reflected as an attribute.' },
        { id: 'icon-decorative', description: 'The icon bar is aria-hidden.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
