import './tooltip.scss';
import { ReactElement, useRef, useState } from 'react';
import { Portal } from '-/components/Portal';
import { Placement, useFloating } from '-/hooks/useFloating';
import { useId } from '-/hooks/useId';

export type TooltipTriggerProps = {
    onMouseOver?: () => void;
    onMouseLeave?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    /** The tooltip names the trigger by default. A trigger with its own name drops this and keeps the anchor below. */
    'aria-labelledby'?: string;
    /** The tooltip's id. The tooltip finds its trigger by it, so positioning never depends on how the trigger is named. */
    'data-tooltip-trigger'?: string;
};

export type TooltipProps = {
    /**
     * The placement of the tooltip.
     *
     * @default top
     */
    placement?: Extract<Placement, 'bottom' | 'left' | 'right' | 'top'>;
    /** The tooltip content. */
    label: string;
    /**
     * A callback to render the trigger element.
     *
     * @required
     */
    children: (triggerProps: TooltipTriggerProps) => ReactElement;
    /** Determines if the tooltip is disabled. */
    disabled?: boolean;
    /**
     * Determines if the tooltip should hide the tail.
     *
     * @default true
     */
    showTail?: boolean;
};

/**
 * Brief message that provide additional guidance and helps users perform an action if needed.
 *
 * @example
 *     import { Tooltip } from '@ptrn/react/Tooltip';
 *     import { Button } from '@ptrn/react/Button';
 *
 *     <Tooltip label="I explain what this button does" placement="top">
 *         {(triggerProps) => <Button {...triggerProps}>Click me</Button>}
 *     </Tooltip>;
 *
 * @name Tooltip
 * @phase Stable
 */
export function Tooltip({ placement = 'top', label, children, disabled = false, showTail = true }: TooltipProps) {
    const id = useId();
    const [show, setShow] = useState(false);

    const arrowRef = useRef<HTMLElement | null>(null);

    const { floatingStyles, middlewareData, elements } = useFloating({
        placement,
        strategy: 'fixed',
        offsetOptions: showTail ? 8 : 4,
        arrowRef,
        hide: !show,
        refWidth: false,
    });

    if (!label || disabled) return children({});

    return (
        <>
            {children({
                onMouseOver: () => setShow(true),
                onMouseLeave: () => setShow(false),
                onFocus: () => setShow(true),
                onBlur: () => setShow(false),
                'aria-labelledby': id,
                'data-tooltip-trigger': id,
            })}
            {label && (
                <Portal>
                    <div
                        data-placement={middlewareData?.offset?.placement}
                        data-pttrn="tooltip"
                        id={id}
                        ref={(node) => {
                            elements.setFloating(node);
                            elements.setReference(
                                document.querySelector<HTMLElement>(`[data-tooltip-trigger="${id}"]`),
                            );
                        }}
                        role="tooltip"
                        style={floatingStyles}
                    >
                        <span data-text>{label}</span>
                        <span
                            aria-hidden
                            data-arrow
                            ref={(node) => {
                                arrowRef.current = node;
                            }}
                            style={{
                                zIndex: 'var(--z-index-tooltip-popover)',
                                opacity: showTail ? 1 : 0,
                                left: middlewareData.arrow?.x != null ? `${middlewareData.arrow?.x}px` : '',
                                top: middlewareData.arrow?.y != null ? `${middlewareData.arrow?.y}px` : '',
                            }}
                        />
                    </div>
                </Portal>
            )}
        </>
    );
}
