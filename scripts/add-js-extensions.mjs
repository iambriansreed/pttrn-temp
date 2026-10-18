/**
 * Rewrites relative module specifiers in emitted `.js` and `.d.ts` files so they carry the explicit `.js` (or
 * `/index.js`) Node's ESM resolver requires. TypeScript leaves `import './Button'` as written, which bundlers accept
 * but Node rejects, so a server-rendering consumer that is not bundling `node_modules` would fail on import.
 *
 * Usage from a build script: `await addJsExtensions(distDir, { ignore: ['node_modules'] })`.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const SPECIFIER = /((?:^|[\s;{}(,])(?:import|export)\s*(?:[^'"]*?\sfrom\s*|\(\s*)?)(['"])(\.{1,2}\/[^'"]+)\2/g;

function withExtension(fromFile, specifier) {
    if (/\.(m?js|cjs|json|css|svg)$/.test(specifier)) return specifier;
    const base = resolve(dirname(fromFile), specifier);
    const isTypes = fromFile.endsWith('.d.ts');
    const probe = (candidate) => existsSync(candidate) && statSync(candidate).isFile();
    if (probe(`${base}.js`) || (isTypes && probe(`${base}.d.ts`))) return `${specifier}.js`;
    if (probe(join(base, 'index.js')) || (isTypes && probe(join(base, 'index.d.ts')))) return `${specifier}/index.js`;
    return specifier;
}

export async function addJsExtensions(dir, { ignore = [] } = {}) {
    let rewritten = 0;
    const walk = (folder) => {
        for (const entry of readdirSync(folder, { withFileTypes: true })) {
            if (ignore.includes(entry.name)) continue;
            const file = join(folder, entry.name);
            if (entry.isDirectory()) {
                walk(file);
                continue;
            }
            if (!/\.(js|d\.ts)$/.test(entry.name)) continue;
            const source = readFileSync(file, 'utf8');
            const next = source.replace(SPECIFIER, (match, lead, quote, specifier) => {
                const fixed = withExtension(file, specifier);
                return fixed === specifier ? match : `${lead}${quote}${fixed}${quote}`;
            });
            if (next !== source) {
                writeFileSync(file, next);
                rewritten += 1;
            }
        }
    };
    walk(dir);
    return rewritten;
}
