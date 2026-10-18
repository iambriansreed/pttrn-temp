/**
 * @ptrn/react meta generation script
 *
 * This script generates the meta information for the @ptrn/react package.
 *
 * $ vite-node .scripts/meta.ts
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve(__dirname, '../src/meta');
const uiRootPath = path.resolve(__dirname, '../../packages/react');

/** Runs the meta command */
function runMetaCommand() {
    let hash = '';
    let prefix = ``;
    let mode = process.env.MODE || 'production';
    let build = '';

    if (fs.existsSync(uiRootPath)) {
        prefix = `cd ${uiRootPath} &&`;
        if (process.env.CI) {
            // the deployed site is a production build stamped with the commit; build stays empty so meta defaults it to 0
            try {
                hash = execSync(`${prefix} git rev-parse --short HEAD`, {
                    encoding: 'utf-8',
                    stdio: ['ignore', 'pipe', 'ignore'],
                }).trim();
            } catch {
                hash = '';
            }
            mode = 'production';
        } else {
            // running locally we use the branch name as the hash
            hash = execSync(`${prefix} git branch --show-current`, { encoding: 'utf-8' }).trim();
            mode = 'development';
            build = 'local';
        }
    } else {
        // running in CI we use the last commit hash
        hash = execSync('npm list @ptrn/react', { encoding: 'utf-8' }).trim().split('#')[1]?.substring(0, 7);
        prefix = 'npm explore @ptrn/react -- ';
        build = getBuild();
    }

    const flags = Object.entries({ hash, build, mode, out: outDir })
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([key, value]) => `${key}=${value}`);

    console.log(`Building @ptrn/react meta with flags: ${flags}`);

    execSync(`${prefix} npm run meta ${flags.join(' ')}`, {
        stdio: 'inherit',
    });

    execSync(`npx eslint --fix ${outDir}/index.ts`, { stdio: 'inherit' });
}

function getBuild() {
    if (process.env.DEV_GIT_TOKEN)
        try {
            const responseJson = execSync(
                `curl -L \
      -H "Accept: application/vnd.github+json" \
      -H "Authorization: Bearer ${process.env.DEV_GIT_TOKEN}" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      https://api.github.com/repos/pttrn/pttrn/compare/main...dev
    `,
                { encoding: 'utf8' },
            );
            const responseData = JSON.parse(responseJson);
            return responseData.ahead_by;
        } catch {
            // If the API call fails, we assume no new build is available.
        }

    return '';
}

runMetaCommand();
