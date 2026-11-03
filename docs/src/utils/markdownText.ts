import { kebabCase } from 'src/utils/kebabCase';

/**
 * The text a reader sees in a line of markdown: links, images, code spans, emphasis and HTML tags are reduced to their
 * text. Used for heading ids and for the search index, so both read headings the same way.
 */
export function markdownText(markdown: string): string {
    return markdown
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/`([^`]*)`/g, '$1')
        .replace(/(\*\*|__)(.+?)\1/g, '$2')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/\b_(.+?)_\b/g, '$1')
        .replace(/\\([\\`*_{}[\]()#+\-.!|>])/g, '$1')
        .trim();
}

/**
 * The id of a markdown heading, from its source text: `## Versioning and support` is `versioning-and-support`. The
 * Markdown component gives headings these ids and the search links to them, so a result lands on its heading.
 */
export function headingId(markdown: string, prefix?: string): string {
    return kebabCase([prefix, markdownText(markdown)].filter(Boolean).join(' '));
}
