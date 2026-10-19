/**
 * Scaffolds the files for a new Web Component, the counterpart of `npm run newc` in @ptrn/react.
 *
 * $ npm run newc -- Badge
 *
 * Creates `src/components/Badge/{badge.ts,badge.scss,index.ts}` and `tests/badge.spec.ts`, adds the export to
 * `src/index.ts` and `package.json`, and registers the component in the docs (`docs/src/wc/badge.tsx`, `index.ts`,
 * `names.ts`) with a generic demo wrapper to refine. The React component must already have a `spec.ts`: the test
 * registers its behaviors, and the lint fails a Web Component whose React counterpart has no spec. Then follow the
 * checklist in CONTRIBUTING.md.
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

/** The docs demo file the scaffold writes; `__NAME__`, `__TAG__` and `__CAMEL__` are filled in. */
const DEMO_TEMPLATE = `import '@ptrn/web/__NAME__';
import { __NAME__Props } from '@ptrn/react/__NAME__';
import { ComponentType, ReactNode } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. A boolean attribute is '' for on and undefined for off. */
const Pttrn__NAME__ = '__TAG__' as unknown as ComponentType<any>;

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** Primitive demo props become attributes; booleans are present or absent. Map slots and item arrays by hand below. */
const attributes = (props: Record<string, unknown>) =>
    Object.fromEntries(
        Object.entries(props)
            .filter(([key, value]) => key !== 'children' && ['string', 'number', 'boolean'].includes(typeof value))
            .filter(([, value]) => value !== false && value !== '')
            .map(([key, value]) => [key.replace(/[A-Z]/g, (c) => \`-\${c.toLowerCase()}\`), value === true ? '' : value]),
    );

/** The React demo state (the props table) rendered as the element. */
function __NAME__Wc({ children, ...props }: Partial<__NAME__Props> & { children?: ReactNode }) {
    return <Pttrn__NAME__ {...attributes(props)}>{children}</Pttrn__NAME__>;
}

/** The HTML a Web Component user writes for the current demo state. */
function __CAMEL__ToHtml({ children, ...props }: Record<string, unknown>) {
    const attrs = Object.entries(attributes(props)).map(([key, value]) =>
        value === '' ? key : \`\${key}="\${escapeAttr(String(value))}"\`,
    );
    const inner = typeof children === 'string' || typeof children === 'number' ? String(children) : '';
    return \`<__TAG__\${attrs.length ? \` \${attrs.join(' ')}\` : ''}>\${inner}</__TAG__>\`;
}

const USAGE = \`<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@\${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<__TAG__>Content</__TAG__>\`;

export const __CAMEL__Wc: WebComponentDemo = {
    tag: '__TAG__',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run \`npm install @ptrn/web\` and import the component you need. Also load the \`@ptrn/styles\` tokens and a theme on the page so the elements pick up the design tokens.',
    Wrapper: __NAME__Wc,
    toHtml: __CAMEL__ToHtml,
};
`;

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
export class Pttrn${name} extends LitElement {
    static properties = {};

    static styles = styles;

    render() {
        return html\`<slot></slot>\`;
    }
}

define('${tag}', Pttrn${name});

declare global {
    interface HTMLElementTagNameMap {
        '${tag}': Pttrn${name};
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

// The package export, `@ptrn/web/<Name>`.
const packageFile = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf-8')) as { exports: Record<string, unknown> };
if (!pkg.exports[`./${name}`]) {
    pkg.exports[`./${name}`] = {
        types: `./dist/components/${name}/index.d.ts`,
        default: `./dist/components/${name}/index.js`,
    };
    fs.writeFileSync(packageFile, `${JSON.stringify(pkg, null, 4)}\n`);
    console.log('updated package.json exports');
}

// The docs registration: a demo file with a generic wrapper, the registry entry and the name list. The Web Component
// tab shows as soon as these exist, so refine the wrapper (slots, item children) before shipping.
const camel = name.charAt(0).toLowerCase() + name.slice(1);
const docsWc = path.resolve(root, '../../docs/src/wc');
const demoFile = path.join(docsWc, `${kebab}.tsx`);
if (!fs.existsSync(demoFile)) {
    write(
        demoFile,
        DEMO_TEMPLATE.replaceAll('__NAME__', name).replaceAll('__TAG__', tag).replaceAll('__CAMEL__', camel),
    );

    const registry = path.join(docsWc, 'index.ts');
    const lines = fs.readFileSync(registry, 'utf-8').split('\n');
    const isWcImport = (text: string) => /^import .* from 'src\/wc\//.test(text);
    const first = lines.findIndex(isWcImport);
    let last = first;
    while (isWcImport(lines[last + 1])) last += 1;
    const imports = [...lines.slice(first, last + 1), `import { ${camel}Wc } from 'src/wc/${kebab}';`].sort((a, b) =>
        a.slice(a.indexOf(" from '")).localeCompare(b.slice(b.indexOf(" from '"))),
    );
    lines.splice(first, last - first + 1, ...imports);
    // Keep the registry entries in name order.
    const open = lines.findIndex((text) => text.startsWith('export const webComponents'));
    let close = open + 1;
    while (!lines[close].startsWith('};')) close += 1;
    const entries = [...lines.slice(open + 1, close), `    ${name}: ${camel}Wc,`].sort();
    lines.splice(open + 1, close - open - 1, ...entries);
    fs.writeFileSync(registry, lines.join('\n'));

    const namesFile = path.join(docsWc, 'names.ts');
    const names = fs.readFileSync(namesFile, 'utf-8');
    const listed = [...names.matchAll(/'([A-Za-z0-9]+)'/g)].map((match) => match[1]);
    const updated = [...new Set([...listed, name])].sort();
    fs.writeFileSync(
        namesFile,
        names.replace(
            /webComponents: string\[\] = \[[\s\S]*?\];/,
            `webComponents: string[] = [${updated.map((entry) => `'${entry}'`).join(', ')}];`,
        ),
    );
    console.log(`registered ${name} in docs/src/wc (index.ts, names.ts)`);
}

console.log(`
Next: fill in the element and its tests, refine docs/src/wc/${kebab}.tsx (slots, item children, the HTML generator),
then work through the checklist in CONTRIBUTING.md.`);
