/**
 * Fails when a stylesheet uses a CSS custom property that is not a design token. Every `var(--name)` in the given SCSS
 * directories must be declared by @ptrn/styles (the catalog in `tokens.js`), by one of the shared base stylesheets, or
 * in the same file (a component-local property). Sass interpolations are skipped.
 *
 * Node scripts/check-css-vars.mjs <dir> [<dir> ...] [--base <scss file>]...
 *
 * The React and Web Component builds run this before compiling, so a token renamed in Figma fails the build instead of
 * silently falling back in the browser.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve } from 'node:path';

const require = createRequire(import.meta.url);

const args = process.argv.slice(2);
const dirs = [];
const bases = [];
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base') bases.push(resolve(args[++i]));
    else dirs.push(resolve(args[i]));
}
if (!dirs.length) {
    console.error('usage: node scripts/check-css-vars.mjs <scss dir> [...] [--base <scss file>]');
    process.exit(2);
}

const { tokens } = await import(require.resolve('@ptrn/styles/tokens'));
const known = new Set(Object.keys(tokens));

const DECLARED = /(?<![\w-])--[\w-]+(?=\s*:)/g;
const USED = /var\(\s*(--[\w-]+)/g;

for (const base of bases) {
    for (const match of readFileSync(base, 'utf8').matchAll(DECLARED)) known.add(match[0]);
}

const scssFiles = (dir) =>
    readdirSync(dir, { withFileTypes: true, recursive: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.scss'))
        .map((entry) => join(entry.parentPath, entry.name));

let missing = 0;
let checked = 0;
for (const dir of dirs) {
    for (const file of scssFiles(dir)) {
        const source = readFileSync(file, 'utf8');
        const local = new Set([...source.matchAll(DECLARED)].map((match) => match[0]));
        const problems = new Set();
        for (const match of source.matchAll(USED)) {
            const name = match[1];
            checked += 1;
            if (!known.has(name) && !local.has(name) && !source.includes(`#{`)) problems.add(name);
            else if (!known.has(name) && !local.has(name) && !new RegExp(`var\\(\\s*${name}[^)]*#\\{`).test(source))
                problems.add(name);
        }
        if (problems.size) {
            missing += problems.size;
            console.error(`${relative(process.cwd(), file)}: ${[...problems].join(', ')}`);
        }
    }
}

if (missing) {
    console.error(`\n${missing} CSS custom ${missing === 1 ? 'property is' : 'properties are'} not design tokens.`);
    process.exit(1);
}
console.log(`All ${checked} custom property uses are design tokens or local declarations.`);
