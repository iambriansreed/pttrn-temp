import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { fixture } from './fixture.js';
import { getComponent, getTokens, listComponents, searchComponents, searchIcons } from './tools.js';

describe('listComponents', () => {
    test('lists every component with a one-line description', () => {
        const result = listComponents(fixture);
        assert.equal(result.components.length, 3);
        assert.deepEqual(result.components[0], {
            name: 'Button',
            description: 'A clickable component that allows users to perform an action.',
        });
        assert.equal(result.version, '1.2.3');
    });
});

describe('searchComponents', () => {
    test('finds a component by what it does, not just its name', () => {
        const names = searchComponents(fixture, 'choose a date').components.map((c) => c.name);
        assert.equal(names[0], 'DatePicker');
    });

    test('ranks an exact name match first', () => {
        assert.equal(searchComponents(fixture, 'modal').components[0].name, 'Modal');
    });

    test('ignores case and separators in the query', () => {
        assert.equal(searchComponents(fixture, 'date-picker').components[0].name, 'DatePicker');
    });

    test('returns nothing for a query that matches nothing', () => {
        assert.deepEqual(searchComponents(fixture, 'zzzzqq').components, []);
    });
});

describe('getComponent', () => {
    test('returns props, import path, usage and dependencies', () => {
        const result = getComponent(fixture, 'Button');
        assert.ok(result.component);
        assert.equal(result.component.import, '@ptrn/react/Button');
        assert.equal(result.component.props.length, 2);
        assert.equal(result.component.usage, '<Button label="Save" />');
    });

    test('is case-insensitive', () => {
        assert.ok(getComponent(fixture, 'button').component);
    });

    // Regression guard for the "did you mean" behaviour: a typo must not fail hard.
    test('suggests close names for an unknown component', () => {
        const result = getComponent(fixture, 'Buton');
        assert.ok(result.error);
        assert.deepEqual(result.didYouMean, ['Button']);
    });

    test('truncates very long prop descriptions', () => {
        const long = structuredClone(fixture);
        long.components[0].props[0].description = 'x'.repeat(2000);
        const result = getComponent(long, 'Button');
        assert.ok(result.component);
        assert.ok(result.component.props[0].description.length <= 400);
    });
});

describe('searchIcons', () => {
    test('matches on aliases', () => {
        assert.equal(searchIcons(fixture, 'house').icons[0].name, 'Home');
    });

    test('returns the import and the named export', () => {
        assert.deepEqual(searchIcons(fixture, 'user').icons[0], {
            name: 'Person',
            import: '@ptrn/icons/Person',
            export: 'SvgPerson',
        });
    });
});

describe('getTokens', () => {
    test('without a kind, summarizes the groups instead of dumping every token', () => {
        const result = getTokens(fixture);
        assert.deepEqual(result.kinds, [
            { kind: 'spacing', count: 2 },
            { kind: 'color', count: 2 },
        ]);
        assert.equal('tokens' in result, false);
    });

    test('with a kind, returns that group with its values in other themes', () => {
        const result = getTokens(fixture, 'color');
        assert.deepEqual(result.tokens, [
            {
                name: '--theme-color-ink',
                value: 'var(--theme-color-base-darkest)',
                themes: { 'project-theme-dark': 'var(--general-usa-color-white)' },
                description: '#-theme/color/ink',
            },
            { name: '--usa-color-white', value: 'rgb(255 255 255)', description: '!-usa/color/white' },
        ]);
    });

    test('an unknown kind lists the kinds that exist', () => {
        const result = getTokens(fixture, 'nope');
        assert.equal(result.tokens?.length, 0);
        assert.equal(result.kinds?.length, 2);
    });
});
