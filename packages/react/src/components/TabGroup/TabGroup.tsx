import './tab-group.scss';
import { TabList, TabListProps, TabOption } from '-/components/TabList';
import { ElementProps } from '-/types/common';

export type TabGroupSize = 'large' | 'medium' | 'small';

export type TabGroupProps = Omit<TabListProps<TabOption>, 'iconsOnly'> & {
    /**
     * When width is 'hug' this determines if the trailing underline should be showing. When width is 'fill' this
     * property isn't applicable.
     *
     * @default false
     */
    showTrail?: boolean;
};

/**
 * Navigation tool that organizes content across different screens and views.
 *
 * @example
 *     import { TabGroup } from '@ptrn/react/TabGroup';
 *
 *     () => {
 *         const [selectedTab, setSelectedTab] = useState<string>();
 *
 *         return (
 *             <TabGroup
 *                 label="Example tab group"
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
 * @name TabGroup
 * @phase Stable
 */
export function TabGroup({
    onChange: onTabChange,
    value,
    size = 'medium',
    options,
    width = 'hug',
    showTrail = false,
    ...containerProps
}: ElementProps<TabGroupProps, 'ul'>) {
    if (!Array.isArray(options) || options.length < 2) return null;
    return (
        <TabList
            data-pttrn="tab-group"
            data-show-trail={showTrail || undefined}
            onChange={onTabChange}
            options={options}
            size={size}
            value={value}
            width={width}
            {...containerProps}
        />
    );
}
