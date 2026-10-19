import './avatar-group.scss';
import { AvatarGroupOverflow } from './Overflow';
import { Avatar, AvatarProps, SizeVariant } from '-/components/Avatar';
import { CommonProps } from '-/types/common';

export type AvatarItem = Pick<AvatarProps, 'color' | 'image' | 'initials' | 'name' | 'showIcon'>;

export type AvatarGroupProps = CommonProps<'style'> & {
    /**
     * The avatars to display in the group.
     *
     * @example
     *     [
     *         { name: 'Fezzik', image: '/avatar-01.png' },
     *         { name: 'Inigo Montoya', initials: 'IM', color: 'info' },
     *         { name: 'Miracle Max', initials: 'MM', color: 'success' },
     *         { name: 'Princess Buttercup', showIcon: true },
     *     ];
     *
     * @type Array<AvatarItem>
     * @required
     */
    items: AvatarItem[];
    /**
     * Size of the avatar group.
     *
     * @default small
     */
    size?: SizeVariant;
    /**
     * The maximum number of avatars to display before showing the overflow menu.
     *
     * This is used to limit the number of avatars displayed in the group.
     *
     * Recommended to set this to a value between 3 and 5 for optimal display.
     *
     * @default 5
     * @minimum 1
     * @maximum 5
     */
    max?: number;
    /**
     * The variant of the avatar group.
     *
     * @default stacked
     */
    variant?: 'spread' | 'stacked';
};

/**
 * AvatarGroup component displays a group of avatars.
 *
 * @example
 *     import { AvatarGroup } from '@ptrn/react/AvatarGroup';
 *
 *     <AvatarGroup
 *         style={{ marginLeft: 'var(--usa-spacing-6)' }}
 *         size="medium"
 *         max={4}
 *         variant="stacked"
 *         items={[
 *             {
 *                 name: 'Alice Johnson',
 *                 image: '/avatar-01.png',
 *             },
 *             {
 *                 name: 'Bob Smith',
 *                 image: '/avatar-02.png',
 *             },
 *             {
 *                 name: 'Charlie Brown',
 *                 image: '/avatar-03.png',
 *             },
 *             {
 *                 name: 'Diana Prince',
 *                 image: '/avatar-04.png',
 *             },
 *             {
 *                 name: 'Ethan Hunt',
 *                 image: '/avatar-05.png',
 *             },
 *         ]}
 *     />;
 *
 * @name AvatarGroup
 * @phase Stable
 */
export function AvatarGroup({ items, size = 'small', max: maxProp = 5, variant = 'stacked', style }: AvatarGroupProps) {
    const max = maxProp > items.length ? items.length : maxProp;
    const overflowItems = items.slice(max);

    return !Array.isArray(items) || !items?.length ? null : (
        <div data-max={max} data-pttrn="avatar-group" data-size={size} data-variant={variant} style={style}>
            <div data-wrap>
                {items.slice(0, max).map((item, index) => (
                    <Avatar key={index} {...item} focusable size={size} />
                ))}
                {overflowItems.length > 0 && (
                    <AvatarGroupOverflow items={overflowItems} overflow={overflowItems.length} size={size} />
                )}
            </div>
        </div>
    );
}
