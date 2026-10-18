/**
 * Copies the repository LICENSE and NOTICE.md into the package being packed, so every published tarball carries the
 * license and the attribution. Runs as each package's `prepack`; `--clean` (the `postpack`) removes the copies again so
 * they are never committed. The copies are gitignored too.
 */
import { copyFileSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pkg = process.cwd();
const files = ['LICENSE', 'NOTICE.md'];

for (const file of files) {
    const target = resolve(pkg, file);
    if (process.argv.includes('--clean')) {
        if (existsSync(target)) rmSync(target);
    } else {
        copyFileSync(resolve(root, file), target);
    }
}
