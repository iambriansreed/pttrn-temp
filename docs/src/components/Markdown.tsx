import { PrettyParser } from '@ptrn/react/utils/demo';
import MarkdownBase, { RuleType } from 'markdown-to-jsx';
import { Fragment } from 'react';
import { Syntax } from 'components/Syntax';

/**
 * Renders a markdown document as USWDS prose (`@ptrn/styles/prose.css`). The blocks are direct children of the
 * `data-prose` element, which is what the prose styles select.
 */
export function Markdown({ md }: { md: string }) {
    return (
        <div data-prose>
            <MarkdownBase
                options={{
                    wrapper: Fragment,
                    forceWrapper: true,
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
