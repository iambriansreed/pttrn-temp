import { useUIContext } from '@ptrn/react/hooks/useUIContext';
import { ColorTheme } from '@ptrn/react/utils/uiContext';
import { createContext, useContext } from 'react';

export const globalStateDefault: GlobalStateContext = {
    showTouchTarget: false,
    setShowTouchTarget: () => {},
    resetGlobalState: () => {},
    theme: 'default',
} as const;

export type GlobalState = {
    showTouchTarget?: boolean;
    theme: ColorTheme;
};

export type GlobalStateContext = GlobalState & {
    setShowTouchTarget: (showTouchTarget: boolean) => void;
    resetGlobalState: () => void;
};

export const globalStateContext = createContext<GlobalStateContext | null>(null);

export function useGlobalState(): GlobalStateContext & { theme: ColorTheme; setTheme: (theme: ColorTheme) => void } {
    const globalState = useContext(globalStateContext);

    const { theme, setTheme } = useUIContext();

    return { ...(globalState || globalStateDefault), theme, setTheme };
}
