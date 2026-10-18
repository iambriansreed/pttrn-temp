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
