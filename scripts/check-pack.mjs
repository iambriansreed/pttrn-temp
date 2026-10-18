/**
 * Dry-runs `npm pack` for every publishable package and checks what would ship: the license files, the README, no
 * sources or build configuration, and no demo code. Run with `npm run check:pack` after `npm run build`.
 */
import { execSync } from 'node:child_process';

const packages = ['@ptrn/styles', '@ptrn/icons', '@ptrn/react', '@ptrn/web', '@ptrn/mcp'];
const required = ['LICENSE', 'NOTICE.md', 'README.md'];
const forbidden = [
    /^src\//,
    /^\.tmp\//,
    /tsconfig/,
    /^build\.ts$/,
    /^meta\.ts$/,
    /Example\.(js|d\.ts|css|css\.js)$/,
    /\/ExamplePlaceholder\//,
    /\.test\./,
    /\.spec\./,
];

let failed = false;
for (const name of packages) {
    const [result] = JSON.parse(
        execSync(`npm pack --dry-run --json --workspace ${name}`, {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }),
    );
    const paths = result.files.map((file) => file.path);
    const problems = [
        ...required.filter((file) => !paths.includes(file)).map((file) => `missing ${file}`),
        ...paths
            .filter((file) => forbidden.some((pattern) => pattern.test(file)))
            .slice(0, 5)
            .map((file) => `ships ${file}`),
    ];
    const size = `${(result.unpackedSize / 1024).toFixed(0)} kB unpacked, ${result.entryCount} files`;
    console.log(
        `${problems.length ? '✖' : '✓'} ${name}@${result.version}: ${size}${problems.length ? `\n    ${problems.join('\n    ')}` : ''}`,
    );
    if (problems.length) failed = true;
}
process.exit(failed ? 1 : 0);
