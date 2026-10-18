/**
 * Used to set up meta data from the tests
 *
 * $ npm run tests
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const demoRootPath = path.resolve(__dirname, '../');

const metaDataPath = path.join(demoRootPath, 'src/meta/data.json');

function main() {
    if (!fs.existsSync(metaDataPath)) execSync('npm run meta', { stdio: 'inherit' });

    execSync('npm run preview:prod', { stdio: 'inherit' });
}

main();
