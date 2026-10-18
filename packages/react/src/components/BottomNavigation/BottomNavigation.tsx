import './bottom-navigation.scss';
import { TabList, TabListProps } from '-/components/TabList';

export type BottomNavigationProps = Pick<TabListProps, 'label' | 'onChange' | 'options' | 'value'> & {
    /**
     * Determines how the BottomNavigation will appear.
     *
     * @default flat
     */
    variant?: 'elevated' | 'flat';
    /**
     * If the bottom navigation should render inline or fixed to the bottom of the viewport.
     *
     * @default inline
     */
    mode?: 'fixed' | 'inline';
};

/**
 * A bottom bar displaying three to five top level destinations at the bottom of screen for a mobile application.
 *
 * @example
 *     import { BottomNavigation } from '@ptrn/react/BottomNavigation';
 *
 *     () => {
 *         const [value, setValue] = useState<string>('1');
 *
 *         return (
 *             <BottomNavigation
 *                 variant="elevated"
 *                 mode="inline"
 *                 label="Bottom Navigation Example"
 *                 value={value}
 *                 onChange={(next) => setValue(next)}
 *                 options={[
 *                     {
 *                         value: '1',
 *                         label: 'Item 1',
 *                         icon: <SvgSettings />,
 *                         iconSelected: <SvgSettingsFill />,
 *                     },
 *                     {
 *                         value: '2',
 *                         label: 'Item 2',
 *                         icon: <SvgCloud />,
 *                         iconSelected: <SvgCloudFill />,
 *                     },
 *                 ]}
 *             />
 *         );
 *     };
 *
 * @name BottomNavigation
 * @phase Dev
 */
export function BottomNavigation({ mode = 'inline', variant = 'flat', ...tabListProps }: BottomNavigationProps) {
    return (
        <TabList
            data-mode={mode}
            data-pttrn="bottom-navigation"
            data-variant={variant}
            size="large"
            {...tabListProps}
        />
    );
}
