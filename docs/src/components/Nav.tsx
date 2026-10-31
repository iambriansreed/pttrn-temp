import { SvgDarkMode } from '@ptrn/icons/DarkMode';
import { SvgDarkModeFill } from '@ptrn/icons/DarkModeFill';
import { SvgMenu } from '@ptrn/icons/Menu';
import { SvgSearch } from '@ptrn/icons/Search';
import { Button } from '@ptrn/react/Button';
import { Dialog } from '@ptrn/react/Dialog';
import { Link } from '@ptrn/react/Link/Link';
import { useUIContext } from '@ptrn/react/hooks/useUIContext';
import { isDarkTheme } from '@ptrn/react/utils/uiContext';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { NavSide } from 'components/NavSide';
import { SearchModal } from 'components/SearchModal';
import { MODE, VERSION, UI_HASH, BUILD } from 'src/meta';
import { useGlobalState } from 'src/utils/globalState';
import useHotkeys from 'src/utils/useHotkeys';
import { useRouteMeta } from 'src/utils/useRouteMeta';

export function Nav() {
    const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
    const [navModalOpen, setNavModalOpen] = useState<boolean>(false);
    const { theme, setTheme } = useGlobalState();

    const { isDesktop } = useUIContext();

    useHotkeys('meta+k', () => setSearchModalOpen(true));

    const location = useLocation();

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'instant',
        });
    }, [location.pathname]);

    useEffect(() => {
        let element;

        try {
            element = location.hash && document.querySelector(location.hash);
        } catch {
            // location.hash may not be a valid selector.
        }
        if (!element) return;
        window.scrollTo({
            top: element.getBoundingClientRect()?.top + window.scrollY - 100,
            behavior: 'instant',
        });
    }, [location.hash]);

    const routeMeta = useRouteMeta();

    const hideSideNav = useMemo(() => !isDesktop || routeMeta?.hideSideNav, [routeMeta?.hideSideNav, isDesktop]);

    return (
        <>
            <div data-body-width data-navbar>
                <span data-backdrop />
                <div data-header>
                    {hideSideNav && (
                        <Button
                            icon={<SvgMenu />}
                            iconOnly
                            label="Menu"
                            onClick={() => setNavModalOpen(true)}
                            size="large"
                            style={{ padding: 0 }}
                            variant="tertiary"
                        />
                    )}
                    <h1 data-brand>
                        <Link data-name href="/" label="pttrn" variant="subtle" />
                        {BUILD === 'local' ? (
                            <span>LOCAL ({UI_HASH})</span>
                        ) : (
                            <>
                                <span>
                                    Version: {VERSION}
                                    {BUILD !== '0' ? `.${BUILD}` : ''}
                                </span>
                                {MODE === 'development' && (
                                    <span>
                                        DEV
                                        {UI_HASH ? ` (${UI_HASH})` : ''}
                                    </span>
                                )}
                                {MODE === 'test' && (
                                    <span>
                                        TEST
                                        {UI_HASH ? ` (${UI_HASH})` : ''}
                                    </span>
                                )}
                            </>
                        )}
                    </h1>
                </div>
                <div data-navbar-right="">
                    <Button
                        icon={isDarkTheme(theme) ? <SvgDarkModeFill /> : <SvgDarkMode />}
                        iconOnly
                        label={`Switch to ${isDarkTheme(theme) ? 'light' : 'dark'} mode`}
                        onClick={() => setTheme(isDarkTheme(theme) ? 'default' : 'project-theme-dark')}
                        variant="secondary"
                    />
                    <Button
                        data-search-button={true}
                        label="Search... ⌘K"
                        onClick={(event) => {
                            (event.target as HTMLInputElement).blur();
                            setSearchModalOpen(true);
                        }}
                        variant="secondary"
                    >
                        <SvgSearch />
                        <span data-search-text>Search... ⌘K</span>
                    </Button>
                    <SearchModal onClose={() => setSearchModalOpen(false)} open={searchModalOpen} />
                </div>
            </div>
            {hideSideNav ? (
                <Dialog
                    aria-label="Navigation"
                    onClose={() => setNavModalOpen(false)}
                    open={navModalOpen}
                    placement="left"
                >
                    <NavSide />
                </Dialog>
            ) : (
                <NavSide />
            )}
        </>
    );
}
