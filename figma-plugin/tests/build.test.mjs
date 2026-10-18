import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { root } from './figma.mjs';

const read = (file) => readFileSync(path.join(root, file), 'utf8');

describe('the build output', () => {
    it('stamps the package version into code.js', () => {
        const { version } = JSON.parse(read('package.json'));
        assert.ok(read('code.js').startsWith(`const PLUGIN_VERSION = ${JSON.stringify(version)};\n`));
    });

    it('inlines the compiled panel script into ui.html', () => {
        const html = read('ui.html');
        assert.ok(!html.includes('<script src='), 'Figma cannot load a script by URL from a plugin panel');
        assert.ok(html.includes(read('ui.js').replace(/<\/script/gi, '<\\/script')));
    });

    it('declares the panel as the manifest UI', () => {
        const manifest = JSON.parse(read('manifest.json'));
        assert.equal(manifest.main, 'code.js');
        assert.equal(manifest.ui, 'ui.html');
        assert.deepEqual(manifest.networkAccess, { allowedDomains: ['none'] });
    });
});
