import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));

type TextResult = { content: { type: string; text: string }[] };

describe('src/stdio.integration.test.ts - ptrn-mcp over stdio', () => {
    let client: Client;

    before(async () => {
        client = new Client({ name: 'test', version: '0.0.0' });
        await client.connect(
            new StdioClientTransport({
                command: process.execPath,
                args: ['--import', 'tsx', 'src/stdio.ts'],
                cwd: packageRoot,
            }),
        );
    });

    after(async () => {
        await client.close();
    });

    async function call(name: string, args: Record<string, unknown> = {}) {
        const result = (await client.callTool({ name, arguments: args })) as TextResult;
        return JSON.parse(result.content[0].text);
    }

    test('lists every tool and the build_ui prompt', async () => {
        const tools = (await client.listTools()).tools.map((t) => t.name).sort();
        assert.deepEqual(tools, [
            'get_component',
            'get_guidelines',
            'get_tokens',
            'list_components',
            'search_components',
            'search_icons',
            'validate_code',
        ]);
        const prompts = (await client.listPrompts()).prompts.map((p) => p.name);
        assert.deepEqual(prompts, ['build_ui']);
    });

    test('search_components finds a component by purpose', async () => {
        const result = await call('search_components', { query: 'date picker' });
        assert.equal(result.components[0].name, 'DatePicker');
    });

    test('get_component returns props and the import path', async () => {
        const { component } = await call('get_component', { name: 'Button' });
        assert.equal(component.import, '@ptrn/react/Button');
        assert.ok(component.props.some((p: { name: string }) => p.name === 'variant'));
    });

    test('get_component suggests a name for a typo instead of failing', async () => {
        const result = await call('get_component', { name: 'Buton' });
        assert.ok(result.didYouMean.includes('Button'));
    });

    test('search_icons finds an icon by meaning', async () => {
        const result = await call('search_icons', { query: 'user' });
        assert.ok(result.icons.length > 0);
        assert.match(result.icons[0].import, /^@ptrn\/icons\//);
    });

    test('get_tokens lists groups, then a group', async () => {
        const kinds = await call('get_tokens');
        assert.ok(kinds.kinds.some((k: { kind: string }) => k.kind === 'spacing'));
        const spacing = await call('get_tokens', { kind: 'spacing' });
        assert.ok(spacing.tokens.some((t: { name: string }) => t.name === '--usa-spacing-2'));
    });

    test('validate_code passes valid code and catches a bad prop value', async () => {
        const good = await call('validate_code', {
            code: `import { Button } from '@ptrn/react/Button';\nconst a = <Button label="Save" variant="primary" />;`,
        });
        assert.equal(good.ok, true);

        const bad = await call('validate_code', {
            code: `import { Button } from '@ptrn/react/Button';\nconst a = <Button label="Save" variant="huge" />;`,
        });
        assert.equal(bad.ok, false);
        assert.equal(bad.issues[0].rule, 'invalid-prop-value');
    });

    test('get_guidelines returns the guide as text', async () => {
        const result = (await client.callTool({ name: 'get_guidelines', arguments: {} })) as TextResult;
        assert.match(result.content[0].text, /Building UI with pttrn/);
    });

    test('build_ui embeds the request and the process', async () => {
        const prompt = await client.getPrompt({ name: 'build_ui', arguments: { description: 'a login form' } });
        const content = prompt.messages[0].content;
        assert.equal(content.type, 'text');
        assert.match(content.type === 'text' ? content.text : '', /a login form/);
        assert.match(content.type === 'text' ? content.text : '', /validate_code/);
    });
});
