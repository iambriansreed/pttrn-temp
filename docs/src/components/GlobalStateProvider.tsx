/* eslint-disable react-hooks/exhaustive-deps */
import { StylesProvider } from '@ptrn/react/StylesProvider';
import { useUIContext } from '@ptrn/react/hooks/useUIContext';
import { COLOR_THEMES, isDarkTheme } from '@ptrn/react/utils/uiContext';
import { PropsWithChildren, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import store from 'store';
import { BUILD, VERSION } from 'src/meta';
import { GlobalState, globalStateContext, globalStateDefault } from 'src/utils/globalState';
import { useStoreState } from 'src/utils/useStoreState';

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}

export function GlobalStateProvider({ children }: PropsWithChildren) {
    const [globalState, setState] = useStoreState<GlobalState>(`pttrn-global-${VERSION}.${BUILD}`, globalStateDefault);

    const { theme, setTheme } = useUIContext();

    const location = useLocation();

    useEffect(() => {
        if (window.gtag) {
            window.gtag('event', 'page_view', {
                page_path: location.pathname + location.search,
                page_title: document.title,
            });
        }
    }, [location]);

    useEffect(() => {
        const searchParams = Object.fromEntries(new URLSearchParams(globalThis.location.search).entries());

        // A ?theme= in the URL wins over the stored theme.
        const overrideTheme = COLOR_THEMES.find((name) => name === searchParams.theme);
        const nextTheme = overrideTheme ?? globalState.theme;
        if (nextTheme && COLOR_THEMES.includes(nextTheme)) setTheme(nextTheme);
    }, []);

    const { showTouchTarget } = globalState;

    useEffect(() => {
        document.querySelectorAll('link[data-syntax-theme]').forEach((link) => link.setAttribute('disabled', 'true'));
        document
            .querySelector(`link[data-syntax-theme="${isDarkTheme(theme) ? 'dark' : 'light'}"]`)
            ?.removeAttribute('disabled');

        if (theme !== globalState.theme) setState((prev) => ({ ...prev, theme }));
    }, [theme]);

    return (
        <>
            <StylesProvider />
            <globalStateContext.Provider
                value={useMemo(
                    () => ({
                        theme,
                        showTouchTarget,
                        setTheme,
                        setShowTouchTarget: (show: boolean) => setState((prev) => ({ ...prev, showTouchTarget: show })),
                        resetGlobalState: () => {
                            store.clearAll();
                            setState(globalStateDefault);
                        },
                    }),
                    [showTouchTarget, theme],
                )}
            >
                {children}
            </globalStateContext.Provider>
        </>
    );
}
