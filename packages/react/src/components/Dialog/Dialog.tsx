import './dialog.scss';
import { FocusTrap } from 'focus-trap-react';
import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { Portal, PortalProps } from '-/components/Portal';
import { Scrim } from '-/components/Scrim';
import { useId } from '-/hooks/useId';
import { CommonProps, ElementProps, SetRef } from '-/types/common';

export type DialogProps = CommonProps<'id' | 'owner'> &
    Pick<PortalProps, 'container'> & {
        /** The content of the dialog. */
        children?: ReactNode;
        /** A ref to the dialog element. */
        innerRef?: SetRef<HTMLDivElement>;
        /**
         * If the dialog should appear.
         *
         * @default false
         */
        open?: boolean;
        /**
         * Function to call when the dialog is closed.
         *
         * @type () => void
         * @required
         */
        onClose: () => void;
        /**
         * The placement of the dialog on the screen.
         *
         * @default center
         */
        placement?: 'bottom' | 'center' | 'left' | 'right' | 'top';
        /**
         * Whether the dialog should have a scrim behind it.
         *
         * @default true
         */
        showScrim?: boolean;
        /**
         * If the dialog should take the full width of the screen.
         *
         * @default false
         */

        widthFull?: boolean;
        /**
         * If focus trapping should be disabled. Generally this should not be disabled as dialogs should always trap
         * focus.
         *
         * @default false
         */
        disableFocusTrap?: boolean;
    };

/**
 * Dialogs display important information that users need to acknowledge. They appear over the interface and may block
 * further interactions until an action is selected.
 *
 * The Modal component is a higher-level component built on top of Dialog that includes standard dialog UI and behavior.
 *
 * The dialog needs an accessible name: pass `aria-labelledby` with the id of its heading, or `aria-label`.
 *
 * Also known as: Tray, Drawer, Flyout, Sheet
 *
 * @example
 *     import { Dialog } from '-/components/Dialog';
 *
 *     () => {
 *         const [open, setOpen] = useState(false);
 *
 *         return (
 *             <>
 *                 <Button label="Open Dialog" onClick={() => setOpen(true)} />
 *                 <Dialog aria-labelledby="dialog-title" onClose={() => setOpen(false)} open={open}>
 *                     <div style={{ padding: 'var(--usa-spacing-2)' }}>
 *                         <Flex align="center" justify="space-between">
 *                             <h1 id="dialog-title">Dialog Title</h1>
 *                             <Button
 *                                 icon={<SvgClose />}
 *                                 iconOnly
 *                                 label="Close dialog"
 *                                 onClick={() => setOpen(false)}
 *                                 variant="tertiary"
 *                             />
 *                         </Flex>
 *                         <p>This is the content of the dialog.</p>
 *                         <Button label="Cancel" onClick={() => setOpen(false)} variant="secondary" />
 *                     </div>
 *                 </Dialog>
 *             </>
 *         );
 *     };
 *
 * @name Dialog
 * @phase Stable
 */
export function Dialog({
    children,
    innerRef,
    onClose,
    open = false,
    placement = 'center',
    showScrim = true,
    widthFull = false,
    id: idProp,
    owner,
    container,
    disableFocusTrap,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'aria-description': ariaDescription,
    ...containerProps
}: ElementProps<DialogProps, 'div'>) {
    const id = useId(idProp);
    const boxRef = useRef<HTMLDivElement | null>(null);

    const handleKeyDown = useCallback((e: KeyboardEvent) => open && e.key === 'Escape' && onClose(), [onClose, open]);

    useEffect(() => {
        document.documentElement.style.overflow = open ? 'hidden' : '';
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.documentElement.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown, open]);

    return (
        open && (
            <Portal container={container}>
                <div
                    {...containerProps}
                    data-contained={!!container || undefined}
                    data-placement={placement}
                    data-pttrn="dialog"
                    data-pttrn-owner={owner || undefined}
                    id={id}
                    ref={innerRef}
                    role="presentation"
                >
                    <FocusTrap
                        active={!disableFocusTrap}
                        focusTrapOptions={{
                            clickOutsideDeactivates: true,
                            fallbackFocus: () => boxRef.current!,
                        }}
                    >
                        {/* aria-description is an ARIA 1.3 global property that the lint's ARIA data does not know yet. */}
                        {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props */}
                        <div
                            aria-describedby={ariaDescribedBy}
                            aria-description={ariaDescription}
                            aria-label={ariaLabel}
                            aria-labelledby={ariaLabelledBy}
                            aria-modal="true"
                            data-dialog-box
                            data-width-full={widthFull}
                            ref={(node) => {
                                boxRef.current = node;
                            }}
                            role="dialog"
                            tabIndex={-1}
                        >
                            {children}
                        </div>
                    </FocusTrap>
                </div>
                <Scrim
                    contained={!!container || undefined}
                    onClick={() => onClose()}
                    owner="dialog"
                    visible={showScrim !== false}
                />
            </Portal>
        )
    );
}
