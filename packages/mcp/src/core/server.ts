import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { getComponent, getTokens, listComponents, searchComponents, searchIcons } from './tools.js';
import type { Catalog } from './types.js';
import { validateCode } from './validate.js';

const INSTRUCTIONS =
    'Builds UI with the pttrn design system (@ptrn/react, @ptrn/icons, @ptrn/styles). Look components up with ' +
    'search_components and get_component instead of guessing, use tokens instead of hardcoded values, and run ' +
    'validate_code on the result before answering. The build_ui prompt does all of this.';

function json(result: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
}

/** Builds an MCP server over the catalog. Transport-free, so stdio and HTTP entry points share it. */
export function createServer(catalog: Catalog, guide: string): McpServer {
    const server = new McpServer({ name: 'ptrn-mcp', version: catalog.meta.version }, { instructions: INSTRUCTIONS });
    const readOnly = { readOnlyHint: true, openWorldHint: false };

    server.registerTool(
        'list_components',
        {
            title: 'List components',
            description: 'Lists every pttrn component with a one-line description. Use to browse what exists.',
            annotations: readOnly,
        },
        async () => json(listComponents(catalog)),
    );

    server.registerTool(
        'search_components',
        {
            title: 'Search components',
            description:
                'Finds pttrn components by name or purpose, best match first. Try this before writing any UI, for ' +
                'example "date picker", "modal" or "form field".',
            inputSchema: { query: z.string().describe('What the component does, or part of its name.') },
            annotations: readOnly,
        },
        async ({ query }) => json(searchComponents(catalog, query)),
    );

    server.registerTool(
        'get_component',
        {
            title: 'Get component',
            description:
                'Returns one component: description, every prop with type, allowed values and default, the import ' +
                'path, dependencies and a usage example when one exists. Read this before using a component.',
            inputSchema: { name: z.string().describe('Component name, for example "Button".') },
            annotations: readOnly,
        },
        async ({ name }) => json(getComponent(catalog, name)),
    );

    server.registerTool(
        'search_icons',
        {
            title: 'Search icons',
            description:
                'Finds icons by name or meaning ("user", "trash", "arrow"). Returns the import path and the named ' +
                'export to use. Never invent an icon name.',
            inputSchema: { query: z.string().describe('What the icon shows or means.') },
            annotations: readOnly,
        },
        async ({ query }) => json(searchIcons(catalog, query)),
    );

    server.registerTool(
        'get_tokens',
        {
            title: 'Get design tokens',
            description:
                'USWDS design tokens as CSS variables, with their value in each theme. Call with no kind to list the groups ' +
                '(colors, spacing, typography, surface, foreground, radius, shadows and more), then call again with ' +
                'a kind. Use tokens instead of hardcoded colors and sizes.',
            inputSchema: { kind: z.string().optional().describe('A group from the list, for example "spacing".') },
            annotations: readOnly,
        },
        async ({ kind }) => json(getTokens(catalog, kind)),
    );

    server.registerTool(
        'get_guidelines',
        {
            title: 'Get guidelines',
            description: 'Returns the rules for building UI with pttrn: setup, imports, tokens and accessibility.',
            annotations: readOnly,
        },
        async () => ({ content: [{ type: 'text' as const, text: guide }] }),
    );

    server.registerTool(
        'validate_code',
        {
            title: 'Validate code',
            description:
                'Checks TSX against the design system and reports unknown components, props or icons, values outside ' +
                "a prop's allowed set, missing required props, hardcoded colors and spacing that have a token, and " +
                'raw HTML that has a pttrn component. Each issue has a suggested fix. Run this on generated UI and ' +
                'fix every error before answering.',
            inputSchema: { code: z.string().describe('The TSX to check. A full file or a snippet.') },
            annotations: readOnly,
        },
        async ({ code }) => json(validateCode(catalog, code)),
    );

    server.registerPrompt(
        'build_ui',
        {
            title: 'Build UI with pttrn',
            description: 'Builds the requested UI with pttrn components and tokens, then validates it.',
            argsSchema: { description: z.string().describe('The UI to build, in plain language.') },
        },
        ({ description }) => ({
            messages: [
                {
                    role: 'user' as const,
                    content: {
                        type: 'text' as const,
                        text: [
                            `Build this UI with the pttrn design system: ${description}`,
                            '',
                            'Process:',
                            '1. Use search_components to find the components you need. Use search_icons for icons.',
                            '2. Call get_component for each component you plan to use, and use only its documented props.',
                            '3. Use tokens from get_tokens instead of hardcoded colors, sizes or spacing.',
                            '4. Write the code.',
                            '5. Run validate_code on it and fix every error and warning. Repeat until it comes back clean.',
                            '6. Reply with the final code.',
                            '',
                            guide,
                        ].join('\n'),
                    },
                },
            ],
        }),
    );

    return server;
}
