import { Page } from 'components/Page';
import { Syntax } from 'components/Syntax';

export function Stylesheets() {
    return (
        <Page>
            <h3>Style</h3>
            <p>
                The styles use the USWDS design tokens, exported from the USWDS Design Kit in Figma as CSS variables.
                There are three USWDS themes: <code>default</code>, <code>project-theme</code> and{' '}
                <code>project-theme-dark</code>. The page uses <code>default</code> until a{' '}
                <code>data-uswds-theme</code> attribute picks another one, on the html tag or on any element.
            </p>
            <div>
                <Syntax code='<html data-uswds-theme="project-theme-dark">' language="html" />
            </div>

            <h3 title="Style Providers">Providers</h3>
            <p>
                If you are using <strong>@ptrn/react</strong> React components, render the style provider once. It adds
                the tokens, every theme and the base styles to the page. <code>UIProvider</code> sets{' '}
                <code>data-uswds-theme</code> from its <code>theme</code>.
            </p>
            <Syntax
                code={`import { StylesProvider } from '@ptrn/react/StylesProvider';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <StylesProvider />
        <RouterProvider router={router} />
    </StrictMode>,
);`}
                language="typescript"
            />

            <h3>Stylesheets</h3>
            <p>
                Without <strong>@ptrn/react</strong>, load the stylesheets from the <code>@ptrn/styles</code> package:
                the tokens, then one theme. Each theme file is complete, and each variable has its exact Figma name in a
                comment above it.
            </p>
            <Syntax
                code={`import '@ptrn/styles/reset.css';\nimport '@ptrn/styles/tokens.css';\nimport '@ptrn/styles/themes/default.css';`}
                language="typescript"
            />

            <h3>CSS Variables Plugin</h3>
            <p>
                For pttrn UI development we use{' '}
                <a href="https://marketplace.visualstudio.com/items?itemName=vunguyentuan.vscode-css-variables">
                    CSS Variable Autocomplete
                </a>{' '}
                extension to help with CSS variable autocompletion.
            </p>
            <p>
                It&apos;s super helpful when you&apos;re working with CSS variables and need to include the exact name
                of the variable.
            </p>
        </Page>
    );
}
