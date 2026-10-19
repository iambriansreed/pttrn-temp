import './snackbar.scss';
import { FocusTrap } from 'focus-trap-react';
import { ReactNode, isValidElement, useEffect, useRef } from 'react';
import { Button } from '-/components/Button';
import { Portal } from '-/components/Portal';
import { Truncated } from '-/components/Truncated';
import { useId } from '-/hooks/useId';
import { CommonProps, SetRef } from '-/types/common';

export type SnackbarProps = CommonProps<'id'> & {
    /**
     * Text to be shown in the snackbar
     *
     * @required
     */
    text: string;
    /**
     * Whether to show a close button on the snackbar.
     *
     * Since there is no default timeout, this is true by default. You can provide a timeout to auto-dismiss the
     * snackbar in addition to the close button.
     *
     * @default true
     */
    closeButton?: boolean;
    /**
     * Label for the close button.
     *
     * @default Dismiss
     */
    closeButtonLabel?: string;
    /**
     * The icon of the button.
     *
     * @type PttrnIcon
     */
    icon?: ReactNode;
    /**
     * Callback when the snackbar is dismissed
     *
     * @required
     */
    onClose: () => void;
    /**
     * Time in milliseconds after which the snackbar will auto dismiss.
     *
     * If no timeout is provided, and closeButton is set to false the snackbar will not be dismissable.
     */
    timeout?: number;
    /**
     * If the snackbar is open or not.
     *
     * @default false
     */
    open?: boolean;
    /** A ref to the snackbar element. */
    innerRef?: SetRef<HTMLDivElement>;
    /**
     * If focus trapping should be disabled. Generally this should not be disabled as snackbars should always trap
     * focus.
     *
     * @default false
     */
    disableFocusTrap?: boolean;
};

/**
 * Snackbars provide brief feedback about user actions. Because they use a focus trap, they interrupt the user's
 * workflow and should be used sparingly.
 *
 * #### Inline
 *
 * Render the Snackbar inside the component that triggers it and control visibility with local state/props. This is
 * simple and useful for small or isolated components, but can lead to duplicate snackbars or inadvertent render loops
 * if state is not managed carefully.
 *
 * #### Managed
 *
 * Use the SnackbarManager together with `sendSnackbar` and `clearSnackbar` to control snackbars globally. This lets any
 * part of the app trigger snackbars without prop drilling and helps avoid duplicates. and prevents duplicate snackbars
 * from being shown.
 *
 * @example
 *     import { Snackbar } from '@ptrn/react/Snackbar';
 *     import { Button } from '@ptrn/react/Button';
 *     import { sendSnackbar } from '@ptrn/react/Snackbar/Manager';
 *
 *     () => {
 *         const [snackbarOpen, setSnackbarOpen] = useState(false);
 *
 *         return (
 *             <>
 *                 // -- inline snackbar
 *                 <Button label="Show snackbar" onClick={() => setSnackbarOpen(true)} size="medium" title="Snackbar" />
 *                 <Snackbar text="I am an example." open={snackbarOpen} onClose={() => setSnackbarOpen(false)} />
 *                 // -- managed snackbar
 *                 <Button
 *                     label="Show managed snackbar"
 *                     onClick={() => sendSnackbar({ text: 'I am a managed snackbar!' })}
 *                 />
 *             </>
 *         );
 *     };
 *
 * @name Snackbar
 * @phase Stable
 */
export function Snackbar({
    id: propId,
    text,
    timeout,
    closeButton = true,
    closeButtonLabel = 'Dismiss',
    icon,
    onClose,
    open = false,
    innerRef,
    disableFocusTrap = false,
}: SnackbarProps) {
    const id = useId(propId);
    const boxRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (open && timeout) {
            const timer = setTimeout(() => {
                onClose?.();
            }, timeout);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [open, timeout, onClose]);

    if (!open) return null;

    return (
        <Portal>
            <div aria-live="off" data-pttrn="snackbar" id={id} ref={innerRef}>
                <FocusTrap
                    active={!disableFocusTrap}
                    focusTrapOptions={{
                        clickOutsideDeactivates: true,
                        fallbackFocus: () => boxRef.current!,
                    }}
                >
                    <div data-snackbar-content key={id} ref={boxRef} role="alert" tabIndex={-1}>
                        <div data-snackbar-icon-text>
                            {!!icon && isValidElement(icon) && (
                                <span aria-hidden={true} data-snackbar-icon>
                                    {icon}
                                </span>
                            )}
                            <Truncated data-label>{text}</Truncated>
                        </div>
                        {closeButton && <Button label={closeButtonLabel} onClick={onClose} variant="tertiary" />}
                    </div>
                </FocusTrap>
            </div>
        </Portal>
    );
}
