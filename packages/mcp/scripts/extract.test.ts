import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { fixture } from '../src/core/fixture.js';
import { extractComponents, extractIcons, extractTokens, withoutStaleUsage } from './extract.js';

describe('extractTokens', () => {
    const tokensCss = `
/* header */
:root {
    /* !-usa/spacing/2 */
    --usa-spacing-2: 16px;
}
`;
    const theme = (key: string, ink: string) => `
/* header */
:where(:root), [data-uswds-theme="${key}"] {
    /* #-theme/color/ink */
    --theme-color-ink: ${ink};
    /* #-theme/border-radius/md */
    --theme-border-radius-md: 4px;
}
`;
    const themes = {
        default: theme('default', 'var(--usa-color-gray-90)'),
        'project-theme-dark': theme('project-theme-dark', 'var(--usa-color-white)'),
    };

    test('reads each custom property with its comment and group', () => {
        const tokens = extractTokens(tokensCss, themes);
        assert.deepEqual(tokens[0], {
            name: '--usa-spacing-2',
            kind: 'spacing',
            value: '16px',
            description: '!-usa/spacing/2',
        });
    });

    test('takes theme tokens from the default theme and adds the values that differ in the others', () => {
        const ink = extractTokens(tokensCss, themes).find((t) => t.name === '--theme-color-ink');
        assert.equal(ink?.kind, 'color');
        assert.equal(ink?.value, 'var(--usa-color-gray-90)');
        assert.deepEqual(ink?.themes, { 'project-theme-dark': 'var(--usa-color-white)' });
    });

    test('leaves themes unset when no other theme changes the token', () => {
        const radius = extractTokens(tokensCss, themes).find((t) => t.name === '--theme-border-radius-md');
        assert.equal(radius?.themes, undefined);
        assert.equal(radius?.value, '4px');
    });
});

describe('extractComponents', () => {
    const data = {
        componentsMeta: [
            {
                name: 'Button',
                slug: 'button',
                description: 'A button.',
                dependencies: ['Tooltip'],
                usage: { code: '<Button label="Hi" />' },
            },
            { name: 'Flex', slug: 'flex', description: 'Layout.', dependencies: [] },
        ],
        typesMeta: [
            {
                name: 'ButtonProps',
                properties: [
                    { name: 'label', required: true, description: 'Text.', type: 'string' },
                    {
                        name: 'size',
                        required: false,
                        description: 'Size.',
                        default: 'medium',
                        type: ['small', 'medium'],
                        options: ['small', 'medium'],
                    },
                ],
            },
        ],
    };

    test('joins each component with its Props type', () => {
        const [button] = extractComponents(data);
        assert.equal(button.import, '@ptrn/react/Button');
        assert.equal(button.usage, '<Button label="Hi" />');
        assert.deepEqual(button.props[0], {
            name: 'label',
            required: true,
            description: 'Text.',
            type: 'string',
        });
    });

    test('writes a literal union as TypeScript source and keeps the options', () => {
        const size = extractComponents(data)[0].props[1];
        assert.equal(size.type, "'small' | 'medium'");
        assert.deepEqual(size.options, ['small', 'medium']);
        assert.equal(size.default, 'medium');
    });

    test('a component with no Props type gets an empty prop list', () => {
        assert.deepEqual(extractComponents(data)[1].props, []);
    });
});

describe('extractIcons', () => {
    test('derives the import path and export name from the icon name', () => {
        const [icon] = extractIcons([{ name: 'Person', title: 'Person', type: 'material', alias: 'user' }]);
        assert.equal(icon.import, '@ptrn/icons/Person');
        assert.equal(icon.export, 'SvgPerson');
        assert.equal(icon.kind, 'material');
    });
});

describe('withoutStaleUsage', () => {
    const withUsage = (usage: string) => ({
        ...fixture,
        components: [{ ...fixture.components[0], usage }, ...fixture.components.slice(1)],
    });

    test('keeps an example that validates', () => {
        const { catalog, dropped } = withoutStaleUsage(
            withUsage(`import { Button } from '@ptrn/react/Button';\n<Button label="Save" />`),
        );
        assert.ok(catalog.components[0].usage);
        assert.deepEqual(dropped, []);
    });

    // The docs examples drift from the props. An AI copies what it is shown, so a stale one must not be served.
    test('drops an example that uses a prop the component does not have and reports why', () => {
        const { catalog, dropped } = withoutStaleUsage(
            withUsage(`import { Button } from '@ptrn/react/Button';\n<Button label="Save" colour="red" />`),
        );
        assert.equal(catalog.components[0].usage, undefined);
        assert.equal(dropped[0].name, 'Button');
        assert.match(dropped[0].problems[0], /colour/);
    });

    // Docs examples are fragments that borrow other components from the playground.
    test('keeps an example that only lacks an import for a neighbouring component', () => {
        const { catalog } = withoutStaleUsage(
            withUsage(`import { Button } from '@ptrn/react/Button';\n<Modal><Button label="Save" /></Modal>`),
        );
        assert.ok(catalog.components[0].usage);
    });

    test('does not mutate its input', () => {
        const input = withUsage(`<Button colour="red" />`);
        withoutStaleUsage(input);
        assert.ok(input.components[0].usage);
    });
});
