import type { Catalog } from './types.js';

/** A small catalog for tests, shaped like the real one. */
export const fixture: Catalog = {
    meta: { version: '1.2.3', generated: '2026-01-01T00:00:00.000Z' },
    components: [
        {
            name: 'Button',
            slug: 'button',
            description: 'A clickable component that allows users to perform an action.',
            import: '@ptrn/react/Button',
            dependencies: ['Tooltip'],
            usage: '<Button label="Save" />',
            props: [
                { name: 'label', required: true, description: 'The label.', type: 'string' },
                {
                    name: 'variant',
                    required: false,
                    description: 'Color variant.',
                    type: "'primary' | 'secondary'",
                    options: ['primary', 'secondary'],
                    default: 'primary',
                },
            ],
        },
        {
            name: 'DatePicker',
            slug: 'date-picker',
            description: 'Lets users choose a date from a calendar.',
            import: '@ptrn/react/DatePicker',
            dependencies: ['Calendar'],
            props: [],
        },
        {
            name: 'Modal',
            slug: 'modal',
            description: 'A dialog overlay that interrupts the flow.',
            import: '@ptrn/react/Modal',
            dependencies: [],
            props: [],
        },
    ],
    icons: [
        {
            name: 'Person',
            title: 'Person',
            kind: 'material',
            alias: 'user, profile, account',
            import: '@ptrn/icons/Person',
            export: 'SvgPerson',
        },
        {
            name: 'Home',
            title: 'Home',
            kind: 'material',
            alias: 'house, main',
            import: '@ptrn/icons/Home',
            export: 'SvgHome',
        },
    ],
    tokens: [
        { name: '--usa-spacing-2', kind: 'spacing', value: '16px', description: '!-usa/spacing/2' },
        { name: '--usa-spacing-1', kind: 'spacing', value: '8px', description: '!-usa/spacing/1' },
        {
            name: '--theme-color-ink',
            kind: 'color',
            value: 'var(--theme-color-base-darkest)',
            themes: { 'project-theme-dark': 'var(--general-usa-color-white)' },
            description: '#-theme/color/ink',
        },
        { name: '--usa-color-white', kind: 'color', value: 'rgb(255 255 255)', description: '!-usa/color/white' },
    ],
};
