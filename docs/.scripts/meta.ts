/**
 * Generates the component metadata the docs site renders (`src/meta/`) by running `npm run meta` in `packages/react`.
 *
 * $ vite-node .scripts/meta.ts
 *
 * In CI the site is a production build stamped with the short commit hash. Locally the current branch name is the stamp
 * and the build is marked `local`, so the header shows which checkout the site documents.
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve(__dirname, '../src/meta');
const reactRootPath = path.resolve(__dirname, '../../packages/react');

if (!fs.existsSync(reactRootPath)) {
    throw new Error(`@ptrn/react not found at ${reactRootPath}`);
}

function git(command: string) {
    try {
        return execSync(`git ${command}`, {
            cwd: reactRootPath,
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
    } catch {
        return '';
    }
}

const ci = !!process.env.CI;
const flags = Object.entries({
    hash: ci ? git('rev-parse --short HEAD') : git('branch --show-current'),
    build: ci ? '' : 'local',
    mode: ci ? 'production' : 'development',
    out: outDir,
})
    .filter(([, value]) => value !== '')
    .map(([key, value]) => `${key}=${value}`);

console.log(`Building @ptrn/react meta with flags: ${flags.join(' ')}`);

execSync(`npm run meta ${flags.join(' ')}`, { cwd: reactRootPath, stdio: 'inherit' });
execSync(`npx eslint --fix ${outDir}/index.ts`, { stdio: 'inherit' });
