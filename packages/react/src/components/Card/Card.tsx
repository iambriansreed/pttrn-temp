import './card.scss';
import { ReactNode } from 'react';
import { ElementProps, SetRef } from '-/types/common';

export type CardProps = {
    /**
     * The content of the card.
     *
     * @required
     */
    children: ReactNode;
    /**
     * Determines how the card border will appear.
     *
     * @default elevated
     */
    variant?: 'elevated' | 'outlined';
    /** A ref to the list item div element. */
    innerRef?: SetRef<HTMLElement>;
};

/**
 * Cards are often rectangular and contain various content, such as text, images, icons, multimedia, and interactive
 * elements.
 *
 * They are similar in size and shape to playing cards and are intended to encourage users to click or tap to view more
 * details.
 *
 * @example
 *     import { Card } from '@ptrn/react/card';
 *
 *     <Card variant="elevated" style={{ padding: 'var(--usa-spacing-2)', maxWidth: '100%', width: '400px' }}>
 *         <h3>Card Title</h3>
 *         <p>This is some content inside the card.</p>
 *     </Card>;
 *
 * @name Card
 * @phase Stable
 */
export function Card({ children, variant = 'elevated', innerRef, ...props }: ElementProps<CardProps, 'div'>) {
    return (
        <div {...props} data-pttrn="card" data-variant={variant} ref={innerRef}>
            {children}
        </div>
    );
}
