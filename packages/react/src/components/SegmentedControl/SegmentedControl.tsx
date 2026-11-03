import './segmented-control.scss';
import { TabOption, TabList, TabListProps } from '-/components/TabList';
import { ElementProps } from '-/types/common';

export type SegmentedControlOption = Omit<TabOption, 'badge'>;
export type SegmentedControlProps = TabListProps<SegmentedControlOption>;

/**
 * Navigation tool that organizes content across different screens and views.
 *
 * @example
 *     import { SegmentedControl } from '@ptrn/react/SegmentedControl';
 *
 *     () => {
 *         const [selectedOption, setSelectedOption] = useState<string>('');
 *
 *         return (
 *             <SegmentedControl
 *                 label="Example segmented control"
 *                 onChange={setSelectedOption}
 *                 options={[
 *                     { value: '1', label: 'Option 1' },
 *                     { value: '2', label: 'Option 2' },
 *                     { value: '3', label: 'Option 3' },
 *                 ]}
 *                 value={selectedOption}
 *             />
 *         );
 *     };
 *
 * @name SegmentedControl
 * @phase Stable
 */
export function SegmentedControl({
    onChange,
    value,
    size = 'medium',
    options,
    width = 'hug',
    iconsOnly,
    ...containerProps
}: ElementProps<SegmentedControlProps, 'ul'>) {
    return (
        <TabList
            {...containerProps}
            data-pttrn="segmented-control"
            iconsOnly={iconsOnly}
            onChange={onChange}
            options={options}
            size={size}
            value={value}
            width={width}
        />
    );
}
