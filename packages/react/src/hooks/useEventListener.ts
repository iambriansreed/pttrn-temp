import { useRef } from 'react';

import { useIsomorphicEffect } from './useIsomorphicEffect';

export function useEventListener<
    KW extends keyof WindowEventMap,
    KH extends keyof HTMLElementEventMap & keyof SVGElementEventMap,
    KM extends keyof MediaQueryListEventMap,
    T extends Document | HTMLElement | MediaQueryList | SVGAElement | Window = HTMLElement,
>(
    eventName: KH | KM | KW | string,
    handler: (
        event:
            Event | HTMLElementEventMap[KH] | MediaQueryListEventMap[KM] | SVGElementEventMap[KH] | WindowEventMap[KW],
    ) => void,
    element?: T,
    disabled?: boolean,
    options?: AddEventListenerOptions | boolean,
) {
    // Create a ref that stores handler
    const savedHandler = useRef(handler);

    useIsomorphicEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useIsomorphicEffect(() => {
        if (disabled) return;

        // Define the listening target
        const targetElement: T | Window = element ?? window;

        if (!(targetElement && targetElement.addEventListener)) return;

        // Create event listener that calls handler function stored in ref
        const listener: typeof handler = (event) => {
            savedHandler.current(event);
        };

        targetElement.addEventListener(eventName, listener, options);

        // Remove event listener on cleanup
        return () => {
            targetElement.removeEventListener(eventName, listener, options);
        };
    }, [eventName, element, options]);
}
