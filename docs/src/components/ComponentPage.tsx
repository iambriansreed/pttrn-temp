import { Button } from '@ptrn/react/Button/Button';
import { Flex } from '@ptrn/react/Flex/Flex';
import { Popover } from '@ptrn/react/Popover/Popover';
import { SwitchOption } from '@ptrn/react/SwitchOption';
import { Tag } from '@ptrn/react/Tag/Tag';
import { ComponentPageSection, componentToString } from '@ptrn/react/utils/demo';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { BlockExampleSection } from './BlockExampleSection';
import { ComponentPageExample } from 'components/ComponentPageExample';
import { ComponentProvider } from 'components/ComponentProvider';
import { ComponentVariants } from 'components/ComponentVariants';
import { Markup } from 'components/Markup';
import { Syntax } from 'components/Syntax';
import { TypeProps } from 'components/TypeProps';
import { WebComponentApi } from 'components/WebComponentApi';
import { CodeExample } from 'src/components/CodeExample';
import { CodePlayground } from 'src/components/CodePlayground';
import { FrameworkTabs } from 'src/components/FrameworkTabs';
import { HtmlPlayground } from 'src/components/HtmlPlayground';
import { Page } from 'src/components/Page';
import { SpecSection } from 'src/components/SpecSection';
import { TagComponent } from 'src/components/TagComponent';
import { components, MetaComponentName } from 'src/meta';
import { DemoComponent } from 'src/types';
import { GitHubIcon } from 'src/utils/githubIcon';
import { useGlobalState } from 'src/utils/globalState';
import { kebabCase } from 'src/utils/kebabCase';
import { useComponentDemo } from 'src/utils/useComponentDemo';
import { useFramework } from 'src/utils/useFramework';
import { webComponents } from 'src/wc';

export function ComponentPage({ componentName }: { componentName: MetaComponentName }) {
    const component = useComponentDemo(componentName);
    const { setShowTouchTarget, showTouchTarget } = useGlobalState();
    const [framework, setFramework] = useFramework();

    // The tab only changes the code and the preview. Everything React-specific below (blocks, design patterns, custom
    // sections, variants) is hidden on the Web Component tab.
    const webComponent = webComponents[componentName];
    const isWebComponent = framework === 'web-component' && !!webComponent;

    if (!component) return <h3>Component not available.</h3>;

    const Component = components[component.name as keyof typeof components];

    return (
        <Page data-component-page>
            <Flex align="center" gap="8" justify="space-between" style={{ width: '100%' }} wrap="wrap">
                <h2 title="Introduction">{component.name}</h2>
                <Flex align="center" gap="8">
                    <Button
                        as="a"
                        href={`https://github.com/pttrn/pttrn/blob/main/packages/react/src/components/${component.name}/${component.name}.tsx`}
                        iconOnly
                        label="View Source on GitHub"
                        rel="noopener noreferrer"
                        size="small"
                        target="_blank"
                        tooltip="View Source on GitHub"
                        variant="tertiary"
                    >
                        <GitHubIcon height={24} width={24} />
                    </Button>
                    {!!component.blockConfigs && (
                        <Popover
                            content="Blocks are reusable, higher-order design patterns built from multiple components that form
                            common product layouts and workflows. Blocks provide a structured starting point for
                            creating experiences across our product ecosystem."
                            header="Blocks"
                        >
                            {(props) => <Tag {...props} color="base" label="Block" variant="pill" />}
                        </Popover>
                    )}
                    {component.phase && <TagComponent component={{ phase: component.phase, name: component.phase }} />}
                </Flex>
            </Flex>
            <FrameworkTabs
                framework={isWebComponent ? 'web-component' : 'react'}
                hasWebComponent={!!webComponent}
                onChange={setFramework}
            />
            <ComponentProvider component={component}>
                <article>
                    <Markup>{component.description}</Markup>
                    {isWebComponent && webComponent && (
                        <>
                            <h3>Basic usage</h3>
                            {!!webComponent.usageDescription && <Markup>{webComponent.usageDescription}</Markup>}
                            <HtmlPlayground defaultCode={webComponent.usage} />
                            <WebComponentApi tag={webComponent.tag} />
                        </>
                    )}
                    {!isWebComponent && !component.hideUsage && component.usage && (
                        <>
                            <h3>Basic usage</h3>
                            {!!component.usage.description && <Markup>{component.usage.description}</Markup>}
                            <CodePlayground defaultCode={component.usage.code} />
                        </>
                    )}
                    {!isWebComponent && !!component.blockConfigs?.length && (
                        <>
                            <p>
                                These examples show common design patterns implemented two ways: directly with this
                                component and with a more flexible pattern. Both are intended to look identical, to
                                demonstrate how different approaches can produce the same UI. The patterns are a
                                starting point and can be adapted as needed.
                            </p>
                            {component.blockConfigs.map((p, index) => (
                                <BlockExampleSection
                                    //
                                    index={index}
                                    key={p.name}
                                    {...p}
                                />
                            ))}
                        </>
                    )}
                    {(isWebComponent ? [] : component.presets)
                        ?.filter((p) => !p.block && p.designPattern && !p.hidePlayground)
                        .map((preset, index) => (
                            <div
                                key={index}
                                style={{
                                    marginTop: 'var(--usa-spacing-3)',
                                }}
                            >
                                <h3 id={kebabCase(`Design-pattern-${preset.label}`)}>{preset.label}</h3>
                                {typeof preset.designPattern === 'string' && <p>{preset.designPattern}</p>}
                                <CodePlayground
                                    defaultCode={componentToString(component.name, preset.propState, component.props)}
                                />
                            </div>
                        ))}

                    {(isWebComponent ? [] : component.sections)
                        ?.filter((s) => s.location === 'beforeDemo')
                        .map(({ content: Content, title }, index) => (
                            <Section
                                Component={Component}
                                component={component}
                                content={Content}
                                key={index}
                                title={title}
                            />
                        ))}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 'var(--usa-spacing-3)',
                        }}
                    >
                        {component.showExample && (
                            <>
                                <h3>Demo</h3>
                                {component.hasTouchTarget && (
                                    <div data-touch-target-toggle style={{ marginBottom: '0.75em' }}>
                                        <SwitchOption
                                            checked={showTouchTarget}
                                            label="Show Touch Target"
                                            name="data-touch-target"
                                            onChange={(checked) => setShowTouchTarget(checked)}
                                            value="data-touch-target"
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <ComponentPageExample />
                    {!!component.references?.length && (
                        <>
                            <h3>References</h3>
                            {component.references.map((ref) => (
                                <Fragment key={ref.id}>
                                    <h4 id={kebabCase(`reference-${ref.name}`)}>{ref.name}</h4>
                                    <Markup>{ref.description}</Markup>
                                    <TypeProps props={ref.properties!} />
                                </Fragment>
                            ))}
                        </>
                    )}
                    {!isWebComponent && component.showExample && component.variants !== false && <ComponentVariants />}
                    {component.spec && <SpecSection name={component.name} spec={component.spec} />}
                    {(isWebComponent ? [] : component.sections)
                        ?.filter((s) => !s.location || s.location === 'afterDemo')
                        .map(({ content: Content, title }, index) => (
                            <Section
                                Component={Component}
                                component={component}
                                content={Content}
                                key={index}
                                title={title}
                            />
                        ))}
                    {[
                        {
                            id: 'dependencies',
                            title: 'Dependencies',
                            description: 'Dependencies are components that this component relies on.',
                            components: component.dependencies,
                        },
                        {
                            id: 'dependents',
                            title: 'Dependents',
                            description: 'Dependents are components that rely on this component.',
                            components: component.dependents,
                        },
                    ].map((section) => {
                        return (
                            !!section.components.length && (
                                <Fragment key={section.title}>
                                    <h3>{section.title}</h3>
                                    <p>{section.description}</p>
                                    <p
                                        style={{
                                            display: 'flex',
                                            gap: '8px',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        {section.components.map((d, index) => (
                                            <TagComponent component={d} key={index} />
                                        ))}
                                    </p>
                                </Fragment>
                            )
                        );
                    })}
                    <h3>Stylesheet</h3>
                    {component.css ? (
                        <p>
                            This is the CSS for the component. The css variables used within are available in the{' '}
                            <Link to={{ pathname: '/styles' }}>styles package</Link>.
                        </p>
                    ) : (
                        <p>This component does not have any specific styles.</p>
                    )}
                    {!!component.dependencies.length && (
                        <p>
                            This component may inherit styles from one of it&apos;s{' '}
                            <a href="#dependencies">dependencies</a>.
                        </p>
                    )}
                    {component.css && (
                        <Syntax
                            code={component.css}
                            language="scss"
                            style={{ maxHeight: '400px', overflowY: 'scroll' }}
                        />
                    )}
                </article>
            </ComponentProvider>
        </Page>
    );
}

// eslint-disable-next-line react/no-multi-comp
function Section({
    content,
    title,
    component,
    Component,
}: ComponentPageSection & { component: DemoComponent; Component?: React.ComponentType<any> }) {
    if (!content) return null;

    const Content = content;

    return (
        <div
            style={{
                marginTop: 'var(--usa-spacing-3)',
            }}
        >
            {title && <h3 id={kebabCase(`section-${title}`)}>{title}</h3>}
            <div>
                <Content
                    CodeExample={CodeExample}
                    CodePlayground={CodePlayground as any}
                    Component={Component}
                    Syntax={Syntax as any}
                    props={component.defaultState || {}}
                />
            </div>
        </div>
    );
}
