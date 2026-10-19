/**
 * Build script for @ptrn/web.
 *
 * 1. One ESM file per entry (the package index and each component), with `lit` left external so bundlers dedupe it.
 * 2. One self-contained minified bundle for `<script type="module">` use with no build step.
 * 3. Type declarations from tsc.
 * 4. The Custom Elements Manifest, read by the docs, editors and the MCP server.
 *
 * `.scss` imports compile to a Lit stylesheet and `.svg` imports (from `@ptrn/icons`) inline as strings.
 *
 * $ npx tsx build.ts
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { build, type Plugin } from 'esbuild';
import * as sass from 'sass';

const root = import.meta.dirname;
const dist = path.join(root, 'dist');
const componentsDir = path.join(root, 'src/components');

const scssPlugin: Plugin = {
    name: 'scss',
    setup(b) {
        b.onLoad({ filter: /\.scss$/ }, (args) => {
            const { css, loadedUrls } = sass.compile(args.path, {
                style: 'compressed',
                importers: [new sass.NodePackageImporter()],
            });
            return {
                contents: `import { unsafeCSS } from 'lit';\nexport default unsafeCSS(${JSON.stringify(css)});`,
                loader: 'js',
                watchFiles: loadedUrls.map((url) => url.pathname),
            };
        });
    },
};

const shared = {
    bundle: true,
    format: 'esm',
    target: 'es2022',
    plugins: [scssPlugin],
    loader: { '.svg': 'text' },
    logLevel: 'warning',
} as const;

async function main() {
    const start = Date.now();
    console.log('\x1b[34mBuilding pttrn web components...\x1b[0m');

    fs.rmSync(dist, { recursive: true, force: true });

    const entryPoints = [
        path.join(root, 'src/index.ts'),
        ...fs
            .readdirSync(componentsDir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => path.join(componentsDir, entry.name, 'index.ts')),
    ];

    await build({
        ...shared,
        entryPoints,
        outdir: dist,
        outbase: path.join(root, 'src'),
        external: ['lit', 'lit/*'],
        // Shared code goes in a chunk, so importing `@ptrn/web` and `@ptrn/web/Accordion` in one app loads it once.
        splitting: true,
        sourcemap: true,
    });

    await build({
        ...shared,
        entryPoints: [path.join(root, 'src/index.ts')],
        outfile: path.join(dist, 'cdn/pttrn-web.min.js'),
        minify: true,
    });

    execSync('npx tsc -p tsconfig.json --emitDeclarationOnly', { cwd: root, stdio: 'inherit' });

    // 4. The Custom Elements Manifest (dist/custom-elements.json), see custom-elements-manifest.config.mjs.
    execSync('npx cem analyze', { cwd: root, stdio: 'inherit' });

    console.log(`\x1b[32mpttrn web components build completed successfully (${(Date.now() - start) / 1000}s)\x1b[0m`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
