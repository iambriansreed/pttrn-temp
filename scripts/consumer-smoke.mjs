/**
 * Consumer smoke test: packs @ptrn/styles, @ptrn/icons and @ptrn/react exactly as they would publish, installs the
 * tarballs into a throwaway project next to the requested React major, type-checks a small app against the export maps,
 * and server-renders a component with react-dom/server. It proves the published artifacts (not the workspace links)
 * resolve, carry types, and import cleanly where there is no `document`.
 *
 * Node scripts/consumer-smoke.mjs 18 node scripts/consumer-smoke.mjs 19
 */
import { execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const reactMajor = process.argv[2] || '18';
const root = resolve(import.meta.dirname, '..');
const dir = mkdtempSync(join(tmpdir(), `pttrn-consumer-react${reactMajor}-`));
const run = (command, cwd = dir) => execSync(command, { cwd, stdio: 'inherit' });

try {
    const packDir = join(dir, 'tarballs');
    mkdirSync(packDir);
    for (const name of ['@ptrn/styles', '@ptrn/icons', '@ptrn/react']) {
        run(`npm pack --silent --workspace ${name} --pack-destination "${packDir}"`, root);
    }
    const tarballs = readdirSync(packDir);
    const tarball = (prefix) =>
        `file:${join(
            packDir,
            tarballs.find((file) => file.startsWith(prefix)),
        )}`;

    writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify(
            {
                name: 'pttrn-consumer',
                private: true,
                type: 'module',
                dependencies: {
                    '@ptrn/icons': tarball('ptrn-icons-'),
                    '@ptrn/react': tarball('ptrn-react-'),
                    '@ptrn/styles': tarball('ptrn-styles-'),
                    react: `^${reactMajor}`,
                    'react-dom': `^${reactMajor}`,
                },
                devDependencies: {
                    '@types/react': `^${reactMajor}`,
                    '@types/react-dom': `^${reactMajor}`,
                    typescript: '^5.9.0',
                },
            },
            null,
            2,
        ),
    );
    writeFileSync(
        join(dir, 'tsconfig.json'),
        JSON.stringify({
            compilerOptions: {
                strict: true,
                jsx: 'react-jsx',
                module: 'nodenext',
                moduleResolution: 'nodenext',
                target: 'es2022',
                outDir: 'out',
                skipLibCheck: true,
                types: [],
            },
            include: ['app.tsx'],
        }),
    );
    writeFileSync(
        join(dir, 'app.tsx'),
        `import { renderToString } from 'react-dom/server';
import { Button, type ButtonProps } from '@ptrn/react/Button';
import { UIProvider } from '@ptrn/react/UIProvider';
import { SvgCheck } from '@ptrn/icons/Check';
import { meta } from '@ptrn/icons';
import { version } from 'react';

const props: ButtonProps = { label: 'Save', icon: <SvgCheck /> };
const html = renderToString(
    <UIProvider>
        <Button {...props} />
    </UIProvider>,
);
if (!html.includes('Save')) throw new Error(\`Button did not render: \${html}\`);
console.log(\`React \${version}: rendered \${html.length} characters; \${meta.length} icons in the catalog\`);
`,
    );

    run('npm install --no-audit --no-fund --silent');
    run('npx tsc -p tsconfig.json');
    run('node out/app.js');
    console.log(`consumer smoke test passed on React ${reactMajor}`);
} finally {
    rmSync(dir, { recursive: true, force: true });
}
