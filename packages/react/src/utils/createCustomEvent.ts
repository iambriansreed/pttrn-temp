import { ReactElement } from 'react';
import { useEventListener } from '-/hooks/useEventListener';

/**
 * What a pttrn custom event may carry: plain data, functions, and rendered React elements (a snackbar's icon). Events
 * stay inside the document, so nothing here is ever serialized.
 */
export type CustomEventDetail =
    | Array<CustomEventDetail>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    | Function
    | ReactElement
    | boolean
    | number
    | string
    | { [key: string]: CustomEventDetail }
    | null
    | undefined;

export type CustomEventHandler<TDetail extends CustomEventDetail> = (detail: TDetail) => void;

/**
 * Like React.createContext but for custom events using the DOM's CustomEvent system.
 *
 * This allows for communication between components without using React.Context, which can cause unnecessary re-renders.
 *
 * This generator ensures only safe detail types are used. !important;
 */
export function createCustomEvent<TDetail extends CustomEventDetail>(
    /** The name of the custom event to create. Prefix with 'pttrn-' to avoid conflicts. */
    eventName: string,
) {
    return {
        send(detail: TDetail) {
            document.dispatchEvent(new CustomEvent<TDetail>(eventName, { detail }));
        },
        useEventListener(listener: CustomEventHandler<TDetail>) {
            useEventListener(eventName, (event) => listener((event as CustomEvent<TDetail>).detail), document);
        },
    };
}
