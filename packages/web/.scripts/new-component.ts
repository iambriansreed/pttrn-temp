/**
 * Scaffolds the files for a new Web Component, the counterpart of `npm run newc` in @ptrn/react.
 *
 * $ npm run newc -- Badge
 *
 * Creates `src/components/Badge/{badge.ts,badge.scss,index.ts}` and `tests/badge.spec.ts`, and adds the export to
 * `src/index.ts`. The React component must already have a `spec.ts`: the test registers its behaviors, and the lint
 * fails a Web Component whose React counterpart has no spec. Then follow the checklist in CONTRIBUTING.md.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const name = process.argv[2];

if (!name || !/^[A-Z][A-Za-z0-9]*$/.test(name)) {
    console.error('Usage: npm run newc -- <PascalCaseName>   (the name of the React component, for example TabGroup)');
    process.exit(1);
}

const kebab = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const tag = `pttrn-${kebab}`;
const dir = path.join(root, 'src/components', name);

if (fs.existsSync(dir)) {
    console.error(`${path.relative(root, dir)} already exists.`);
    process.exit(1);
}

const specFile = path.resolve(root, '../react/src/components', name, 'spec.ts');
if (!fs.existsSync(specFile)) {
    console.error(
        `${path.relative(root, specFile)} does not exist. Write the React component's spec first; the Web Component is tested against it.`,
    );
    process.exit(1);
}

const write = (file: string, contents: string) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
    console.log(`created ${path.relative(root, file)}`);
};

write(
    path.join(dir, `${kebab}.ts`),
    `import { LitElement, html } from 'lit';
import { define } from '../../utils/define';
import styles from './${kebab}.scss';

/**
 * Describe the component in one sentence. Copy it from the JSDoc of the React component so the two stay in step.
 *
 * @element ${tag}
 * @slot - The content.
 */
export class Ptrn${name} extends LitElement {
    static properties = {};

    static styles = styles;

    render() {
        return html\`<slot></slot>\`;
    }
}

define('${tag}', Ptrn${name});

declare global {
    interface HTMLElementTagNameMap {
        '${tag}': Ptrn${name};
    }
}
`,
);

write(path.join(dir, `${kebab}.scss`), `@use '../../styles/reset';\n\n:host {\n    display: block;\n}\n`);
write(path.join(dir, 'index.ts'), `export * from './${kebab}';\n`);

write(
    path.join(root, `tests/${kebab}.spec.ts`),
    `import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { spec } from '../../react/src/components/${name}/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

// Mirror the presets in the React component's example file, so both implementations are held to the same cases.
const PRESETS = {
    Default: '<${tag}>Content</${tag}>',
};

// One test per behavior in the React component's spec.ts. A behavior without a test fails, and so does a test the spec
// does not list.
describeBehaviors(spec, {
    renders: async ({ page }) => {
        await mount(page, PRESETS.Default);
        await expect(page.getByText('Content')).toBeVisible();
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('${tag}').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
`,
);

const indexFile = path.join(root, 'src/index.ts');
const line = `export * from './components/${name}';\n`;
const current = fs.readFileSync(indexFile, 'utf-8');
if (!current.includes(line)) fs.writeFileSync(indexFile, current + line);
console.log('updated src/index.ts');

console.log(`
Next: fill in the element, then work through the checklist in CONTRIBUTING.md.
The docs tab stays disabled until the component is registered in docs/src/wc/index.ts.`);
