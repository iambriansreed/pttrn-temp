import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { loadCatalog, loadGuide } from './catalog.js';
import { validateCode } from './validate.js';

// Guards the data build: a metadata shape change upstream must fail here, not silently empty a tool.
describe('src/core/catalog.test.ts - built catalog stays in sync', () => {
    const catalog = loadCatalog();

    test('has the components, icons and tokens the design system ships', () => {
        assert.ok(catalog.components.length >= 80, `components: ${catalog.components.length}`);
        assert.ok(catalog.icons.length >= 900, `icons: ${catalog.icons.length}`);
        assert.ok(catalog.tokens.length >= 600, `tokens: ${catalog.tokens.length}`);
    });

    test('keeps the core components with their props', () => {
        for (const name of ['Button', 'Flex', 'Input', 'Modal', 'Select']) {
            const component = catalog.components.find((c) => c.name === name);
            assert.ok(component, `${name} is missing`);
            assert.ok(component.props.length > 0, `${name} has no props`);
        }
    });

    test('exposes the union values of Button variant', () => {
        const variant = catalog.components.find((c) => c.name === 'Button')?.props.find((p) => p.name === 'variant');
        assert.deepEqual(variant?.options, ['primary', 'secondary', 'tertiary']);
    });

    // Unions the schema generator leaves as `anyOf` (`SizingPixels | SizingPixels[]`, csstype keyword unions) used to
    // come through as `unknown`, so the validator could not check their values.
    test('gives every prop a type', () => {
        const unknown = catalog.components.flatMap((c) =>
            c.props.filter((p) => p.type === 'unknown').map((p) => `${c.name}.${p.name}`),
        );
        assert.deepEqual(unknown, []);
    });

    test('checks the values of Flex align, justify and padding', () => {
        const flex = catalog.components.find((c) => c.name === 'Flex');
        const options = (name: string) => flex?.props.find((p) => p.name === name)?.options ?? [];
        assert.ok(options('align').includes('center'));
        assert.ok(options('justify').includes('space-between'));
        assert.ok(options('padding').includes('16'));

        const { issues } = validateCode(
            catalog,
            `import { Flex } from '@ptrn/react/Flex';\n<Flex align="middle" justify="between" padding="15" />`,
        );
        assert.deepEqual(
            issues.map((i) => i.rule),
            ['invalid-prop-value', 'invalid-prop-value', 'invalid-prop-value'],
        );
    });

    test('carries each component phase and leaves out docs-only components', () => {
        assert.equal(catalog.components.find((c) => c.name === 'Button')?.phase, 'Stable');
        assert.equal(
            catalog.components.find((c) => c.name === 'ExamplePlaceholder'),
            undefined,
        );
    });

    test('groups tokens and carries their values in other themes', () => {
        assert.ok(catalog.tokens.some((t) => t.kind === 'spacing'));
        assert.ok(catalog.tokens.some((t) => t.themes?.['project-theme-dark'] !== undefined));
    });

    test('is stamped with the design system version', () => {
        assert.match(catalog.meta.version, /^\d+\.\d+\.\d+/);
    });

    test('serves a guide', () => {
        assert.match(loadGuide(), /Tokens, not hardcoded values/);
    });

    // Whatever the data build serves as an example has to pass the validator, or an AI copies a mistake.
    test('every served usage example passes validation', () => {
        for (const component of catalog.components) {
            if (!component.usage) continue;
            const errors = validateCode(catalog, component.usage).issues.filter(
                (i) => i.severity === 'error' && i.rule !== 'missing-import',
            );
            assert.deepEqual(errors, [], `${component.name} example is stale`);
        }
    });
});
