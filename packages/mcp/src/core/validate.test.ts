import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { fixture } from './fixture.js';
import type { Catalog } from './types.js';
import { validateCode } from './validate.js';

const catalog: Catalog = {
    ...fixture,
    components: [
        ...fixture.components,
        {
            name: 'Link',
            slug: 'link',
            description: 'A link.',
            import: '@ptrn/react/Link',
            dependencies: [],
            props: [{ name: 'href', required: true, description: 'Where to.', type: 'string' }],
        },
    ],
};

function rules(code: string) {
    return validateCode(catalog, code).issues.map((i) => i.rule);
}

describe('validateCode: clean code', () => {
    test('accepts valid pttrn code', () => {
        const result = validateCode(
            catalog,
            `import { Button } from '@ptrn/react/Button';
import { SvgPerson } from '@ptrn/icons/Person';

export function Save() {
    return <Button label="Save" variant="primary" id="save" data-testid="x" aria-label="Save" onClick={() => {}} />;
}`,
        );
        assert.deepEqual(result.issues, []);
        assert.equal(result.ok, true);
        assert.equal(result.version, '1.2.3');
    });

    test('accepts a bare snippet with no imports for non-pttrn elements', () => {
        assert.deepEqual(rules('<div><span>hi</span></div>'), []);
    });
});

describe('validateCode: imports', () => {
    test('flags a component path that does not exist', () => {
        const [issue] = validateCode(catalog, `import { Sidebar } from '@ptrn/react/Sidebar';`).issues;
        assert.equal(issue.rule, 'unknown-import');
        assert.equal(issue.severity, 'error');
    });

    test('suggests the closest component for a typo', () => {
        const [issue] = validateCode(catalog, `import { Button } from '@ptrn/react/Buton';`).issues;
        assert.match(issue.fix ?? '', /Button/);
    });

    test('does not flag lowercase paths such as hooks and utilities', () => {
        assert.deepEqual(rules(`import { useThing } from '@ptrn/react/hooks/useThing';`), []);
    });

    test('flags an import from the package root', () => {
        assert.deepEqual(rules(`import { Button } from '@ptrn/react';`), ['unknown-import']);
    });

    test('flags an icon that does not exist and suggests one', () => {
        const [issue] = validateCode(catalog, `import { SvgPersn } from '@ptrn/icons/Persn';`).issues;
        assert.equal(issue.rule, 'unknown-icon');
        assert.match(issue.fix ?? '', /Person/);
    });

    test('flags an icon imported without its Svg prefix', () => {
        const [issue] = validateCode(catalog, `import { Person } from '@ptrn/icons/Person';`).issues;
        assert.equal(issue.rule, 'wrong-icon-export');
        assert.match(issue.fix ?? '', /SvgPerson/);
    });

    test('flags a pttrn component used without importing it', () => {
        const [issue] = validateCode(catalog, `const a = <Button label="x" />;`).issues;
        assert.equal(issue.rule, 'missing-import');
        assert.match(issue.fix ?? '', /import \{ Button \} from '@ptrn\/react\/Button'/);
    });
});

describe('validateCode: props', () => {
    const imp = `import { Button } from '@ptrn/react/Button';\n`;

    test('flags a prop the component does not have', () => {
        const [issue] = validateCode(catalog, `${imp}const a = <Button label="x" colour="red" />;`).issues;
        assert.equal(issue.rule, 'unknown-prop');
        assert.equal(issue.severity, 'warning');
    });

    test('flags a value outside the allowed set and lists the allowed values', () => {
        const [issue] = validateCode(catalog, `${imp}const a = <Button label="x" variant="huge" />;`).issues;
        assert.equal(issue.rule, 'invalid-prop-value');
        assert.equal(issue.severity, 'error');
        assert.match(issue.message, /primary/);
        assert.match(issue.message, /secondary/);
    });

    test('flags a missing required prop', () => {
        assert.deepEqual(rules(`${imp}const a = <Button />;`), ['missing-required-prop']);
    });

    // A spread may supply the prop, so absence proves nothing.
    test('does not flag a missing required prop when props are spread', () => {
        assert.deepEqual(rules(`${imp}const a = <Button {...props} />;`), []);
    });

    test('checks props through an import alias', () => {
        assert.deepEqual(
            rules(`import { Button as Btn } from '@ptrn/react/Button';\nconst a = <Btn label="x" variant="huge" />;`),
            ['invalid-prop-value'],
        );
    });

    test('does not check the value of a dynamic expression', () => {
        assert.deepEqual(rules(`${imp}const a = <Button label="x" variant={pick()} />;`), []);
    });

    test('counts JSX children as the children prop', () => {
        const withChildren: Catalog = {
            ...catalog,
            components: [
                {
                    name: 'Modal',
                    slug: 'modal',
                    description: '',
                    import: '@ptrn/react/Modal',
                    dependencies: [],
                    props: [{ name: 'children', required: true, description: '', type: 'ReactNode' }],
                },
            ],
        };
        const code = `import { Modal } from '@ptrn/react/Modal';\nconst a = <Modal>hi</Modal>;`;
        assert.deepEqual(validateCode(withChildren, code).issues, []);
    });
});

describe('validateCode: tokens', () => {
    test('flags a hardcoded hex color and names the matching token', () => {
        const [issue] = validateCode(catalog, `const s = { color: '#FFF' };`).issues;
        assert.equal(issue.rule, 'hardcoded-color');
        assert.match(issue.fix ?? '', /var\(--usa-color-white\)/);
    });

    test('flags a color inside a CSS string', () => {
        assert.deepEqual(rules('const c = `border: 1px solid #ccc`;'), ['hardcoded-color']);
    });

    test('does not treat an in-page anchor as a color', () => {
        assert.deepEqual(rules(`const a = <Link href="#bad" />;\nimport { Link } from '@ptrn/react/Link';`), []);
    });

    test('flags hardcoded spacing that has a token', () => {
        const [issue] = validateCode(catalog, `const s = <div style={{ padding: 16 }} />;`).issues;
        assert.equal(issue.rule, 'hardcoded-spacing');
        assert.match(issue.fix ?? '', /var\(--usa-spacing-2\)/);
    });

    test('flags spacing written as a px string', () => {
        assert.deepEqual(rules(`const s = <div style={{ gap: '8px' }} />;`), ['hardcoded-spacing']);
    });

    test('leaves spacing that has no matching token alone', () => {
        assert.deepEqual(rules(`const s = <div style={{ padding: 10 }} />;`), []);
    });
});

describe('validateCode: raw HTML', () => {
    test('flags a raw element that has a pttrn component', () => {
        const [issue] = validateCode(catalog, `const a = <button>Save</button>;`).issues;
        assert.equal(issue.rule, 'raw-html');
        assert.match(issue.fix ?? '', /Button/);
    });

    test('flags a raw anchor and points at Link', () => {
        const [issue] = validateCode(catalog, `const a = <a href="/x">x</a>;`).issues;
        assert.match(issue.fix ?? '', /Link/);
    });

    test('does not flag an element with no pttrn equivalent in the catalog', () => {
        assert.deepEqual(rules(`const a = <hr />;`), []);
    });
});

describe('validateCode: robustness', () => {
    test('reports a syntax error as an issue instead of throwing', () => {
        const result = validateCode(catalog, `const a = <Button label=>;`);
        assert.equal(result.ok, false);
        assert.equal(result.issues[0].rule, 'syntax');
    });

    test('reports 1-based line and column', () => {
        const [issue] = validateCode(catalog, `\n\n  const a = <button>x</button>;`).issues;
        assert.equal(issue.line, 3);
        assert.equal(issue.column, 13);
    });

    test('handles empty input', () => {
        assert.equal(validateCode(catalog, '').ok, true);
    });
});
