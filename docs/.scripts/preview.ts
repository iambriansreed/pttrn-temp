/**
 * Local preview script builds the @ptrn/react library and links it to the demo project.
 *
 * $ vite-node .scripts/preview.ts
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const uiRootPath = path.resolve(__dirname, '../../packages/react');
const demoRootPath = path.resolve(__dirname, '../');

const ORANGE = '\x1b[33m';
const RESET = '\x1b[0m';

// ensure @ptrn/react is where we expect it

if (!fs.existsSync(uiRootPath)) {
    throw new Error(`@ptrn/react not found at ${uiRootPath}`);
}

const mode = process.argv[2] || 'local';

console.log(`${ORANGE}Running in ${mode.toUpperCase()} preview mode${RESET}`);

if (mode === 'local') {
    execSync(
        `cd "${uiRootPath}" && npm run build && cp package.json dist/ && cd dist && npm link && cd "${demoRootPath}" && npm link @ptrn/react && npm run meta`,
        {
            stdio: 'inherit',
        },
    );
}

execSync(`vite preview --port 8080 --open`, {
    stdio: 'inherit',
});
