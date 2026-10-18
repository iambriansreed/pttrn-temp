/* eslint-disable react/no-multi-comp */
import Contributing from '../../CONTRIBUTING.md?raw';
import Guidelines from '../../GUIDELINES.md?raw';
import FigmaPlugin from '../../figma-plugin/README.md?raw';
import { ComponentPage } from 'components/ComponentPage';
import { Markdown } from 'components/Markdown.tsx';
import { Page } from 'components/Page';
import { Page404 } from 'components/Page404.tsx';
import { Colors } from 'src/docs/colors';
import { Components } from 'src/docs/components';
import { Hooks } from 'src/docs/hooks';
import { Icons } from 'src/docs/icons';
import Intro from 'src/docs/intro.md?raw';
import { Stylesheets } from 'src/docs/styles';
import Tokens from 'src/docs/tokens.md?raw';
import { Typography } from 'src/docs/typography.tsx';
import { Welcome } from 'src/docs/welcome';
import { componentsMeta, MetaComponentName, typesMeta } from 'src/meta';
import { RouteLink } from 'src/types';
import { pascalCaseToTitleCase } from 'src/utils/strings';

const componentRoutes = componentsMeta.reduce(
    (
        acc,
        component,
    ): {
        block: RouteLink[];
        standard: RouteLink[];
        utility: RouteLink[];
    } => {
        const kind = component.blockConfigs ? 'block' : component.phase === 'Utility' ? 'utility' : 'standard';
        acc[kind].push({
            path: `/${component.slug}`,
            id: component.slug,
            title: pascalCaseToTitleCase(component.name),
            Component: () => <ComponentPage componentName={component.name as MetaComponentName} />,
            hide: !!component.generated,
        });
        return acc;
    },
    { block: [], standard: [], utility: [] },
);
export const routes: RouteLink[] = [
    {
        title: '',
        path: '/',
        Component: Welcome,
        hide: true,
        hideSideNav: true,
    },
    {
        title: 'Sections',
        hideTitle: true,
        children: [
            {
                path: '/get-started',
                Component: () => (
                    <Page>
                        <Markdown md={Intro} />
                    </Page>
                ),
                title: 'Get Started',
            },
            { path: '/components', Component: Components, title: 'Components' },
            { path: '/icons', Component: Icons, title: 'Icons', noIndex: true },
            {
                path: '/tokens',
                Component: () => (
                    <Page>
                        <Markdown md={Tokens} />
                    </Page>
                ),
                title: 'Design Tokens',
            },
            { path: '/styles', Component: Stylesheets, title: 'Styles' },
            { path: '/typography', Component: Typography, title: 'Typography' },
            {
                path: '/figma-plugin',
                Component: () => (
                    <Page>
                        <Markdown md={FigmaPlugin} />
                    </Page>
                ),
                title: 'Figma Plugin',
            },
            {
                path: '/contributing',
                Component: () => (
                    <Page>
                        <Markdown md={Contributing} />
                    </Page>
                ),
                title: 'Contributing',
            },
            {
                path: '/guidelines',
                Component: () => (
                    <Page>
                        <Markdown md={Guidelines} />
                    </Page>
                ),
                title: 'Guidelines',
            },
            {
                path: '/colors',
                Component: Colors,
                title: 'Colors',
                hideSideNav: true,
            },
        ],
    },
    {
        title: 'Blocks',
        children: componentRoutes.block,
    },

    {
        title: 'Components',
        children: componentRoutes.standard,
    },
    {
        path: '*',
        title: 'Not Found',
        hide: true,
        Component: Page404,
        noIndex: true,
    },
    {
        title: 'Utilities',
        children: [
            {
                path: '/hooks',
                Component: Hooks,
                title: 'Hooks',
                noIndex: true,
            },
            ...componentRoutes.utility,
        ],
    },
];

export function showUtilityComponent(component: (typeof componentsMeta)[number]) {
    const componentProps = typesMeta.find((t) => t.name === `${component.name}Props`);
    return !!componentProps?.properties?.length;
}
