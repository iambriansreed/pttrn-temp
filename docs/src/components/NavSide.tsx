import { SvgDeleteForever } from '@ptrn/icons/DeleteForever';
import { Button } from '@ptrn/react/Button';
import { Divider } from '@ptrn/react/Divider';
import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { routes } from 'src/routes';
import { RouteLink } from 'src/types';
import { useGlobalState } from 'src/utils/globalState';

export const NavSide = () => {
    const location = useLocation();
    const { resetGlobalState } = useGlobalState();

    return (
        <nav data-navigation>
            <div role="menu">
                {routes
                    .filter((r) => !r.hide)
                    .map((route, index) => (
                        <Fragment key={route.title}>
                            {route.children && route.children.length > 0 && (
                                <>
                                    {index > 0 && <Divider />}
                                    {!route.hideTitle && <div data-header>{route.title}</div>}
                                </>
                            )}
                            {(route.children || [route])
                                .filter((r) => !r.hide)
                                .map((r: RouteLink) => (
                                    <Link
                                        data-link
                                        data-selected={location.pathname === r.path || undefined}
                                        data-subtle
                                        key={r.path}
                                        role="menuitem"
                                        to={r.path!}
                                    >
                                        {r.title}
                                    </Link>
                                ))}
                        </Fragment>
                    ))}
            </div>
            <Button
                destructive
                icon={<SvgDeleteForever />}
                label="Reset All State"
                onClick={() => {
                    resetGlobalState();
                    setTimeout(() => window.location.reload(), 100);
                }}
                size="x-small"
                style={{ margin: 'var(--usa-spacing-1)' }}
            />
        </nav>
    );
};
