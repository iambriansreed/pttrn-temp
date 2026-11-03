import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import type { Catalog } from '../src/core/types.js';
import { extractComponents, extractIcons, extractTokens, withoutStaleUsage } from './extract.js';

function readJson<T>(file: string): T {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
}

/**
 * Assembles the catalog from the metadata the repository already generates: the docs meta (components, props, usage),
 * the icon list, and the token and theme stylesheets. `npm run build:data` writes it into `data/`, and the agent docs
 * (DESIGN.md, llms.txt) are rendered from it, so the MCP server and those files describe the same design system.
 *
 * @param root The repository root.
 */
export function buildCatalog(root: string): ReturnType<typeof withoutStaleUsage> {
    const stylesDir = path.resolve(root, 'packages/styles');
    const docsMeta = path.resolve(root, 'docs/src/meta/data.json');

    if (!fs.existsSync(docsMeta)) {
        // On stderr, so a caller whose stdout is data (`npm pack --json` running a prepack) still parses it.
        console.error('docs/src/meta/data.json is missing, generating it (npm run meta)');
        execSync('npm run meta --workspace ptrn-docs', { cwd: root, stdio: ['ignore', 2, 2] });
    }

    const reactPackage = readJson<{ version: string; files: string[] }>(
        path.resolve(root, 'packages/react/package.json'),
    );
    // Docs-only components (`ExamplePlaceholder`) are left out of the published package, so they are not offered.
    const unpublished = new Set(
        reactPackage.files.flatMap((pattern) => pattern.match(/^!dist\/components\/([A-Za-z]+)$/)?.[1] ?? []),
    );

    const extracted: Catalog = {
        meta: {
            version: reactPackage.version,
            generated: new Date().toISOString(),
        },
        components: extractComponents(readJson(docsMeta)).filter((c) => !unpublished.has(c.name)),
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

    return withoutStaleUsage(extracted);
}
