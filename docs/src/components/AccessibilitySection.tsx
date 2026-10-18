import { SvgCheck } from '@ptrn/icons/Check';
import { SvgRemove } from '@ptrn/icons/Remove';
import { ListItem } from '@ptrn/react/ListItem';
import { SkeletonText } from '@ptrn/react/SkeletonText';
import { Txt } from '@ptrn/react/Txt';
import axe from 'axe-core';
import { useEffect, useMemo, useRef } from 'react';
import { useComponentContext } from 'components/ComponentProvider';
import { Syntax } from 'components/Syntax';

export type AccessibilitySectionProps = {
    context: HTMLElement | null;
};

export function AccessibilitySection({ context }: AccessibilitySectionProps) {
    const { axeResults, setAxeResults } = useComponentContext();

    const loadingRef = useRef(false);

    const runTimeout = useRef<ReturnType<typeof setTimeout>>();

    const code = context?.innerHTML || '';

    useEffect(() => {
        if (!context || !code || axeResults[code] || loadingRef.current) return;
        loadingRef.current = true;
        if (runTimeout.current) clearTimeout(runTimeout.current);

        runTimeout.current = setTimeout(() => {
            axe.run(context).then((results) => {
                setAxeResults({ [code]: results });
                loadingRef.current = false;
            });
        }, 1000);

        return () => {
            if (runTimeout.current) clearTimeout(runTimeout.current);
            loadingRef.current = false;
        };
    }, [context, setAxeResults, axeResults, code, runTimeout]);

    const results = useMemo(() => (code ? axeResults[code] : undefined), [axeResults, code]);

    return (
        <div data-axe-results>
            <Txt as="h5" variant="heading-h5">
                Violations
            </Txt>

            {!results && <SkeletonText lines={3} variant="body-base" />}

            {results?.violations.length === 0 ? (
                <p style={{ color: 'var(--theme-color-success-medium)' }}>No accessibility violations found.</p>
            ) : (
                results?.violations.map((violation) => (
                    <div data-axe-violations key={violation.id}>
                        <ListItem as="div" data-axe-violations label={violation.description} leading={<SvgRemove />} />
                        {violation.nodes.map((node, index) => (
                            <div data-axe-node key={index}>
                                <Syntax code={node.html} language="html" />
                                <p>Failure Summary:</p>
                                <p>{node.failureSummary}</p>
                            </div>
                        ))}
                    </div>
                ))
            )}

            <Txt as="h5" variant="heading-h5">
                Passes
            </Txt>

            {!results && <SkeletonText lines={3} variant="body-base" />}

            {results?.passes.length === 0 ? (
                <p>No passes reported.</p>
            ) : (
                results?.passes.map((pass) => (
                    <ListItem as="div" data-axe-pass key={pass.id} label={pass.description} leading={<SvgCheck />} />
                ))
            )}
        </div>
    );
}
