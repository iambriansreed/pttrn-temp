/**
 * Renders DESIGN.md and llms.txt, the files coding agents read to learn a design system: what pttrn is, how to install
 * and set it up, the rules the MCP validator enforces, the token tiers, and every component with its import path, phase
 * and docs page.
 *
 * Both are rendered from what the MCP server serves: the catalog (`buildCatalog`), the consumer guide (`guide.md`), the
 * tools the server registers and the validator's `RULES`. The docs site serves them at its root
 * (`docs/.scripts/agent-files.ts`) and @ptrn/react ships DESIGN.md (its `prepack` runs this file), so none of them can
 * drift from the server or the packages.
 *
 * $ tsx scripts/agent-docs.ts <dir>/DESIGN.md <dir>/llms.txt $ tsx scripts/agent-docs.ts --clean <dir>/DESIGN.md
 *
 * Each argument is a file to write; its name picks the content (`llms.txt`, or DESIGN.md for anything else). `--clean`
 * removes them instead (a `postpack`). Progress goes to stderr, so `npm pack --json` output stays parseable.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { createServer } from '../src/core/server.js';
import type { Catalog, Component, ComponentPhase } from '../src/core/types.js';
import { RULES } from '../src/core/validate.js';
import { buildCatalog } from './catalog.js';

/** A docs page the files link to, besides the component pages. The docs suite opens every one. */
export type DocsPage = { path: string; title: string; description: string; optional?: boolean };

export const DOCS_PAGES: DocsPage[] = [
    {
        path: '/get-started',
        title: 'Get started',
        description: 'Install the packages and load the styles.',
    },
    { path: '/components', title: 'Components', description: 'Every component, with its phase.' },
    {
        path: '/tokens',
        title: 'Design tokens',
        description: 'The three token tiers, theme modes, naming, and the rules for component styles.',
    },
    {
        path: '/styles',
        title: 'Styles',
        description: 'The USWDS themes, the style provider, and the stylesheets in @ptrn/styles.',
    },
    { path: '/typography', title: 'Typography', description: 'USWDS prose: headings, lists, tables and text.' },
    { path: '/icons', title: 'Icons', description: 'Every icon in @ptrn/icons.' },
    {
        path: '/ai-readiness',
        title: 'AI readiness',
        description: 'The MCP server, llms.txt and DESIGN.md, and where pttrn stands on the Agent-Ready signals.',
    },
    {
        path: '/figma-plugin',
        title: 'Figma plugin',
        description: 'Exports the USWDS Design Kit variables as the DTCG token files @ptrn/styles builds from.',
        optional: true,
    },
    {
        path: '/contributing',
        title: 'Contributing',
        description: 'Working on pttrn itself: setup, scripts and pull requests.',
        optional: true,
    },
    {
        path: '/guidelines',
        title: 'Developer guidelines',
        description: 'How pttrn library code is written.',
        optional: true,
    },
];

/** A custom element from the @ptrn/web Custom Elements Manifest. */
export type WebElement = { tag: string; description: string };

export type AgentDocsInput = {
    catalog: Catalog;
    /** The consumer guide the MCP server returns from `get_guidelines`. */
    guide: string;
    /** The tools the MCP server registers, as a client lists them. */
    tools: { name: string; description: string }[];
    elements: WebElement[];
    /** The docs site origin, without a trailing slash. */
    site: string;
    repository: string;
};

/** The phases listed, in order, and how each is introduced. Backlog components are not ready and are left out. */
const PHASES: { phase: ComponentPhase; title: string; description: string }[] = [
    { phase: 'Stable', title: 'Components', description: 'Stable: production ready.' },
    {
        phase: 'UXReview',
        title: 'Components in UX review',
        description: 'Built and in UX review. Usable, but the API may still change.',
    },
    { phase: 'Dev', title: 'Components in development', description: 'In development. Expect changes.' },
    {
        phase: 'Utility',
        title: 'Utilities',
        description: 'Providers and layout building blocks that the components are made of.',
    },
];

const SUMMARY =
    'pttrn is a design system built on the U.S. Web Design System (USWDS): React components (`@ptrn/react`), Web ' +
    'Components (`@ptrn/web`), icons (`@ptrn/icons`) and the USWDS Design Kit tokens (`@ptrn/styles`), with an MCP ' +
    'server (`@ptrn/mcp`) that lets an AI look the system up and check the code it writes.';

/** The tiers of `docs/src/docs/tokens.md`, with preferred examples (only those that exist are shown). */
const TOKEN_TIERS = [
    {
        tier: 'Primitive',
        prefix: '--usa-',
        examples: ['--usa-color-red-50', '--usa-spacing-2'],
        role: 'The USWDS palette and scales. Never changes with the theme.',
    },
    {
        tier: 'Theme',
        prefix: '--theme-',
        examples: ['--theme-color-ink', '--theme-color-primary'],
        role: 'Semantic choices made from primitives. Changes with the theme.',
    },
    {
        tier: 'Component',
        prefix: '--component-',
        examples: ['--component-button-padding', '--component-accordion-background-color'],
        role: "One component's design decisions, from its spec in Figma.",
    },
];

const REACT_SETUP = `import '@ptrn/styles/fonts.css';
import { Button } from '@ptrn/react/Button';
import { StylesProvider } from '@ptrn/react/StylesProvider';
import { UIProvider } from '@ptrn/react/UIProvider';

export function App() {
    return (
        <UIProvider>
            <StylesProvider />
            <Button label="Save" variant="primary" />
        </UIProvider>
    );
}`;

const MCP_CONFIG = `{
    "mcpServers": {
        "pttrn": {
            "command": "npx",
            "args": ["-y", "@ptrn/mcp"]
        }
    }
}`;

/** The TSX examples DESIGN.md shows, so a test can hold them to the validator. */
export const DESIGN_MD_EXAMPLES = [REACT_SETUP];

/** The first paragraph of a description as one sentence-terminated line, safe in a markdown table cell or list item. */
function oneLine(text: string): string {
    const line = text
        .trim()
        .split(/\n\s*\n/)[0]
        .replace(/\s+/g, ' ')
        .replace(/\|/g, '\\|');
    return /[.!?)]$/.test(line) ? line : `${line}.`;
}

function pageUrl(site: string, component: Component) {
    return `${site}/${component.slug}`;
}

function byPhase(catalog: Catalog, phase: ComponentPhase) {
    return catalog.components.filter((c) => c.phase === phase).sort((a, b) => a.name.localeCompare(b.name));
}

/** The guide's sections from `## Imports` on, one heading level down; its setup is covered by DESIGN.md's own. */
function guideRules(guide: string): string {
    const start = guide.indexOf('\n## Imports');
    return (start === -1 ? guide : guide.slice(start + 1)).replace(/^## /gm, '### ').trim();
}

/** The llms.txt (https://llmstxt.org): an H1, a blockquote summary, notes, then sections of links. */
export function renderLlmsTxt({ catalog, site, repository }: AgentDocsInput): string {
    const page = (p: DocsPage) => `- [${p.title}](${site}${p.path}): ${p.description}`;
    const component = (c: Component) =>
        `- [${c.name}](${pageUrl(site, c)}): \`${c.import}\`. ${oneLine(c.description)}`;

    return [
        '# pttrn',
        `> ${SUMMARY}`,
        [
            `This index describes @ptrn/react ${catalog.meta.version}. Import each component from its own path ` +
                "(`import { Button } from '@ptrn/react/Button'`), never from the package root, and each icon the same " +
                "way (`import { SvgPerson } from '@ptrn/icons/Person'`). Style with the USWDS tokens " +
                '(`var(--usa-spacing-2)`, `--theme-color-*`), never hard-coded colors or pixel spacing.',
            '',
            'For the whole system in one file, read DESIGN.md. To let an AI client look components up and check the ' +
                'code it writes, run the MCP server: `npx -y @ptrn/mcp`.',
        ].join('\n'),
        [
            '## Docs',
            '',
            `- [DESIGN.md](${site}/DESIGN.md): The whole system for an agent: setup for React and Web Components, ` +
                'the rules the MCP validator enforces, the token tiers, and every component with its import path.',
            ...DOCS_PAGES.filter((p) => !p.optional).map(page),
        ].join('\n'),
        ...PHASES.map(({ phase, title, description }) =>
            [`## ${title}`, '', `${description}`, '', ...byPhase(catalog, phase).map(component)].join('\n'),
        ),
        [
            '## Optional',
            '',
            ...DOCS_PAGES.filter((p) => p.optional).map(page),
            `- [@ptrn/mcp](https://www.npmjs.com/package/@ptrn/mcp): The MCP server on npm.`,
            `- [Source](${repository}): The monorepo: every package, the docs site and the Figma plugin.`,
        ].join('\n'),
    ]
        .join('\n\n')
        .concat('\n');
}

/** DESIGN.md: the whole system for a coding agent, in one file. */
export function renderDesignMd({ catalog, guide, tools, elements, site, repository }: AgentDocsInput): string {
    const spacing = catalog.tokens.find((t) => t.name === '--usa-spacing-1');
    const tokenRows = TOKEN_TIERS.map(({ tier, prefix, examples, role }) => {
        const tokens = catalog.tokens.filter((t) => t.name.startsWith(prefix));
        const shown = examples.filter((name) => tokens.some((t) => t.name === name));
        const example = (shown.length ? shown : tokens.slice(0, 1).map((t) => t.name)).map((n) => `\`${n}\``);
        return `| ${tier} | \`${prefix}*\` | ${tokens.length} | ${example.join(', ')} | ${role} |`;
    });

    const componentTable = (phase: ComponentPhase) => [
        '| Component | Import | Description |',
        '| --- | --- | --- |',
        ...byPhase(catalog, phase).map(
            (c) => `| [${c.name}](${pageUrl(site, c)}) | \`${c.import}\` | ${oneLine(c.description)} |`,
        ),
    ];

    const elementLines = elements.length
        ? [
              '',
              'Elements so far:',
              '',
              ...elements.map((e) => `- \`<${e.tag}>\`: ${oneLine(e.description)}`),
              '',
              'The Custom Elements Manifest (`@ptrn/web/custom-elements.json`) lists every attribute, property, event, ' +
                  'slot and CSS part.',
          ]
        : [];

    return [
        '# pttrn design system',
        `> ${SUMMARY}`,
        `This file describes @ptrn/react ${catalog.meta.version} for coding agents and the tools that read a design ` +
            "system's DESIGN.md. It is generated from the component metadata, the token stylesheets and the MCP " +
            `server's own rules, so it matches the packages it ships with. Docs: ${site}. Index for agents: ` +
            `${site}/llms.txt.`,
        [
            '## Packages',
            '',
            '| Package | What it is |',
            '| --- | --- |',
            '| `@ptrn/react` | React components (React 18.3 and 19), one import path per component. |',
            '| `@ptrn/web` | Web Components: framework-free custom elements built with Lit. |',
            `| \`@ptrn/icons\` | ${catalog.icons.length} icons, one import path per icon. |`,
            '| `@ptrn/styles` | The USWDS Design Kit tokens as CSS custom properties, the USWDS themes, and the DTCG token files they are built from. |',
            '| `@ptrn/mcp` | The MCP server: component lookup, tokens, icons, and `validate_code`. |',
        ].join('\n'),
        [
            '## Set up React',
            '',
            '```bash',
            'npm install @ptrn/react @ptrn/icons @ptrn/styles react react-dom',
            '```',
            '',
            'Import the fonts once in the entry so the bundler ships them, render `StylesProvider` once to load the ' +
                'tokens, every theme and the base styles, and wrap the app in `UIProvider`, which holds the theme, ' +
                'responsive state and live announcements:',
            '',
            '```tsx',
            REACT_SETUP,
            '```',
            '',
            'Without React, load `@ptrn/styles/reset.css`, `@ptrn/styles/tokens.css` and one theme from ' +
                '`@ptrn/styles/themes/`. The theme is `default` until a `data-uswds-theme` attribute ' +
                '(`project-theme`, `project-theme-dark`) on `<html>` or any element picks another.',
        ].join('\n'),
        [
            '## Set up Web Components',
            '',
            'No framework and no build step: load the tokens, a theme and the elements.',
            '',
            '```html',
            '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ptrn/styles/tokens.css" />',
            '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ptrn/styles/themes/default.css" />',
            '<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web/dist/cdn/pttrn-web.min.js"></script>',
            '```',
            '',
            'From npm, `npm install @ptrn/web` and import a component to register its elements ' +
                "(`import '@ptrn/web/Accordion';`), or import `@ptrn/web` to register all of them.",
            ...elementLines,
        ].join('\n'),
        [
            '## Use the MCP server',
            '',
            'The server gives an AI client this whole catalog and checks the code it writes. Nothing calls an LLM: ' +
                'the client writes the code, the server supplies the system and the checks.',
            '',
            '```bash',
            'claude mcp add pttrn -- npx -y @ptrn/mcp',
            '```',
            '',
            'Any other client (Claude Desktop, Cursor and more) takes the same command in its MCP config:',
            '',
            '```json',
            MCP_CONFIG,
            '```',
            '',
            'Its tools:',
            '',
            ...tools.map((t) => `- \`${t.name}\`: ${t.description}`),
            '',
            'Its `build_ui` prompt runs the whole loop: search, read each component, write the code, validate, fix.',
        ].join('\n'),
        ['## Rules', '', guideRules(guide)].join('\n'),
        [
            '## What validate_code checks',
            '',
            'Errors mean the code is wrong. Warnings mean it works but leaves the design system.',
            '',
            '| Rule | Severity | Checks |',
            '| --- | --- | --- |',
            ...Object.entries(RULES).map(([id, rule]) => `| \`${id}\` | ${rule.severity} | ${rule.description} |`),
        ].join('\n'),
        [
            '## Tokens',
            '',
            `Every color, size, radius, shadow and type setting is a USWDS Design Kit token, a CSS custom property ` +
                `named for its Figma variable. Use the highest tier that expresses the intent. See ${site}/tokens.`,
            '',
            '| Tier | Prefix | Count | Example | Role |',
            '| --- | --- | --- | --- | --- |',
            ...tokenRows,
            '',
            'Names are lowercase paths, `tier-object-property-variant`: `--component-accordion-background-color` is ' +
                "the accordion's background color. Spacing comes from the `--usa-spacing-*` scale" +
                (spacing ? ` (\`${spacing.name}\` is ${spacing.value})` : '') +
                '. Theme tokens change with `data-uswds-theme`, so a component that uses them works in every ' +
                'theme, the dark one included.',
        ].join('\n'),
        ...PHASES.map(({ phase, title, description }) =>
            [`## ${title}`, '', description, '', ...componentTable(phase)].join('\n'),
        ),
        [
            '## Icons',
            '',
            `${catalog.icons.length} icons, each on its own path with an \`Svg\` prefix on the export: ` +
                "`import { SvgPerson } from '@ptrn/icons/Person';`. Find one with the MCP server's `search_icons` " +
                `or at ${site}/icons. Never invent an icon name.`,
        ].join('\n'),
        `Source: ${repository}. Components still in the backlog are not listed and are not ready to use.`,
    ]
        .join('\n\n')
        .concat('\n');
}

/** The tools the MCP server registers, listed through a real MCP client so the descriptions are the server's own. */
export async function serverTools(catalog: Catalog, guide: string): Promise<AgentDocsInput['tools']> {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createServer(catalog, guide);
    const client = new Client({ name: 'agent-docs', version: catalog.meta.version });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    try {
        const { tools } = await client.listTools();
        return tools.map((t) => ({ name: t.name, description: t.description ?? '' }));
    } finally {
        await client.close();
        await server.close();
    }
}

function webElements(root: string): WebElement[] {
    const manifest = path.resolve(root, 'packages/web/dist/custom-elements.json');
    if (!fs.existsSync(manifest)) return [];
    const { modules } = JSON.parse(fs.readFileSync(manifest, 'utf-8')) as {
        modules: { declarations?: { tagName?: string; description?: string }[] }[];
    };
    return modules
        .flatMap((m) => m.declarations ?? [])
        .flatMap((d) => (d.tagName ? { tag: d.tagName, description: d.description ?? '' } : []))
        .sort((a, b) => a.tag.localeCompare(b.tag));
}

/** Everything the files are rendered from. `root` is the repository root. */
export async function loadAgentDocsInput(root: string): Promise<AgentDocsInput> {
    const { catalog } = buildCatalog(root);
    const guide = fs.readFileSync(path.resolve(root, 'packages/mcp/guide.md'), 'utf-8');
    const cname = path.resolve(root, 'docs/assets/CNAME');
    const host = fs.existsSync(cname) ? fs.readFileSync(cname, 'utf-8').trim() : 'pttrn.iambrian.com';
    const { repository } = JSON.parse(fs.readFileSync(path.resolve(root, 'packages/react/package.json'), 'utf-8')) as {
        repository: { url: string };
    };

    return {
        catalog,
        guide,
        tools: await serverTools(catalog, guide),
        elements: webElements(root),
        site: `https://${host}`,
        repository: repository.url.replace(/^git\+/, '').replace(/\.git$/, ''),
    };
}

export function renderAgentDoc(file: string, input: AgentDocsInput): string {
    return path.basename(file) === 'llms.txt' ? renderLlmsTxt(input) : renderDesignMd(input);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const args = process.argv.slice(2);
    const files = args.filter((arg) => arg !== '--clean');
    if (args.includes('--clean')) {
        for (const file of files) fs.rmSync(file, { force: true });
    } else {
        const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
        const input = await loadAgentDocsInput(root);
        for (const file of files) {
            fs.writeFileSync(file, renderAgentDoc(file, input));
            console.error(`Wrote ${file}`);
        }
    }
}
