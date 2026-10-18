/**
 * $ npm run build:data
 *
 * Snapshots the design system metadata that already exists in this repo into `data/`, which ships in the npm package.
 * Sources: the docs meta (components, props, usage), the icon list, and the stylesheet's CSS variables.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Catalog } from '../src/core/types.js';
import { extractComponents, extractIcons, extractTokens, withoutStaleUsage } from './extract.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const stylesDir = path.resolve(root, 'packages/styles');
const outDir = path.resolve(root, 'packages/mcp/data');
const docsMeta = path.resolve(root, 'docs/src/meta/data.json');

function readJson<T>(file: string): T {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
}

if (!fs.existsSync(docsMeta)) {
    console.log('docs/src/meta/data.json is missing, generating it (npm run meta)');
    execSync('npm run meta --workspace ptrn-docs', { cwd: root, stdio: 'inherit' });
}

const extracted: Catalog = {
    meta: {
        version: readJson<{ version: string }>(path.resolve(root, 'packages/react/package.json')).version,
        generated: new Date().toISOString(),
    },
    components: extractComponents(readJson(docsMeta)),
    icons: extractIcons(readJson(path.resolve(root, 'packages/icons/icon-aliases.json'))),
    tokens: extractTokens(
        fs.readFileSync(path.resolve(stylesDir, 'tokens.css'), 'utf-8'),
        Object.fromEntries(
            fs
                .readdirSync(path.resolve(stylesDir, 'themes'))
                .filter((file) => file.endsWith('.css'))
                .map((file) => [
                    file.replace(/\.css$/, ''),
                    fs.readFileSync(path.resolve(stylesDir, 'themes', file), 'utf-8'),
                ]),
        ),
    ),
};

const { catalog, dropped } = withoutStaleUsage(extracted);
if (dropped.length > 0) {
    console.warn(`\n${dropped.length} docs examples disagree with their component's props and are not served:`);
    for (const { name, problems } of dropped) console.warn(`  ${name}\n${problems.map((p) => `    ${p}`).join('\n')}`);
    console.warn('');
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.resolve(outDir, 'catalog.json'), JSON.stringify(catalog));
console.log(
    `Wrote ${catalog.components.length} components, ${catalog.icons.length} icons, ${catalog.tokens.length} tokens ` +
        `(@ptrn/react ${catalog.meta.version})`,
);
