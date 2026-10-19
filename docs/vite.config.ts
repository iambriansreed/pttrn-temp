import { execSync } from 'child_process';
import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { NodePackageImporter } from 'sass-embedded';
import { defineConfig, loadEnv } from 'vite';
import { run } from 'vite-plugin-run';

const debouncedMetaBuild = debounceMetaOnChange();

const REACT_SRC = resolve(__dirname, '../packages/react/src');

export default ({ mode, command }: { mode: string; command: 'build' | 'serve' }) => {
    process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

    // Set VITE_DEV_HOST (for example in docs/.env.local) when the dev server is reached through a local HTTPS proxy
    // such as https://pttrn.local: the HMR socket then connects through that origin on 443 instead of localhost.
    const proxyHost = process.env.VITE_DEV_HOST;

    return defineConfig({
        css: {
            preprocessorOptions: {
                scss: {
                    api: 'modern-compiler', // or "modern"
                    // Resolves `@use 'pkg:@ptrn/styles/...'` in the React styles. Vite compiles with sass-embedded, so
                    // the importer must come from it too; one from `sass` fails with "findFileUrl is not a function".
                    // @ts-expect-error Vite types this option with sass's declarations, not sass-embedded's.
                    importers: [new NodePackageImporter()],
                },
            },
        },
        publicDir: './assets',
        plugins: [
            react(),
            run([
                {
                    name: 'UI Updates',
                    condition: (file) => {
                        return file.includes('packages/react');
                    },
                    onFileChanged: ({ file }) => {
                        console.log(`File changed: ${file}`);
                        if (process.env.UPDATE_META === 'true') debouncedMetaBuild();
                    },
                },
            ]),
            {
                name: 'custom-dev-events',
                configureServer(server) {
                    server.ws.on('request-meta-refresh', () => {
                        execSync(`npm run meta`, { stdio: 'inherit' });
                    });
                },
            },
        ],
        optimizeDeps: {
            exclude: ['@ptrn/react'],
        },
        server: {
            port: 8055,
            ...(proxyHost
                ? { hmr: { host: proxyHost, protocol: 'wss', clientPort: 443 }, allowedHosts: [proxyHost] }
                : {}),
        },
        preview: {
            port: 8055,
            ...(proxyHost ? { allowedHosts: [proxyHost] } : {}),
        },
        build: {
            outDir: './dist',
            emptyOutDir: true,
        },
        resolve: {
            alias: [
                { find: 'src', replacement: '/src' },
                { find: 'components', replacement: '/src/components' },
                { find: 'utils', replacement: '/src/utils' },
                { find: 'tests', replacement: '/tests' },
                // In dev, @ptrn/react comes from its source so edits show up without a rebuild (the workspace link
                // resolves the package's exports to dist). A build keeps using dist, so it tests the built package.
                ...(command === 'serve'
                    ? [
                          {
                              find: /^@ptrn\/react\/(constants|hooks|rtl|styles|types|utils)\/(.*)$/,
                              replacement: `${REACT_SRC}/$1/$2`,
                          },
                          { find: /^@ptrn\/react\/(.*)$/, replacement: `${REACT_SRC}/components/$1` },
                      ]
                    : []),
                // the aliases @ptrn/react uses inside its own source
                { find: '-/components', replacement: `${REACT_SRC}/components` },
                { find: '-/hooks', replacement: `${REACT_SRC}/hooks` },
                { find: '-/utils', replacement: `${REACT_SRC}/utils` },
                { find: '-/constants', replacement: `${REACT_SRC}/constants` },
                { find: '-/styles', replacement: `${REACT_SRC}/styles` },
                { find: '-/types', replacement: `${REACT_SRC}/types` },
            ],
        },
    });
};

/**
 * This function debounces the meta file rebuild process.
 *
 * @returns A debounced function that rebuilds the meta files.
 */
function debounceMetaOnChange() {
    let debouncedMetaTimeout: NodeJS.Timeout | null = null;
    return () => {
        if (debouncedMetaTimeout) clearTimeout(debouncedMetaTimeout);
        debouncedMetaTimeout = setTimeout(() => {
            try {
                execSync(`npm run meta`, { stdio: 'inherit' });
            } catch (error) {
                console.error('Error occurred while running meta:', error);
            }
        }, 3000);
    };
}
