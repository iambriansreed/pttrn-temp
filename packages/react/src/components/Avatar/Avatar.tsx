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
     * Lets keyboard users reach a non-clickable avatar so its tooltip can show. A clickable avatar is always focusable.
     *
     * @default false
     */
    focusable?: boolean;
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
    focusable = false,
    onClick,
    disabled = false,
    ...props
}: AvatarProps) {
    // Up to two initials, given or taken from the first two words of the name; none when an image or the icon shows.
    const initials = useMemo(() => {
        if (image || showIcon) return undefined;
        const fromName = name
            ? name
                  .split(' ')
                  .map((word) => word.charAt(0))
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
            : '';
        return (initialsProp || fromName).slice(0, 2) || undefined;
    }, [name, showIcon, image, initialsProp]);

    let children = null;
    if (image) children = <img alt={name} aria-hidden={true} src={image} />;
    else if (showIcon)
        children = (
            <span aria-hidden={true} data-icon>
                <SvgPerson />
            </span>
        );
    else if (initials)
        children = (
            <span aria-hidden={true} data-initials>
                {initials}
            </span>
        );

    if (!children) return null;

    const interactive = Boolean(onClick);
    // A clickable avatar that shows initials carries them in its name (WCAG 2.5.3, Label in Name), so a speech user
    // can say what they see; its tooltip then describes it instead of naming it. Otherwise the tooltip is the name.
    const initialsInName = interactive && Boolean(initials);
    const label = initialsInName ? `${initials}, ${name}` : name;

    const avatar = ({ 'aria-labelledby': tooltipId, ...triggerProps }: TooltipTriggerProps) => (
        <div
            {...props}
            {...triggerProps}
            aria-describedby={initialsInName ? tooltipId : undefined}
            aria-disabled={disabled || undefined}
            aria-label={label}
            aria-labelledby={initialsInName ? undefined : tooltipId}
            aria-roledescription="person"
            data-color={color}
            data-pttrn="avatar"
            data-size={size}
            onClickCapture={disabled ? undefined : onClick}
            role={interactive ? 'button' : 'img'}
            tabIndex={interactive ? (disabled ? undefined : 0) : focusable ? 0 : undefined}
        >
            {children}
        </div>
    );

    return !hideTooltip ? <Tooltip label={name}>{avatar}</Tooltip> : avatar({});
}
