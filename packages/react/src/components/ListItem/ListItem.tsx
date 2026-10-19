import './list-item.scss';
import {
    AnchorHTMLAttributes,
    ElementType,
    ReactNode,
    MouseEvent,
    AriaAttributes,
    HTMLAttributes,
    AriaRole,
    ComponentProps,
} from 'react';
import { Truncated } from '-/components/Truncated';
import { useId } from '-/hooks/useId';
import { CommonProps, ElementProps, SetRef } from '-/types/common';

export type ListItemProps<As extends ElementType = ElementType> = CommonProps<'active' | 'owner' | 'style'> &
    Pick<AriaAttributes, 'aria-label'> & {
        /**
         * The element type to render as.
         *
         * @default div
         * @type ElementType
         */
        as?: As;
        /**
         * The leading element to display in the ListItem.
         *
         * Leading elements should only be one of the following [Icon](/icons), Img, Avatar.
         *
         * @exampleType select
         * @options Icon, Img, Avatar
         */
        leading?: ReactNode;
        /** Props to pass to the leading element wrapper span. */
        leadingProps?: ComponentProps<'span'>;
        /**
         * The label to display in the ListItem.
         *
         * @required
         */
        label: string;
        /** Props to pass to the label wrapper span. */
        labelProps?: ComponentProps<'span'>;
        /** The subtext to display in the ListItem. */
        subText?: string;
        /**
         * The trailing element to display in the ListItem.
         *
         * Trailing elements should only be one of the following [Icon](/icons), Checkbox, Button, Radio, Switch, Tag,
         * Txt.
         *
         * @exampleType select
         * @options Checkbox, Icon, Button, Radio, Switch, Tag, Txt
         */
        trailing?: ReactNode;
        /** Props to pass to the trailing element wrapper span. */
        trailingProps?: ComponentProps<'span'>;
        /**
         * The [href](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a#href) of the list item.
         *
         * If the href is provided, the ListItem will render as an anchor element (`<a>`).
         */
        href?: AnchorHTMLAttributes<unknown>['href'];
        /** A ref to the list item div element. */
        innerRef?: SetRef<HTMLElement>;
        /**
         * The ARIA role of the list item.
         *
         * The role will be set to 'button' automatically if the ListItem has an onClick prop and is not a button,
         * label, or anchor element.
         *
         * If including other focusable elements (e.g. buttons, links) in the leading or trailing slots, the role should
         * be set explicitly to something other than 'button'.
         */
        role?: AriaRole;
        /** Callback function that is called when the ListItem is clicked. */
        onClick?: (event: MouseEvent<HTMLElement>) => void;
        /**
         * The unique ID of the list item.
         *
         * If not provided, a unique ID will be generated. This is useful for accessibility and testing purposes.
         */
        id?: string;
        /**
         * Indicates the current "selected" state of the list item when used in a selectable context, such as within a
         * ListItemMenu.
         */
        'aria-selected'?: boolean;
        /**
         * Determines how the ListItem uses horizontal space.
         *
         * If set to 'fill', options expand to fill the container's width.
         *
         * If set to 'hug', options only take up as much space as the content requires.
         *
         * @default fill
         */
        width?: 'fill' | 'hug';
    };

/**
 * A hybrid interactive component that is used frequently to organize content and offers a wide range of control and
 * navigation in most experiences.
 *
 * With its flexible and simple structure, the list item element is core and can meet the needs of many uses cases.
 *
 * The ListItem has three main elements: leading element, label, and trailing element.
 *
 * Leading elements should be one of the following [Icon](/icons), Img, Avatar.
 *
 * Trailing elements should be one of the following [Icon](/icons), Checkbox, Button, Radio, Switch, Tag, Txt.
 *
 * @example
 *     import { SvgFolder } from '@ptrn/icons/Folder';
 *     import { SvgChevronRight } from '@ptrn/icons/ChevronRight';
 *     import { ListItem } from '@ptrn/react/ListItem';
 *
 *     <div style={{ width: 300 }}>
 *         <ListItem
 *             leading={<SvgDelete />}
 *             label="File 13"
 *             subText="Last modified: Jan 21, 2024"
 *             trailing={<SvgChevronRight />}
 *             onClick={() => sendSnackbar('Clicked Open Folder button')}
 *         />
 *         <ListItem
 *             leading={<SvgFolder />}
 *             label="Death Star Plans"
 *             subText="Last modified: May 25, 1977"
 *             trailing={<SvgChevronRight />}
 *             onClick={() => sendSnackbar('Downloading blueprints...')}
 *         />
 *     </div>;
 *
 * @name ListItem
 * @phase Stable
 */
function ListItem<As extends ElementType = ElementType>({
    active,
    as,
    innerRef,
    label,
    labelProps,
    leading,
    leadingProps,
    owner,
    role: roleProp,
    subText,
    trailing,
    trailingProps,
    id: idProp,
    'aria-label': ariaLabel,
    'aria-selected': ariaSelected,
    'aria-disabled': ariaDisabled,
    'aria-readonly': ariaReadonly,
    width,
    ...props
}: ElementProps<ListItemProps<As>, As>) {
    const id = useId(idProp);

    if (!label) return null;

    const As = asLogic(as, props);

    const isReadOnly = Boolean(props.readOnly || ariaReadonly);
    const isDisabled = Boolean(props.disabled || ariaDisabled);

    const actionable = !!(props.href || props.onClick || as === 'button') && !isReadOnly && !isDisabled;

    const role = roleLogic(roleProp, { as: As, props, actionable });

    return (
        <As
            {...props}
            aria-label={ariaLabel || undefined}
            aria-selected={ariaSelected}
            data-action={actionable || undefined}
            data-active={active || undefined}
            data-disabled={isDisabled || undefined}
            data-pttrn="list-item"
            data-pttrn-owner={owner || undefined}
            data-readonly={isReadOnly || undefined}
            data-width={width === 'hug' ? 'hug' : undefined}
            id={id}
            onClick={isReadOnly || isDisabled ? undefined : props.onClick}
            onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
                props.onKeyDown?.(event);
                // A native button or link activates itself; a div with role button needs the keys handled.
                if (role !== 'button' || As === 'button' || !actionable || !props.onClick) return;
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    props.onClick(event as unknown as React.MouseEvent<HTMLElement>);
                }
            }}
            ref={innerRef}
            role={role}
            tabIndex={props.tabIndex || (actionable ? 0 : -1)}
        >
            {leading && (
                <span {...leadingProps} data-leading>
                    {leading}
                </span>
            )}
            <span {...labelProps} data-item-label>
                <Truncated data-text>{label}</Truncated>
                {subText && <span data-sub-text>{subText}</span>}
            </span>
            {trailing && (
                <span {...trailingProps} data-trailing>
                    {trailing}
                </span>
            )}
        </As>
    );
}

export { ListItem };

function asLogic<As extends ElementType>(as: As | undefined, props: Partial<ListItemProps>): ElementType {
    if (as) return as;
    if (props.href) return 'a';
    return 'div';
}

function roleLogic(
    /** User provided role prop */
    existingRole: AriaRole | undefined,
    {
        as: As,
        props,
        actionable,
    }: {
        as: ElementType;
        props: Partial<ListItemProps>;
        actionable?: boolean;
    },
): HTMLAttributes<HTMLElement>['role'] | undefined {
    if (existingRole) return existingRole;

    if (!actionable) return undefined;

    if (props.onClick && As !== 'button' && As !== 'label') return 'button';

    return undefined;
}
