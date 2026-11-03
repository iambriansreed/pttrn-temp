import { PrettyParser } from '@ptrn/react/utils/demo';
import MarkdownBase, { RuleType } from 'markdown-to-jsx';
import { Fragment } from 'react';
import { Syntax } from 'components/Syntax';
import { headingId } from 'src/utils/markdownText';

/**
 * Renders a markdown document as USWDS prose (`@ptrn/styles/prose.css`). The blocks are direct children of the
 * `data-prose` element, which is what the prose styles select.
 *
 * Headings get ids from `headingId`, the same ids the search links to. `idPrefix` keeps them unique when one page
 * renders several documents with the same headings, such as two changelogs that both have a `0.1.0`.
 */
export function Markdown({ md, idPrefix }: { md: string; idPrefix?: string }) {
    return (
        <div data-prose>
            <MarkdownBase
                options={{
                    wrapper: Fragment,
                    forceWrapper: true,
                    slugify: (heading) => headingId(heading, idPrefix),
                    renderRule(next, node, _, state) {
                        if (node.type === RuleType.codeBlock) {
                            let language: PrettyParser | undefined;

                            if (node.lang === 'tsx') language = 'typescript';
                            if (node.lang === 'ts') language = 'typescript';
                            if (node.lang === 'css') language = 'scss';
                            if (node.lang === 'bash') language = 'bash' as unknown as PrettyParser;

                            return <Syntax code={node.text} key={state.key} language={language} />;
                        }
                        return next();
                    },
                }}
            >
                {md}
            </MarkdownBase>
        </div>
    );
}
