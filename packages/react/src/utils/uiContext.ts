import { AriaAttributes, createContext } from 'react';

/** The USWDS themes in @ptrn/styles. UIProvider sets the current one as `data-uswds-theme` on `<html>`. */
export const COLOR_THEMES = ['default', 'project-theme', 'project-theme-dark'] as const;

export type ColorTheme = (typeof COLOR_THEMES)[number];

/** Whether a theme has a dark background. */
export const isDarkTheme = (theme: ColorTheme) => theme.endsWith('-dark');

export type AriaLiveMessage = { message: string; live?: Exclude<AriaAttributes['aria-live'], 'off' | undefined> };

export type UIContextProps = {
    theme: ColorTheme;
    setTheme: (theme: ColorTheme) => void;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
};

export const UIContext = createContext<UIContextProps | undefined>(undefined);
