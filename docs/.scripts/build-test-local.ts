/**
 * Local test script builds the local @ptrn/react library and links it to the demo project.
 *
 * $ vite-node .scripts/local-test.ts
 */
import { execSync } from 'child_process';
import path from 'path';

const uiRootPath = path.resolve(__dirname, '../../packages/react');
const demoRootPath = path.resolve(__dirname, '../');

execSync(
    [
        `cd "${uiRootPath}"`,
        `npm run build`,
        `npm pack`,
        `tar -xf ptrn-ui*.tgz package`,
        `cd package`,
        `npm link`,

        `cd "${demoRootPath}"`,
        `npm link @ptrn/react`,
        `npm run build`,
        `npx http-server ./dist -p 8080 --fallback 404.html`,
    ].join(' && \n'),
    {
        stdio: 'inherit',
    },
);
