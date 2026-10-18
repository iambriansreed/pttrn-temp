import { ReactNode } from 'react';

import { Txt } from '-/components/Txt';
import { ElementProps } from '-/types/common';

const dimension = (value: number | string) => (typeof value === 'number' ? `${value}px` : `${value}`);

export type ExamplePlaceholderProps = {
    /**
     * The height of the placeholder.
     *
     * @default 100
     * @type string
     */
    height?: number | string;
    /**
     * The width of the placeholder.
     *
     * @default 100%
     * @type string
     */
    width?: number | string;
    /** An optional label for the placeholder. */
    label?: string;
    /** Optional children to display inside the placeholder instead of the label. */
    children?: ReactNode;
};

/**
 * A utility component that serves as a placeholder for examples.
 *
 * @name ExamplePlaceholder
 * @phase Utility
 */
export function ExamplePlaceholder({
    height = 100,
    width = '100%',
    label,
    children,
    ...props
}: ElementProps<ExamplePlaceholderProps, 'div'>) {
    return (
        <div
            {...props}
            data-pttrn-utility="example-placeholder"
            style={{
                flexDirection: 'column',
                gap: 'var(--usa-spacing-05)',
                width: dimension(width),
                height: dimension(height),
                background: 'var(--theme-color-base-lighter)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                font: '400 var(--usa-font-size-sans-1)/16px var(--usa-font-family-body)',
                ...props.style,
            }}
        >
            {children || label || (
                <>
                    <Txt variant="labels-large">{dimension(width)}</Txt>
                    <Txt>&times;</Txt>
                    <Txt variant="labels-large">{dimension(height)}</Txt>
                </>
            )}
        </div>
    );
}
