import { SvgContentCopy } from '@ptrn/icons/ContentCopy';
import { SvgRefresh } from '@ptrn/icons/Refresh';
import { SvgIcon } from '@ptrn/icons/SvgIcon';
import { Button } from '@ptrn/react/Button/Button';
import { Card } from '@ptrn/react/Card';
import { ExamplePlaceholder } from '@ptrn/react/ExamplePlaceholder';
import { Input } from '@ptrn/react/Input';
import { sendSnackbar } from '@ptrn/react/Snackbar';
import { CodePlaygroundProps, DemoAction } from '@ptrn/react/utils/demo';
import { isDarkTheme } from '@ptrn/react/utils/uiContext';
import { themes } from 'prism-react-renderer';
import React, { Suspense, useContext, useEffect, useState } from 'react';
import { LiveProvider, LiveError, LivePreview, LiveEditor, LiveContext } from 'react-live';
import { components } from 'src/meta';
import { useGlobalState } from 'src/utils/globalState';
import { pretty } from 'src/utils/pretty';

const action: DemoAction = (message: string) => {
    sendSnackbar({
        text: message,
        timeout: 1000,
    });
};

/**
 * A code playground component that provides an editor and live preview for code snippets.
 *
 * 1. Initial previewCode and editorCode is set from externalCode
 * 2. OnChange editorCode updates immediately
 * 3. PreviewCode updated with debounced editorCode updates
 * 4. If no errors in preview, previewCode is saved to lastValidCodeRef
 * 5. If errors in preview, previewCode is set back to lastValidCodeRef
 * 6. When externalCode changes, editorCode and previewCode are updated immediately
 */
export function CodePlayground({ defaultCode, defaultShowCode }: CodePlaygroundProps) {
    const { theme } = useGlobalState();

    // this is the code shown in the editor, should be updated immediately when externalCode changes

    const [code, setCode] = useState<string>(defaultCode);

    useEffect(() => {
        pretty(defaultCode || '', { parser: 'typescript' }).then(setCode);
    }, [defaultCode]);

    const [showCode, setShowCode] = useState<boolean>(defaultShowCode || false);

    return (
        <Card data-code-editor variant="outlined">
            <Suspense fallback={<div>Loading Playground...</div>}>
                <LiveProvider
                    code={transformPreviewCode(code)}
                    enableTypeScript
                    scope={{
                        ...components,
                        ...React,
                        action,
                        sendSnackbar,
                        SvgIcon,
                        Input,
                        Slot: ExamplePlaceholder,
                    }}
                >
                    <LogErrors />
                    <LivePreview data-preview />
                    <LiveError data-error />
                </LiveProvider>
                {showCode && (
                    <div data-editor>
                        <LiveEditor
                            code={code}
                            language="typescript"
                            onChange={(newCode) => setCode(newCode)}
                            theme={isDarkTheme(theme) ? themes.vsDark : themes.vsLight}
                        />
                    </div>
                )}
                <div data-code-options>
                    <Button
                        label={showCode ? 'Hide code' : 'Edit code'}
                        onClick={() => setShowCode((p) => !p)}
                        size="x-small"
                        style={{ borderRadius: 'var(--usa-radius-pill)' }}
                        variant="secondary"
                    />
                    <Button
                        icon={<SvgContentCopy />}
                        iconOnly
                        label="Copy code"
                        onClick={() => {
                            navigator.clipboard.writeText(code || '');
                            sendSnackbar({ text: 'Code copied to clipboard', timeout: 3000 });
                        }}
                        size="small"
                        variant="tertiary"
                    />
                    <Button
                        icon={<SvgRefresh />}
                        iconOnly
                        label="Reset"
                        onClick={() => {
                            pretty(defaultCode || '', { parser: 'typescript' }).then(setCode);
                        }}
                        size="small"
                        variant="tertiary"
                    />
                    {/* 
                    todo: add back github link when we have a way to map code snippets to files
                    {githubLink && (
                        <Button
                            as="a"
                            href={githubLink}
                            icon={<GitHubIcon />}
                            iconOnly
                            label="View on GitHub"
                            size="small"
                            target="_blank"
                            variant="tertiary"
                        />
                    )} */}
                </div>
            </Suspense>
        </Card>
    );
}

function transformPreviewCode(code: string | undefined) {
    const next = code
        // Remove import statements
        ?.replace(/import [^;]+;?\n/g, '')
        // Replace individual SVG imports with SvgIcon usage
        .replace(/<Svg([^ ]+) \/>/g, '<SvgIcon name="$1" />')
        //replace comment lines
        .replace(/\n[\s]+\/\/.*/g, '')
        .trim();

    return next;
}

// eslint-disable-next-line react/no-multi-comp
function LogErrors() {
    const { error, code } = useContext(LiveContext);
    if (error) console.error('CodePlayground Error:', { error, code });
    return null;
}
