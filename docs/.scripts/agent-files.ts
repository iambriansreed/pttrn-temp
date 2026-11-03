// cspell:words llms
/**
 * Serves `/llms.txt` and `/DESIGN.md`, the files coding agents read to learn pttrn, at the site root.
 *
 * Both are rendered from what the MCP server serves (`packages/mcp/scripts/agent-docs.ts`: the component catalog, the
 * consumer guide, the server's tools and the validator's rules), so the site, the server and the packages cannot
 * describe different systems. A build writes them into `dist`; the dev server renders them on each request.
 */
import path from 'path';

import { Plugin } from 'vite';

import { loadAgentDocsInput, renderAgentDoc } from '../../packages/mcp/scripts/agent-docs';

const FILES: Record<string, string> = {
    'llms.txt': 'text/plain; charset=utf-8',
    'DESIGN.md': 'text/markdown; charset=utf-8',
};

const root = path.resolve(__dirname, '../..');

export function agentFiles(): Plugin {
    return {
        name: 'pttrn-agent-files',
        async generateBundle() {
            const input = await loadAgentDocsInput(root);
            for (const fileName of Object.keys(FILES)) {
                this.emitFile({ type: 'asset', fileName, source: renderAgentDoc(fileName, input) });
            }
        },
        configureServer(server) {
            server.middlewares.use((request, response, next) => {
                const fileName = request.url?.split('?')[0].replace(/^\//, '') ?? '';
                if (!(fileName in FILES)) return next();
                loadAgentDocsInput(root)
                    .then((input) => {
                        response.setHeader('Content-Type', FILES[fileName]);
                        response.end(renderAgentDoc(fileName, input));
                    })
                    .catch(next);
            });
        },
    };
}
