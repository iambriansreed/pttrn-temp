import { SvgChevronRight } from '@ptrn/icons/ChevronRight';
import { SvgClose } from '@ptrn/icons/Close';
import { SvgCloud } from '@ptrn/icons/Cloud';
import { SvgIcecream } from '@ptrn/icons/Icecream';
import { SvgKeyboardArrowDown } from '@ptrn/icons/KeyboardArrowDown';
import { SvgLightbulb } from '@ptrn/icons/Lightbulb';
import { SvgSignLanguage } from '@ptrn/icons/SignLanguage';
import { SvgStar } from '@ptrn/icons/Star';

// import { Chip } from '-/components/Chip';
import { ChipGroupProps } from '-/components/ChipGroup';
import { ComponentExampleFn, Preset } from '-/utils/demo';

export const presets: Preset<ChipGroupProps>[] = [
    {
        label: 'Scroll',
        propState: {
            overflow: 'scroll',
            items: [
                { label: 'chip 1', leadingIcon: <SvgLightbulb />, trailingIcon: <SvgChevronRight /> },
                { label: 'chip 2', leadingIcon: <SvgIcecream />, trailingIcon: <SvgChevronRight /> },
                { label: 'chip 3', leadingIcon: <SvgSignLanguage />, trailingIcon: <SvgClose /> },
                { label: 'chip 4', leadingIcon: <SvgStar />, trailingIcon: <SvgClose /> },
                { label: 'chip 5', leadingIcon: <SvgCloud />, trailingIcon: <SvgKeyboardArrowDown /> },
            ],
        },
    },
    {
        label: 'Scroll: Flat chips',
        propState: {
            overflow: 'scroll',
            items: [
                {
                    flat: true,
                    label: 'chip 1',
                    leadingIcon: <SvgLightbulb />,
                    trailingBadge: { count: 9, size: 'x-small' },
                },
                {
                    flat: true,
                    label: 'chip 2',
                    leadingIcon: <SvgIcecream />,
                    trailingBadge: { count: 2, size: 'x-small' },
                },
                { flat: true, label: 'chip 3', leadingIcon: <SvgSignLanguage />, trailingIcon: <SvgClose /> },
                {
                    flat: true,
                    label: 'chip 4',
                    leadingIcon: <SvgStar />,
                    trailingBadge: { count: 5, size: 'x-small' },
                },
                {
                    flat: true,
                    label: 'chip 5',
                    leadingIcon: <SvgCloud />,
                    trailingBadge: { count: 3, size: 'x-small' },
                },
            ],
        },
    },
];

export const ChipGroupExample: ComponentExampleFn<ChipGroupProps> = ({ action }) => ({
    containerStyle: { width: '600px' },
    presets,
    defaultState: {
        overflow: 'wrap',
        items: [
            { label: 'chip 1', leadingIcon: <SvgLightbulb />, trailingIcon: <SvgChevronRight /> },
            { label: 'chip 2', leadingIcon: <SvgIcecream />, trailingIcon: <SvgChevronRight /> },
            { label: 'chip 3', leadingIcon: <SvgSignLanguage />, trailingIcon: <SvgClose /> },
            { label: 'chip 4', leadingIcon: <SvgStar />, trailingIcon: <SvgClose /> },
            { label: 'chip 5', leadingIcon: <SvgCloud />, trailingIcon: <SvgKeyboardArrowDown /> },
        ],
    },
    render: ({ props, Component }) => {
        return (
            <Component
                {...props}
                items={props.items?.map((item) => ({
                    ...item,
                    onClick: () => action('Chip clicked!'),
                }))}
            />
        );
    },
});
