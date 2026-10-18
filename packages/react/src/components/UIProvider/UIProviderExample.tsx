import { UIProviderProps } from '.';
import { ComponentExample, Preset } from '-/utils/demo';

export const presets: Preset<UIProviderProps>[] = [];

export const UIProviderExample: ComponentExample<UIProviderProps> = {
    defaultState: {},
    disableProps: [],
    presets,
    sections: [
        {
            title: 'Theme Switching',
            content: ({ Syntax }) => (
                <div style={{}}>
                    <Syntax
                        code={`// Example usage of theme switching
import { useContext } from 'react';
import { useUIContext } from '-/hooks/useUIContext';

export function ThemeSwitcher() {
    const {theme, setTheme} = useUIContext();

    return (
        <div>
            <p>Current theme: {theme}</p>
            <button onClick={() => setTheme('default')}>Default</button>
            <button onClick={() => setTheme('project-theme')}>Project</button>
            <button onClick={() => setTheme('project-theme-dark')}>Project dark</button>
        </div>
    );
}`}
                        language="typescript"
                    />
                </div>
            ),
        },
        {
            title: 'Responsive Helpers',
            content: ({ Syntax }) => (
                <div style={{}}>
                    <Syntax
                        code={`// Example usage of isMobile, isTablet, and isDesktop
import { useContext } from 'react';
import { useUIContext } from '-/hooks/useUIContext';

export function ResponsiveComponent() {
    const {isMobile, isTablet, isDesktop} = useUIContext();

    return (
        <div>
            {isMobile && <p>This is a mobile device.</p>}
            {isTablet && <p>This is a tablet device.</p>}
            {isDesktop && <p>This is a desktop device.</p>}
        </div>
    );
}`}
                        language="typescript"
                    />
                </div>
            ),
        },
    ],
    variants: {},
};
