/**
 * $ vite-node .scripts/dev.ts
 *
 * Starts the docs dev server. In dev, @ptrn/react is read from its source through the aliases in vite.config.ts, so
 * edits to its components show up without a rebuild.
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const uiRootPath = path.resolve(__dirname, '../../packages/react');
/**
 * Ensure @ptrn/react is where we expect it.
 *
 * Checks if the @ptrn/react package is present at the expected location.
 */
if (!fs.existsSync(uiRootPath)) {
    throw new Error(`@ptrn/react not found at ${uiRootPath}`);
}

const args = process.argv.slice(2);

const updateMeta = !args.includes('no-meta');

if (updateMeta) execSync(`npm run meta`, { stdio: 'inherit' });

/**
 * Runs the search index generation script and starts the Vite development server.
 *
 * This script generates the search index for the pttrn UI components and then starts the Vite server.
 */

execSync([`rm -rf node_modules/.vite`, `UPDATE_META=${updateMeta} vite dev --force --open`].join(' && '), {
    stdio: 'inherit',
});
