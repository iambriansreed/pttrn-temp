import { Markup } from 'components/Markup';
import { Page } from 'components/Page';
import { Syntax } from 'components/Syntax';
import { utilitiesMeta } from 'src/meta';
import { kebabCase } from 'utils/kebabCase';

const hooks = utilitiesMeta
    .filter((utility) => utility.name.startsWith('use'))
    .map((utility) => ({
        ...utility,
        hash: kebabCase(utility.name),
    }));

export function Hooks() {
    return (
        <Page>
                <h1>Hooks</h1>
                <p>
                    <code>@ptrn/react</code> comes with a few hooks to help build your components. These hooks help make
                    working with the components more efficient and consistent.
                </p>
                {hooks.map((hook, index) => (
                    <div key={index} style={{ marginTop: 'var(--usa-spacing-5)' }}>
                        <h2>{hook.name}</h2>
                        <Markup>{hook.description}</Markup>
                        {hook.example && <Syntax code={hook.example} />}
                    </div>
                ))}
            </Page>
    );
}
