import { SnackbarManager } from '@ptrn/react/Snackbar/Manager';
import { UIProvider } from '@ptrn/react/UIProvider';
import { Outlet } from 'react-router';
import { ErrorBoundary } from 'components/ErrorBoundary';
import { Nav } from 'components/Nav';
import { NavContents } from 'components/NavContents';
import { GlobalStateProvider } from 'src/components/GlobalStateProvider';

import 'src/components/root.scss';

export function Root() {
    return (
        <UIProvider>
            <GlobalStateProvider>
                <Nav />
                <main data-main>
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                    <NavContents />
                </main>
                <SnackbarManager defaultTimeout={5000} />
            </GlobalStateProvider>
        </UIProvider>
    );
}
