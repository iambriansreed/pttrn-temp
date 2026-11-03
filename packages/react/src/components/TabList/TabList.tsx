import './tab-list.scss';
import { Fragment, ReactNode, useMemo } from 'react';
import { Badge, BadgeProps } from '-/components/Badge';
import { Tooltip } from '-/components/Tooltip';
import { useArrowNavigation } from '-/hooks/useArrowNavigation';
import { useId } from '-/hooks/useId';
import { ElementProps } from '-/types/common';
import { getElementById } from '-/utils/dom';
import { handleKeyDown } from '-/utils/handleKeyDown';
import { useIds } from '-/utils/useIds';

const TAB_BADGE_SIZES: Record<TabSize, BadgeProps['size']> = {
    large: 'small',
    medium: 'x-small',
    small: 'x-small',
};

export type TabSize = 'large' | 'medium' | 'small';

export type TabOption = {
    /**
     * The label of the tab. This is the text that will be displayed on the tab.
     *
     * @required
     */
    label: string;
    /**
     * Determines if the element is [disabled](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled).
     *
     * @default false
     */
    disabled?: boolean;
    /**
     * The value of the tab sent to onChange when selected.
     *
     * If not provided, the label will be used as the value.
     */
    value: string;
    /**
     * The icon to display on the left side of the tab.
     *
     * @type PttrnIcon
     */
    icon?: ReactNode;
    /**
     * The icon to display on the left side of the tab when the tab is currently selected.
     *
     * @type PttrnIcon
     */
    iconSelected?: ReactNode;
    /** The badge count to display on the tab */
    badge?: number;
};

export type TabListProps<O extends TabOption = TabOption> = {
    /**
     * The tabs to display.
     *
     * If **less than 2** items are provided, the component will not render.
     *
     * @example
     *     [
     *         { value: '1', label: 'Option 1' },
     *         { value: '2', label: 'Disabled 2 ', disabled: true },
     *         { value: '3', label: 'Option 3' },
     *     ];
     *
     * @type Array<TabOption>
     * @required
     */
    options: O[];
    /**
     * The value of the selected tab.
     *
     * @example
     *     1;
     *
     * @required
     */
    value: TabOption['value'];
    /**
     * The function to call when the tab is clicked.
     *
     * @required
     */
    onChange: (tabValue: string) => void;
    /**
     * The size of the tabs.
     *
     * @default medium
     */
    size?: TabSize;
    /**
     * Determines how the tab options use horizontal space.
     *
     * If set to 'fill', options expand to fill the container's width.
     *
     * If set to 'hug', options only take up as much space as the content requires.
     *
     * @default hug
     */
    width?: 'fill' | 'hug';
    /**
     * The label for the tab utility, used for accessibility.
     *
     * @required
     */
    label: string;
    /** The id of the tab utility, used for accessibility. */
    id?: string;
    /**
     * Determines if the labels of the options should be displayed. If icons are not provided for every option this is
     * ignored and labels are shown.
     *
     * @default false
     */
    iconsOnly?: boolean;
};

/**
 * Navigation tool that organizes content across different screens and views.
 *
 * See TabGroup or SegmentedControl for examples.
 *
 * @example
 *     import { TabList } from '@ptrn/react/TabList';
 *
 *     () => {
 *         const [selectedTab, setSelectedTab] = useState<string>();
 *
 *         return (
 *             <TabList
 *                 label="Example tab list"
 *                 onChange={setSelectedTab}
 *                 options={[
 *                     { value: '1', label: 'Option 1' },
 *                     { value: '2', label: 'Option 2' },
 *                     { value: '3', label: 'Option 3' },
 *                 ]}
 *                 value={selectedTab}
 *             />
 *         );
 *     };
 *
 * @name TabList
 * @phase Utility
 */
export function TabList({
    //
    onChange,
    value: valueProp,
    size = 'medium',
    options: optionsProp,
    width = 'hug',
    label,
    id: idProp,
    iconsOnly: iconsOnlyProp = false,
    ...containerProps
}: ElementProps<TabListProps, 'ul'>) {
    const id = useId(idProp);

    const options = useIds(`tab-list-${id}`, optionsProp);

    const { activeElementId, setActiveElementId, arrowKeyCallbacks } = useArrowNavigation({
        ids: options.filter((o) => !o.disabled).map((o) => o.id),
        defaultActiveId: options.find((opt) => opt.value === valueProp)?.id,
    });

    const value = useMemo(() => {
        const option = options.find((opt) => opt.value === valueProp);
        return option ? option.value : options[0]?.value;
    }, [options, valueProp]);

    // If all options have icons, we can hide the labels
    const iconsOnly = iconsOnlyProp === true && options.every((item) => item.icon && item.label);

    const handleClick = (item: (typeof options)[number]) => () => {
        setActiveElementId(item.id);
        if (!item.disabled) onChange(item.value);
    };

    // ensure an option is always focusable
    const focusableOption = useMemo(
        () =>
            options.find((item) => (activeElementId ? activeElementId === item.id : item.value === value)) ||
            options[0],
        [activeElementId, options, value],
    );

    return (
        <ul
            {...containerProps}
            aria-label={label}
            data-hug={width === 'hug' || undefined}
            data-pttrn-utility="tab-list"
            data-size={size}
            data-width={width}
            id={id}
            onFocusCapture={() => {
                getElementById(activeElementId)?.focus();
            }}
            onKeyDownCapture={handleKeyDown({
                ...arrowKeyCallbacks,
                Enter: (event) => {
                    event.preventDefault();
                    const activeOption = options.find((opt) => opt.id === activeElementId);
                    if (activeOption && !activeOption.disabled) onChange(activeOption.value);
                },
                Space: (event) => {
                    event.preventDefault();
                    const activeOption = options.find((opt) => opt.id === activeElementId);
                    if (activeOption && !activeOption.disabled) onChange(activeOption.value);
                },
            })}
            role="tablist"
        >
            {options.map((item) => {
                const isSelected = item.value === value;
                const icon = isSelected ? item.iconSelected : item.icon;
                const isActive = (activeElementId && activeElementId === item.id) || undefined;

                return (
                    <Fragment key={item.id}>
                        <Tooltip disabled={!iconsOnly} label={item.label} placement="top">
                            {(triggerProps) => (
                                // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                                <li
                                    {...triggerProps}
                                    aria-controls={id}
                                    aria-disabled={item.disabled || undefined}
                                    aria-selected={isSelected}
                                    data-active={isActive}
                                    data-value={item.value}
                                    id={item.id}
                                    onClick={item.disabled ? undefined : handleClick(item)}
                                    role="tab"
                                    tabIndex={focusableOption.id === item.id ? 0 : -1}
                                >
                                    {icon && <span aria-hidden="true">{icon}</span>}
                                    {!iconsOnly && <span data-label>{item.label}</span>}
                                    {item.badge && !item.disabled && (
                                        <Badge count={item.badge} size={TAB_BADGE_SIZES[size]} />
                                    )}
                                </li>
                            )}
                        </Tooltip>
                    </Fragment>
                );
            })}
        </ul>
    );
}
