import { Flex } from '@ptrn/react/Flex';
import { Select } from '@ptrn/react/Select/Select';
import { Tag } from '@ptrn/react/Tag/Tag';
import { Tooltip } from '@ptrn/react/Tooltip/Tooltip';
import { useId } from '@ptrn/react/hooks/useId';
import { useEffect, useState } from 'react';
import { CodeExample } from 'components/CodeExample';
import { useComponentContext } from 'components/ComponentProvider';
import { ErrorLogContext } from 'components/ErrorLogContext';
import { TypeProps } from 'components/TypeProps';
import { ComponentRender } from 'src/components/ComponentRender';
import { components } from 'src/meta';
import { useGlobalState } from 'src/utils/globalState';
import { pretty } from 'src/utils/pretty';
import { useFramework } from 'src/utils/useFramework';
import { webComponents } from 'src/wc';

export function ComponentPageExample() {
    const { propState, setPreset, preset, component, setPropState } = useComponentContext();

    const { showTouchTarget } = useGlobalState();

    const errorId = useId();

    // On the Web Component tab the example gets a Code tab with the HTML for the current prop state.
    const [framework] = useFramework();
    const webComponent = webComponents[component.name as keyof typeof webComponents];
    const [html, setHtml] = useState('');
    useEffect(() => {
        if (framework !== 'web-component' || !webComponent) return;
        pretty(webComponent.toHtml(propState), { parser: 'html' }).then(setHtml);
    }, [framework, webComponent, propState]);

    if (!components[component.name as keyof typeof components]) {
        console.warn(`Component "${component.name}" not found in components meta.`);
        return <h2>Component not available.</h2>;
    }

    const props = component.props.map((p) => ({
        ...p,
        disabled:
            component.disableProps === true ||
            (Array.isArray(component.disableProps) && component.disableProps.includes(p.name)),
    }));

    return (
        <>
            {component.showExample && (
                <ErrorLogContext id={errorId}>
                    <CodeExample
                        accessibility
                        code={
                            framework === 'web-component' && webComponent ? { language: 'html', str: html } : undefined
                        }
                        containerStyle={component.containerStyle}
                        data-main-example
                        data-show-touch-targets={showTouchTarget || undefined}
                    >
                        <ComponentRender />
                    </CodeExample>
                </ErrorLogContext>
            )}
            {component.props?.length > 0 && (
                <>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: 'var(--usa-spacing-3)',
                        }}
                    >
                        <h2 title="Props">{component.name}Props</h2>
                        {component.showExample && (
                            <Flex>
                                {!!component.presets?.length && (
                                    <div>
                                        <Select
                                            aria-label="Preset"
                                            menuWidth="max-content"
                                            name="preset-select"
                                            onChange={(value) => setPreset(value as string)}
                                            options={
                                                component.presets
                                                    .filter((p) => !p.hideDemoOption)
                                                    .map((p) => ({
                                                        label: p.label,
                                                        value: p.value,
                                                        id: p.value,
                                                        trailing: p.designPattern ? (
                                                            <Tooltip
                                                                label={
                                                                    typeof p.designPattern === 'string'
                                                                        ? p.designPattern
                                                                        : ''
                                                                }
                                                            >
                                                                {(triggerProps) => (
                                                                    <Tag
                                                                        {...triggerProps}
                                                                        color="info"
                                                                        label="Design Pattern"
                                                                        size="x-small"
                                                                    />
                                                                )}
                                                            </Tooltip>
                                                        ) : null,
                                                    })) || []
                                            }
                                            placeholder="Select Preset"
                                            size="small"
                                            value={preset?.value}
                                        />
                                    </div>
                                )}
                            </Flex>
                        )}
                    </div>
                    <TypeProps
                        onChange={component.disableProps !== true && component.showExample ? setPropState : undefined}
                        props={props}
                        state={component.showExample ? propState : undefined}
                    />
                </>
            )}
        </>
    );
}
