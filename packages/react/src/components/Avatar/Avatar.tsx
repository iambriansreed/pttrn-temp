import './avatar.scss';
import { SvgPerson } from '@ptrn/icons/Person';
import { useMemo } from 'react';

import { Tooltip, TooltipTriggerProps } from '-/components/Tooltip';
import { CommonProps } from '-/types/common';
import { ColorVariant } from '-/utils/colorVariants';

export type SizeVariant =
    'large' | 'medium' | 'small' | 'x-large' | 'x-small' | 'xx-large' | 'xxx-large' | 'xxxx-large' | 'xxxxx-large';

export type AvatarProps = CommonProps<'disabled'> & {
    /**
     * The name of the person or entity represented by the avatar. This is used for accessibility purposes.
     *
     * @example
     *     Andre Giant
     *
     * @required
     */
    name: string;
    /**
     * The size of the avatar.
     *
     * @default small
     */
    size?: SizeVariant;
    /**
     * The color of the avatar.
     *
     * @default base
     */
    color?: ColorVariant;
    /**
     * Customizable initials to display in the avatar limited to 2 characters.
     *
     * By default, initials are the first letters of the first two words in the name. For a single-word name, only one
     * initial is shown. Names with three or more words, only the first two initials are used.
     *
     * @example
     *     AG;
     */
    initials?: string;
    /**
     * Whether to show the icon in the avatar instead of the initials.
     *
     * If an image is provided, the image will be shown instead of the icon.
     *
     * @default true
     */
    showIcon?: boolean;
    /**
     * The url to the image to display in the avatar.
     *
     * When provided the image will be displayed instead of the icon or initials.
     *
     * @example
     *     /avatar-01.png
     */
    image?: string;
    /**
     * Whether to hide the represented user's name as a tooltip.
     *
     * @default false
     */
    hideTooltip?: boolean;
    /**
     * The function to call when the avatar is clicked.
     *
     * @type () => void
     */
    onClick?: () => void;
};

/**
 * An avatar is a visual representation of a user or entity. It can be used to display an initials, icon, or image.
 *
 * @example
 *     import { Avatar } from '@ptrn/react/Avatar';
 *
 *     <Avatar
 *         color="info"
 *         showIcon
 *         image="/avatar-01.png"
 *         initials="AR"
 *         name="Andre Giant"
 *         size="large"
 *         disabled={false}
 *         onClick={() => action('Launch avatar popover')}
 *         showIcon={false}
 *         hideTooltip={true}
 *     />;
 *
 * @exampleDescription The image if provided is displayed first, followed by the icon if provided, and finally the initials. If no initials are provided, the first two letters of the name will be used as initials.
 *
 * @name Avatar
 * @phase Stable
 */
export function Avatar({
    initials: initialsProp,
    color = 'base',
    size = 'small',
    showIcon,
    image,
    name,
    hideTooltip = false,
    onClick,
    disabled = false,
    ...props
}: AvatarProps) {
    const children = useMemo(() => {
        if (image) return <img alt={name} aria-hidden={true} src={image} />;

        if (showIcon)
            return (
                <span aria-hidden={true} data-icon>
                    <SvgPerson />
                </span>
            );

        let initials = initialsProp;

        if (name && !initials)
            initials = name
                .split(' ')
                .map((word) => word.charAt(0))
                .slice(0, 2)
                .join('')
                .toUpperCase();

        if (initials)
            return (
                <span aria-hidden={true} data-initials>
                    {initials.slice(0, 2)}
                </span>
            );

        return null;
    }, [name, showIcon, image, initialsProp]);

    if (!children) return null;

    const avatar = (triggerProps: TooltipTriggerProps) => (
        <div
            {...props}
            {...triggerProps}
            aria-disabled={disabled || undefined}
            aria-label={name}
            aria-roledescription="person"
            data-color={color}
            data-pttrn="avatar"
            data-size={size}
            onClickCapture={disabled ? undefined : onClick}
            role={onClick ? 'button' : 'img'}
            tabIndex={onClick && !disabled ? 0 : undefined}
        >
            {children}
        </div>
    );

    return !hideTooltip ? <Tooltip label={name}>{avatar}</Tooltip> : avatar({});
}
