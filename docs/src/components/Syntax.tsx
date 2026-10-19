import { Fab } from '@ptrn/react/Fab';
import { useId } from '@ptrn/react/hooks/useId';
import { useTimeout } from '@ptrn/react/hooks/useTimeout';
import { PrettyParser } from '@ptrn/react/utils/demo';
import hljs from 'highlight.js';
import { CSSProperties, useEffect, useRef, useState } from 'react';
import { pretty } from 'utils/pretty';
import useMountedState from 'utils/useMountState';

export function Syntax({
    code: preCode,
    language = 'typescript',
    style: propStyle = {},
    pretty: prettyProp,
}: {
    code: string;
    language?: PrettyParser;
    style?: CSSProperties;
    pretty?: boolean;
}) {
    const makePretty =
        prettyProp || language === 'typescript' || language.endsWith('css') || language.endsWith('script');

    const preId = useId();

    const [code, setCode] = useState('');

    const isMounted = useMountedState();

    const element = useRef<HTMLElement | null>(null);

    useEffect(() => {
        element.current = document.querySelector<HTMLElement>(`pre[id="${preId}"] code`)!;
    }, [preId]);

    useEffect(() => {
        if (!makePretty) {
            setCode(preCode);
            return;
        }
        pretty(preCode, { parser: language }).then((next) => {
            if (isMounted()) setCode(next);
            delete element.current!.dataset.highlighted;
        });
    }, [preCode, isMounted, makePretty, language]);

    useEffect(() => {
        if (!element.current) return;

        if (code && element.current?.dataset.highlighted !== 'yes') hljs.highlightElement(element.current);
    }, [code, preId]);

    const DEFAULT_COPY_LABEL = 'Copy';

    const [copyLabel, setCopyLabel] = useState(() => DEFAULT_COPY_LABEL);
    const copyTimeout = useTimeout();

    return (
        <div data-syntax style={propStyle}>
            <Fab
                data-copy-code
                label={copyLabel}
                onClick={() => {
                    if (!navigator?.clipboard?.writeText) return;

                    navigator.clipboard.writeText(code);
                    setCopyLabel('Copied');
                    copyTimeout.set(() => setCopyLabel(DEFAULT_COPY_LABEL), 2000);
                }}
                placement="top-right"
                size="medium"
                style={{ marginTop: '-10px', marginRight: '-10px' }}
                variant="neutral"
            />
            <pre id={preId}>
                <code className={`language-${language}`}>{code}</code>
            </pre>
        </div>
    );
}
