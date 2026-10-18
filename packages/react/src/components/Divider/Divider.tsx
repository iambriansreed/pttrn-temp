import './divider.scss';
import { ElementProps } from '-/types/common';
import { cssWithVars } from '-/utils/cwv';

export type DividerProps = {
    /**
     * The orientation of the divider.
     *
     * @default horizontal
     */
    orientation?: 'horizontal' | 'vertical';
    /**
     * The thickness of the divider.
     *
     * @default light
     */
    thickness?: 'heavy' | 'light';
    /**
     * If the divider padding is shown.
     *
     * @default true
     */
    padding?: boolean;
    /**
     * The inset (margin) of the divider. The value is a number between 0 and 12, in steps of the USWDS half unit
     * (`--usa-spacing-05`, 4px). The inset is applied to the left and right sides of the divider when the orientation
     * is horizontal, and to the top and bottom when the orientation is vertical.
     *
     * @default 0
     */
    inset?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
};

const insetToVariable = (insetProp: number | string) => {
    const inset = Number(insetProp);
    if (inset === undefined || inset === null || inset < 1 || inset > 12) return '0px';
    return `calc(var(--usa-spacing-05) * ${inset})`;
};

/**
 * Horizontal thin lines that separates grouped content in a list or other containers with an optional section/group
 * label.
 *
 * Vertical thin lines that separates grouped content or other visual elements within a container.
 *
 * @example
 *     import { Divider } from '@ptrn/react/Divider';
 *
 *     <div style={{ width: 320 }}>
 *         <ExamplePlaceholder>Content above the divider</ExamplePlaceholder>
 *         <Divider orientation="horizontal" />
 *         <ExamplePlaceholder>Content below the divider</ExamplePlaceholder>
 *     </div>;
 *
 * @name Divider
 * @phase Stable
 */
export function Divider({
    padding = true,
    orientation = 'horizontal',
    thickness = 'light',
    inset = 0,
    ...props
}: ElementProps<DividerProps, 'div'>) {
    return (
        <div
            {...props}
            aria-hidden
            aria-orientation={orientation}
            data-hide-padding={!padding || undefined}
            data-orientation={orientation}
            data-pttrn="divider"
            data-thickness={thickness}
            role="separator"
            style={cssWithVars({
                ...props.style,
                '--inset': insetToVariable(inset),
            })}
        />
    );
}
