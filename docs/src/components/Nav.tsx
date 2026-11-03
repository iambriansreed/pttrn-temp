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
import { useLocation, useNavigate } from 'react-router-dom';
import { NavSide } from 'components/NavSide';
import { SearchModal } from 'components/SearchModal';
import { MODE, UI_HASH, BUILD } from 'src/meta';
import { useGlobalState } from 'src/utils/globalState';
import { DOCUMENTED_PACKAGE } from 'src/utils/packages';
import useHotkeys from 'src/utils/useHotkeys';
import { useRouteMeta } from 'src/utils/useRouteMeta';

export function Nav() {
    const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
    const [navModalOpen, setNavModalOpen] = useState<boolean>(false);
    const { theme, setTheme } = useGlobalState();

    const { isDesktop } = useUIContext();

    useHotkeys('meta+k', () => setSearchModalOpen(true));

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'instant',
        });
    }, [location.pathname]);

    useEffect(() => {
        // By id rather than as a selector: heading ids can start with a digit, which a selector cannot.
        const element = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (!element) return;
        window.scrollTo({
            top: element.getBoundingClientRect()?.top + window.scrollY - 100,
            behavior: 'instant',
        });
    }, [location.hash]);

    const routeMeta = useRouteMeta();

    // Which build this is, next to the version: a local checkout, the dev server or a test build. Production shows none.
    const stage = BUILD === 'local' ? 'LOCAL' : { development: 'DEV', test: 'TEST', production: '' }[MODE];
    const build = stage && `${stage}${UI_HASH ? ` (${UI_HASH})` : ''}`;

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
                    <div data-identity>
                        <h1 data-brand>
                            <Link data-name href="/" label="pttrn" variant="subtle" />
                        </h1>
                        <span data-version>
                            <span data-version-prefix>Documents </span>
                            <Link
                                href="/changelog"
                                label={`${DOCUMENTED_PACKAGE.name} ${DOCUMENTED_PACKAGE.version}`}
                                onClick={(event) => {
                                    event.preventDefault();
                                    navigate('/changelog');
                                }}
                                variant="subtle"
                            />
                        </span>
                    </div>
                    {build && <span data-build>{build}</span>}
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
