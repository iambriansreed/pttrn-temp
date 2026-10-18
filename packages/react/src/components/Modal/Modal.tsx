import './modal.scss';
import { SvgClose } from '@ptrn/icons/Close';
import { ReactNode, useMemo, useRef } from 'react';
import { Button, ButtonProps } from '-/components/Button';
import { DialogProps, Dialog } from '-/components/Dialog';
import { useEventListener } from '-/hooks/useEventListener';
import { useUIContext } from '-/hooks/useUIContext';
import { CallToActionButton } from '-/types/common';

function useMatchParentHeight() {
    const elementRef = useRef<HTMLDivElement | null>(null);
    const updateHeight = () => {
        const element = elementRef.current;
        const parentElement = element?.parentElement;
        if (!element || !parentElement) return;
        // Reset height to allow shrinking or growing
        element.style.height = '';
        // Apply new height on next frame
        requestAnimationFrame(() => {
            element.style.height = `${parentElement.clientHeight}px`;
        });
    };
    useEventListener('resize', updateHeight);
    useEventListener('orientationchange', updateHeight);

    return {
        setElement: (el: HTMLDivElement | null) => {
            elementRef.current = el;
            updateHeight();
        },
    };
}

export type ModalCallToAction = Pick<ButtonProps, 'destructive'> & Pick<CallToActionButton, 'label' | 'onClick'>;

export type ModalProps = Pick<
    DialogProps,
    'container' | 'disableFocusTrap' | 'id' | 'innerRef' | 'onClose' | 'open' | 'owner'
> & {
    /**
     * Modal header.
     *
     * @example
     *     Change your email
     *
     * @required
     */
    header: string;
    /**
     * Modal description. Used for the
     * [aria-description](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-description)
     * attribute.
     *
     * @example
     *     Email change confirmation.
     *
     * @required
     */
    description: string;
    /**
     * Whether to show the cancel button in the footer.
     *
     * Providing a string will set the label of the cancel button.
     *
     * @default false
     */
    cancelButton?: boolean | string;
    /**
     * The call to action button to display in the footer of the modal.
     *
     * @example
     *     {label: 'Confirm',
     *     onClick: () => action('Confirm clicked'),}
     */
    callToAction?: ModalCallToAction;
    /**
     * The format of the buttons in the footer. Vertical applies only on screen widths less than or equal to 640px.
     *
     * @default horizontal
     */
    buttonFormat?: 'horizontal' | 'vertical';
    /**
     * The content of the modal.
     *
     * @example
     *     Are you sure you want to change your email address? A confirmation email will be sent to your new address to verify the change. Please check your inbox and follow the instructions to complete the process.
     *
     * @type multiline
     */
    children?: ReactNode;
};

/**
 * Modals display important information that users need to acknowledge. They appear over the interface and block further
 * interactions until an action is selected. Modal is a wrapper around the Dialog component that provides a header and
 * footer for the dialog.
 *
 * @example
 *     import { Button } from '@ptrn/react/Button';
 *     import { Modal } from '@ptrn/react/Modal';
 *
 *     () => {
 *         const [open, setOpen] = useState(false);
 *
 *         return (
 *             <>
 *                 <Button label="Open Modal" onClick={() => setOpen(true)} />
 *                 <Modal
 *                     description="Example description"
 *                     header="Example header"
 *                     onClose={() => setOpen(false)}
 *                     open={open}
 *                 >
 *                     Example Modal
 *                 </Modal>
 *             </>
 *         );
 *     };
 *
 * @name Modal
 * @phase Stable
 */
export function Modal({
    header,
    description,
    children,
    callToAction,
    cancelButton,
    buttonFormat = 'horizontal',
    innerRef,
    disableFocusTrap,
    ...dialogProps
}: ModalProps) {
    const { isMobile } = useUIContext();

    const buttons: ButtonProps[] = useMemo(() => {
        const nextButtons: ButtonProps[] = [];

        if (callToAction) {
            nextButtons.push({
                ...callToAction,
                variant: 'primary',
                size: isMobile ? 'medium' : 'small',
            });
        }

        if (callToAction && cancelButton) {
            nextButtons.push({
                label: typeof cancelButton === 'string' ? cancelButton : 'Cancel',
                onClick: dialogProps.onClose,
                variant: 'tertiary',
                size: isMobile ? 'medium' : 'small',
            });
        }

        return nextButtons;
    }, [callToAction, cancelButton, dialogProps.onClose, isMobile]);

    const { setElement } = useMatchParentHeight();

    return (
        <Dialog
            {...dialogProps}
            aria-description={description}
            aria-label={header}
            disableFocusTrap={disableFocusTrap}
            placement="center"
            showScrim
        >
            <div
                data-pttrn="modal"
                ref={(node) => {
                    innerRef?.(node);
                    setElement(node);
                }}
            >
                <div data-modal-header>
                    <div data-modal-title>{header}</div>
                    <Button
                        icon={<SvgClose />}
                        iconOnly
                        label="close"
                        onClick={dialogProps.onClose}
                        size={isMobile ? 'medium' : 'small'}
                        variant="tertiary"
                    />
                </div>
                <div data-modal-main>{children}</div>
                {Array.isArray(buttons) && buttons.length > 0 && (
                    <div data-button-format={buttonFormat} data-modal-footer>
                        {buttons.map((buttonProps, idx) => (
                            <Button
                                key={idx}
                                {...buttonProps}
                                size={isMobile ? 'medium' : 'small'}
                                width={buttonFormat === 'vertical' && isMobile ? 'fill' : 'hug'}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Dialog>
    );
}
