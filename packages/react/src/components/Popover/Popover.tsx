import './popover.scss';
import { SvgClose } from '@ptrn/icons/Close';
import { FocusTrap } from 'focus-trap-react';
import { ReactElement, useRef, useState } from 'react';
import { Button } from '-/components/Button';
import { Portal } from '-/components/Portal';
import { Txt } from '-/components/Txt';
import { Placement, useFloating, UseFloatingProps } from '-/hooks/useFloating';
import { useId } from '-/hooks/useId';
import { useOutsideClick } from '-/hooks/useOutsideClick';
import { CallToActionButton, CommonProps, ElementProps } from '-/types/common';
import { cssWithVars } from '-/utils/cwv';

export type PopoverTriggerProps = {
    onClick?: () => void;
    'aria-describedby'?: string;
};

export type PopoverProps = CommonProps<'disabled'> &
    Pick<UseFloatingProps, 'refWidth'> & {
        /**
         * The placement of the popover.
         *
         * @default top
         */
        placement?: Placement;
        /** The popover header. */
        header: string;
        /**
         * The content of the popover.
         *
         * @type multiline
         */
        content: string;
        /**
         * The call to action button properties.
         *
         * @type CallToActionButton
         */
        callToAction?: CallToActionButton;
        /**
         * The secondary call to action button properties.
         *
         * @type CallToActionButton
         */
        secondaryCallToAction?: CallToActionButton;
        /**
         * A callback to render the trigger element.
         *
         * @required
         */
        children: (triggerProps: PopoverTriggerProps) => ReactElement | null;
    };

/**
 * Brief message that provide additional guidance and helps users perform an action if needed.
 *
 * @example
 *     import { Popover } from '@ptrn/react/Popover';
 *     import { Button } from '@ptrn/react/Button';
 *
 *     <Popover
 *         placement="bottom"
 *         content="This is a popover content"
 *         header="Popover Header"
 *         callToAction={{
 *             label: 'Action',
 *             onClick: () => action('Action clicked'),
 *         }}
 *     >
 *         {(triggerProps) => <Button {...triggerProps} label="Toggle popover" />}
 *     </Popover>;
 *
 * @name Popover
 * @phase Stable
 */
export function Popover({
    placement = 'top',
    header,
    content,
    callToAction,
    secondaryCallToAction,
    children,
    disabled = false,
    refWidth,
    ...props
}: ElementProps<PopoverProps, 'div'>) {
    const id = useId();
    const [show, setShow] = useState(false);
    const arrowRef = useRef<HTMLElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);

    const { elements, floatingStyles, middlewareData } = useFloating({
        placement: placement,
        strategy: 'absolute',
        offsetOptions: 22,
        arrowRef,
        hide: !show,
        refWidth,
    });

    // The trigger counts as inside: its own click toggles the popover, so a mousedown on it must not close it first.
    useOutsideClick({
        elements: [elements.floating, elements.reference],
        callback: () => setShow(false),
        disabled: !show,
    });

    const basicArrowX = middlewareData?.arrow?.x ? `${middlewareData.arrow.x}px` : '0px';

    const getArrowX = () => {
        if (middlewareData?.arrow?.x) {
            if (placement === 'top-start' || placement === 'bottom-start') return '16px';
            if (placement === 'top' || placement === 'bottom') return `${middlewareData.arrow.x}px`;
            if (placement === 'top-end' || placement === 'bottom-end')
                return `${(middlewareData.arrow.x * 2 || 32) - 16}px`;
        }
        return '0px';
    };

    if (disabled) return children({});
    return (
        <>
            {children({
                onClick: () => setShow(!show),
                'aria-describedby': id,
            })}
            {show && (
                <Portal>
                    <FocusTrap
                        focusTrapOptions={{
                            fallbackFocus: () => panelRef.current || document.body,
                            clickOutsideDeactivates: true,
                        }}
                    >
                        <div
                            data-placement={middlewareData?.offset?.placement}
                            data-pttrn="popover"
                            id={id}
                            ref={(node) => {
                                panelRef.current = node;
                                elements.setFloating(node);
                                elements.setReference(
                                    document.querySelector<HTMLElement>(`[aria-describedby="${id}"]`),
                                );
                            }}
                            style={{ ...floatingStyles, ...props.style }}
                            tabIndex={-1}
                        >
                            <header>
                                <Txt variant="heading-h6">{header}</Txt>
                                <Button
                                    data-close
                                    icon={<SvgClose />}
                                    iconOnly
                                    label="Close"
                                    onClick={() => setShow(false)}
                                    variant="tertiary"
                                />
                            </header>
                            <div data-content>
                                <Txt as="div" variant="body-small">
                                    {content}
                                </Txt>
                                <div data-cta-row>
                                    {secondaryCallToAction?.label && secondaryCallToAction?.onClick && (
                                        <Button
                                            label={secondaryCallToAction.label}
                                            onClick={secondaryCallToAction.onClick}
                                            size="small"
                                            variant="secondary"
                                        />
                                    )}
                                    {callToAction?.label && callToAction?.onClick && (
                                        <Button
                                            label={callToAction.label}
                                            onClick={callToAction.onClick}
                                            size="small"
                                            variant="primary"
                                        />
                                    )}
                                </div>
                            </div>
                            <div
                                data-arrow
                                ref={(node) => {
                                    arrowRef.current = node;
                                }}
                                style={cssWithVars({
                                    '--position-left': refWidth ? getArrowX() : basicArrowX,
                                    '--position-top': `${middlewareData?.arrow?.y || 0}px`,
                                })}
                            />
                        </div>
                    </FocusTrap>
                </Portal>
            )}
        </>
    );
}
