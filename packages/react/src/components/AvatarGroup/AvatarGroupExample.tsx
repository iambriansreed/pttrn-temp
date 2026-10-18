import { AvatarGroupProps } from '.';
import { ComponentExample, Preset } from '-/utils/demo';

const BLUE = 'info' as const;
const GREEN = 'success' as const;
const PURPLE = 'accent-cool' as const;

export const presets: Preset<AvatarGroupProps>[] = [
    {
        label: 'Stacked',
        propState: {
            items: [
                { name: 'Fezzik', image: '/avatar-01.png' },
                { name: 'Inigo Montoya', initials: 'IM', color: BLUE },
                { name: 'Miracle Max', initials: 'MM', showIcon: false, color: GREEN },
                { name: 'Princess Buttercup', showIcon: true, color: PURPLE },
            ],
            variant: 'stacked' as AvatarGroupProps['variant'],
            max: 10,
        },
    },
    {
        label: 'Stacked With Overflow',
        propState: {
            items: [
                {
                    name: 'Alice Johnson',
                    image: '/avatar-01.png',
                },
                {
                    name: 'Bob Smith',
                    image: '/avatar-02.png',
                },
                {
                    name: 'Charlie Brown',
                    image: '/avatar-03.png',
                },
                {
                    name: 'David Wilson',
                    image: '/avatar-04.png',
                },
                {
                    name: 'Eva Green',
                    image: '/avatar-05.png',
                },
                { name: 'Frank Miller', image: '/avatar-06.png' },
                { name: 'Grace Lee', image: '/avatar-07.png' },
                { name: 'Hannah Kim', image: '/avatar-08.png' },
                { name: 'Ian Clark', image: '/avatar-09.png' },
                { name: 'Julia Adams', image: '/avatar-10.png' },
                { name: 'Katherine Johnson', image: '/avatar-11.png' },
            ],
            variant: 'stacked' as AvatarGroupProps['variant'],
            max: 5,
        },
    },
];

export const AvatarGroupExample: ComponentExample<AvatarGroupProps> = {
    presets,
    render: ({ props, Component, preset }) => <Component key={preset?.label} {...props} />,
    variants: false,
};
