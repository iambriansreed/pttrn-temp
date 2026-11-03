/**
 * $ npm run build:data
 *
 * Snapshots the design system metadata that already exists in this repo into `data/`, which ships in the npm package.
 * Sources: the docs meta (components, props, usage), the icon list, and the stylesheet's CSS variables.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCatalog } from './catalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const outDir = path.resolve(root, 'packages/mcp/data');

const { catalog, dropped } = buildCatalog(root);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.resolve(outDir, 'catalog.json'), JSON.stringify(catalog));
console.log(
    `Wrote ${catalog.components.length} components, ${catalog.icons.length} icons, ${catalog.tokens.length} tokens ` +
        `(@ptrn/react ${catalog.meta.version})`,
);

// A stale example is left out of the catalog, and the build fails so it is fixed rather than silently not served.
if (dropped.length > 0) {
    console.error(`\n${dropped.length} docs examples disagree with their component's props and are not served:`);
    for (const { name, problems } of dropped) console.error(`  ${name}\n${problems.map((p) => `    ${p}`).join('\n')}`);
    console.error(
        "\nFix each example where it lives (the component's @example JSDoc in packages/react), or the props if they are wrong.",
    );
    process.exitCode = 1;
}
