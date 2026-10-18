import { SvgContentCopy } from '@ptrn/icons/ContentCopy';
import { SvgRefresh } from '@ptrn/icons/Refresh';
import { Button } from '@ptrn/react/Button/Button';
import { Card } from '@ptrn/react/Card';
import { sendSnackbar } from '@ptrn/react/Snackbar';
import { isDarkTheme } from '@ptrn/react/utils/uiContext';
import { themes } from 'prism-react-renderer';
import { useEffect, useRef, useState } from 'react';
import { Editor } from 'react-live';
import { useGlobalState } from 'src/utils/globalState';
import { pretty } from 'src/utils/pretty';

/** Tags that look like custom elements (a dash in the name) but nothing has registered. */
function unknownElements(html: string) {
    const tags = new Set((html.match(/<([a-z][a-z0-9]*-[a-z0-9-]*)/gi) ?? []).map((tag) => tag.slice(1).toLowerCase()));
    return [...tags].filter((tag) => !customElements.get(tag));
}

/**
 * The Web Component counterpart of `CodePlayground`: edit real HTML and see it render. The HTML is set as `innerHTML`
 * into a container on this page, where the elements are already registered, so what works here works in a plain HTML
 * file.
 */
export function HtmlPlayground({ defaultCode, defaultShowCode }: { defaultCode: string; defaultShowCode?: boolean }) {
    const { theme } = useGlobalState();
    const [code, setCode] = useState(defaultCode);
    const [showCode, setShowCode] = useState(defaultShowCode || false);
    const [error, setError] = useState<string | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        pretty(defaultCode, { parser: 'html' }).then(setCode);
    }, [defaultCode]);

    // The preview trails the editor a little so half-typed tags do not flash errors.
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!previewRef.current) return;
            previewRef.current.innerHTML = code;
            const unknown = unknownElements(code);
            setError(
                unknown.length
                    ? `Unknown element ${unknown.map((tag) => `<${tag}>`).join(', ')}. Nothing has registered it.`
                    : null,
            );
        }, 250);
        return () => clearTimeout(timeout);
    }, [code]);

    return (
        <Card data-code-editor variant="outlined">
            <div data-preview ref={previewRef} />
            {error && <pre data-error>{error}</pre>}
            {showCode && (
                <div data-editor>
                    <Editor
                        code={code}
                        language="html"
                        onChange={setCode}
                        theme={isDarkTheme(theme) ? themes.vsDark : themes.vsLight}
                    />
                </div>
            )}
            <div data-code-options>
                <Button
                    label={showCode ? 'Hide code' : 'Edit code'}
                    onClick={() => setShowCode((previous) => !previous)}
                    size="x-small"
                    style={{ borderRadius: 'var(--usa-radius-pill)' }}
                    variant="secondary"
                />
                <Button
                    icon={<SvgContentCopy />}
                    iconOnly
                    label="Copy code"
                    onClick={() => {
                        navigator.clipboard.writeText(code);
                        sendSnackbar({ text: 'Code copied to clipboard', timeout: 3000 });
                    }}
                    size="small"
                    variant="tertiary"
                />
                <Button
                    icon={<SvgRefresh />}
                    iconOnly
                    label="Reset"
                    onClick={() => pretty(defaultCode, { parser: 'html' }).then(setCode)}
                    size="small"
                    variant="tertiary"
                />
            </div>
        </Card>
    );
}
