import './tag.scss';
import { Truncated } from '-/components/Truncated';
import { ElementProps } from '-/types/common';
import { ColorVariant } from '-/utils/colorVariants';

export type TagProps = {
    /**
     * The label of the tag.
     *
     * @required
     */
    label: string;
    /**
     * The size of the tag.
     *
     * @default small
     */
    size?: 'small' | 'x-small';
    /**
     * The color of the tag.
     *
     * @default base
     */
    color?: ColorVariant;
    /**
     * The display variant of the tag.
     *
     * @default flat
     */
    variant?: 'corner-wrap' | 'flat' | 'pill';
};

/**
 * A non-interactive visual indicators to draw attention or categorization of a component.
 *
 * @example
 *     import { Tag } from '@ptrn/react/Tag';
 *
 *     <Tag label="Example Tag" variant="flat" color="primary" />;
 *
 * @name Tag
 * @phase Stable
 */
export function Tag({
    label,
    color = 'base',
    size = 'small',
    variant = 'flat',
    ...props
}: ElementProps<TagProps, 'span'>) {
    return (
        <span {...props} data-color={color} data-pttrn="tag" data-size={size} data-variant={variant}>
            {label && <Truncated>{label}</Truncated>}
            {variant === 'corner-wrap' && <div data-triangle />}
        </span>
    );
}
