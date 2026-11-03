import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

import { loadCatalog, loadGuide } from '../src/core/catalog.js';
import { fixture } from '../src/core/fixture.js';
import type { Catalog } from '../src/core/types.js';
import { RULES, validateCode } from '../src/core/validate.js';
import {
    type AgentDocsInput,
    DESIGN_MD_EXAMPLES,
    DOCS_PAGES,
    renderDesignMd,
    renderLlmsTxt,
    serverTools,
} from './agent-docs.js';

const catalog: Catalog = {
    ...fixture,
    components: [
        ...fixture.components,
        {
            name: 'Flag',
            slug: 'flag',
            description: 'Not ready.',
            phase: 'Backlog',
            import: '@ptrn/react/Flag',
            dependencies: [],
            props: [],
        },
        {
            name: 'Flex',
            slug: 'flex',
            description: 'Lays out its children.\n\nMore detail.',
            phase: 'Utility',
            import: '@ptrn/react/Flex',
            dependencies: [],
            props: [],
        },
    ],
};

describe('agent docs', () => {
    let input: AgentDocsInput;

    before(async () => {
        input = {
            catalog,
            guide: loadGuide(),
            tools: await serverTools(catalog, loadGuide()),
            elements: [{ tag: 'pttrn-accordion', description: 'A vertical stack\nof collapsible panels.' }],
            site: 'https://example.test',
            repository: 'https://github.com/pttrn/pttrn',
        };
    });

    // https://llmstxt.org: an H1, a blockquote summary, then H2 sections of markdown links.
    test('llms.txt follows the llms.txt layout', () => {
        const text = renderLlmsTxt(input);
        const [h1, , summary] = text.split('\n');
        assert.equal(h1, '# pttrn');
        assert.match(summary, /^> pttrn is a design system/);
        assert.equal(text.match(/^# /gm)?.length, 1, 'one H1');
        assert.ok(text.includes('\n## Docs\n'));
        assert.ok(text.includes('\n## Optional\n'), 'secondary links go under Optional');
        for (const line of text.split('\n').filter((l) => l.startsWith('- '))) {
            assert.match(line, /^- \[[^\]]+\]\(https:\/\/[^)]+\)(: .+)?$/, line);
        }
    });

    test('llms.txt links every component but the backlog to its page, with its import path', () => {
        const text = renderLlmsTxt(input);
        assert.ok(text.includes('- [Button](https://example.test/button): `@ptrn/react/Button`. A clickable'));
        assert.ok(text.includes('- [Flex](https://example.test/flex): `@ptrn/react/Flex`. Lays out its children.\n'));
        assert.ok(!text.includes('Flag'));
        for (const page of DOCS_PAGES) assert.ok(text.includes(`](https://example.test${page.path})`), page.path);
        assert.ok(text.includes('](https://example.test/DESIGN.md)'));
    });

    test('DESIGN.md lists every validator rule and every tool the server registers', () => {
        const text = renderDesignMd(input);
        for (const [id, rule] of Object.entries(RULES))
            assert.ok(text.includes(`| \`${id}\` | ${rule.severity} |`), id);
        assert.deepEqual(
            input.tools.map((t) => t.name),
            [
                'list_components',
                'search_components',
                'get_component',
                'search_icons',
                'get_tokens',
                'get_guidelines',
                'validate_code',
            ],
        );
        for (const tool of input.tools) assert.ok(text.includes(`- \`${tool.name}\`: ${tool.description}`), tool.name);
    });

    test('DESIGN.md carries the guide rules, the token tiers, the setup and the components', () => {
        const text = renderDesignMd(input);
        assert.ok(text.includes('### Tokens, not hardcoded values'), 'the guide rules, a level down');
        assert.ok(!text.includes('\n## Setup\n'), "the guide's setup is replaced by DESIGN.md's own");
        assert.match(text, /\| Primitive \| `--usa-\*` \| 3 \|/);
        assert.ok(text.includes('`--usa-spacing-1` is 8px'));
        assert.ok(text.includes('npx -y @ptrn/mcp'));
        assert.ok(text.includes('- `<pttrn-accordion>`: A vertical stack of collapsible panels.'));
        assert.ok(text.includes('| [Button](https://example.test/button) | `@ptrn/react/Button` |'));
        assert.ok(!text.includes('Flag'));
    });

    // An agent copies the setup it is shown, so it has to pass the checks the MCP server would run on it.
    test('every TSX example in DESIGN.md passes validate_code against the real catalog', () => {
        for (const example of DESIGN_MD_EXAMPLES) {
            assert.deepEqual(validateCode(loadCatalog(), example).issues, []);
            assert.ok(renderDesignMd(input).includes(example));
        }
    });
});
