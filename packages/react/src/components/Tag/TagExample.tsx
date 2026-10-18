import { TagProps } from '.';
import { ComponentExample, Preset } from '-/utils/demo';

export const presets: Preset<TagProps>[] = [
    {
        label: 'Long Label',
        propState: {
            label: 'Hello, this is a very long tag label that should be truncated if it exceeds the container width.',
            color: 'accent-cool' as TagProps['color'],
            size: 'small' as TagProps['size'],
            variant: 'flat' as TagProps['variant'],
        },
    },
];

export const TagExample: ComponentExample<TagProps> = {
    presets,
};
