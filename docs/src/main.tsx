// The fonts load through Vite, which bundles the @fontsource files; the React package does not inject them.
import '@ptrn/styles/fonts.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Root } from 'components/Root';
import { routes } from 'src/routes';

const router = createBrowserRouter([{ Component: Root, children: routes as any }]);

const root = document.getElementById('root')!;

createRoot(root).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
);

setTimeout(() => {
    /* This is used to help make F.O.U.C. less noticeable */
    root.classList.add('loaded');
}, 500);
