import { TabGroup } from '@ptrn/react/TabGroup';
import { DataProps } from '@ptrn/react/types/common';
import { PrettyParser } from '@ptrn/react/utils/demo';
import { CSSProperties, ReactNode, useRef, useState } from 'react';
import { AccessibilitySection } from 'components/AccessibilitySection';
import ComponentLogs from 'components/ComponentLogs';
import { ErrorBoundary } from 'components/ErrorBoundary';
import { Syntax } from 'src/components/Syntax';

export function CodeExample({
    children,
    containerStyle,
    accessibility,
    code,
    ...props
}: DataProps & {
    containerStyle?: CSSProperties;
    children: ReactNode;
    accessibility?: boolean;
    code?: {
        language?: PrettyParser | undefined;
        str: string;
    };
    style?: CSSProperties;
}) {
    const TABS = [{ label: 'Example', value: 'example' }];

    if (accessibility) TABS.push({ label: 'Accessibility', value: 'accessibility' });

    if (code) TABS.push({ label: 'Code', value: 'code' });

    const [demoTab, setDemoTab] = useState<(typeof TABS)[number]['value']>('example');

    const exampleRef = useRef<HTMLDivElement | null>(null);

    return (
        <div data-example-code {...props}>
            <TabGroup
                label="Example navigation"
                onChange={(nextDemoTab) => setDemoTab(nextDemoTab)}
                options={[...TABS].filter((tab) => tab.value !== 'accessibility' || exampleRef)}
                showTrail
                style={{ width: '100%' }}
                value={demoTab}
            />
            <section data-active-tab={demoTab === 'example' || undefined} data-example>
                <ErrorBoundary>
                    <div data-example-render ref={exampleRef} style={{ ...containerStyle, maxWidth: '100%' }}>
                        {children}
                    </div>
                </ErrorBoundary>
            </section>
            {exampleRef && (
                <section data-accessibility data-active-tab={demoTab === 'accessibility' || undefined}>
                    {demoTab === 'accessibility' && <AccessibilitySection context={exampleRef.current} />}
                </section>
            )}
            {code && (
                <section data-active-tab={demoTab === 'code' || undefined} data-code>
                    <Syntax code={code.str || ''} language={code.language} />
                </section>
            )}
            <ComponentLogs />
        </div>
    );
}
