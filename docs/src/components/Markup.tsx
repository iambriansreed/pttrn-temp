import { marked } from 'marked';
import { ComponentProps, ElementType, ReactNode } from 'react';
import { LINKS } from 'utils/links';

export type WrapHtmlProps<As extends ElementType> = {
    as?: As;
    children?: string;
};

/**
 * Adds links to a string returning ReactNode. Markdown and HTML is supported, rendered as USWDS prose.
 *
 * @param {WrapHtmlProps} props
 * @returns {ReactNode}
 */
export function Markup<As extends ElementType>({
    children,
    as: As = 'div',
    ...otherProps
}: ComponentProps<As> & WrapHtmlProps<As>): ReactNode {
    if (!children) return children;

    const sourceWithLinks = Object.entries(LINKS).reduce((acc, [word, link]) => {
        return acc.replace(new RegExp(`\\b${word}\\b`, 'g'), `[${word}](${link})`);
    }, children);

    marked.use({
        async: false,
        renderer: {
            link({ href, text }) {
                return `<a ${href.includes('http') ? 'target="_blank"' : ''} href="${href}">${text}</a>`;
            },
        },
    });

    return <As dangerouslySetInnerHTML={{ __html: marked(sourceWithLinks) as string }} data-prose {...otherProps} />;
}
