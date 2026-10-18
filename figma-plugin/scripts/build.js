const { execFileSync } = require('node:child_process');
const { readFileSync, writeFileSync } = require('node:fs');
const ts = require('typescript');

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

// code.ts declares PLUGIN_VERSION; the compiled file defines it, so the export's manifest records which plugin wrote it.
function stampVersion() {
    const code = readFileSync('code.js', 'utf8');
    if (!code.startsWith('const PLUGIN_VERSION')) {
        writeFileSync('code.js', `const PLUGIN_VERSION = ${JSON.stringify(version)};\n${code}`);
    }
}

// Figma loads ui.html as a string, so a relative <script src> never resolves. The compiled script has to be inlined.
const PLACEHOLDER = '<script src="ui.js"></script>';

function inlineUi() {
    const html = readFileSync('src/ui.html', 'utf8');
    if (!html.includes(PLACEHOLDER)) throw new Error(`src/ui.html must contain ${PLACEHOLDER}`);

    const script = readFileSync('ui.js', 'utf8').replace(/<\/script/gi, '<\\/script');
    writeFileSync(
        'ui.html',
        html.replace(PLACEHOLDER, () => `<script>\n${script}</script>`),
    );
}

if (process.argv.includes('--watch')) {
    const configPath = ts.findConfigFile('.', ts.sys.fileExists, 'tsconfig.json');
    const host = ts.createWatchCompilerHost(
        configPath,
        {},
        ts.sys,
        ts.createEmitAndSemanticDiagnosticsBuilderProgram,
        ts.createDiagnosticReporter(ts.sys, true),
        ts.createWatchStatusReporter(ts.sys, true),
    );
    const afterProgramCreate = host.afterProgramCreate;
    host.afterProgramCreate = (program) => {
        afterProgramCreate(program);
        stampVersion();
        inlineUi();
    };
    ts.createWatchProgram(host);
} else {
    execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.json'], {
        stdio: 'inherit',
    });
    stampVersion();
    inlineUi();
}
