import { Card } from '@ptrn/react/Card/Card';
import { Tag } from '@ptrn/react/Tag';
import { ComponentVariantOverrides } from '@ptrn/react/utils/demo';
import { useErrorLogger } from '@ptrn/react/utils/errors';
import { Markup } from 'components/Markup';
import { useComponentContext } from 'src/components/ComponentProvider';
import { ComponentRender } from 'src/components/ComponentRender';
import { components, TypeProperty } from 'src/meta';
import { kebabCase } from 'src/utils/kebabCase';

export function ComponentVariants() {
    const { component, propState } = useComponentContext();
    const { logError } = useErrorLogger();

    if (component.variants === false) return null;

    let variantOverrides: ComponentVariantOverrides = {};
    if (typeof component.variants === 'object') variantOverrides = component.variants;

    const variantProperties: TypeProperty[] =
        component.props?.filter(
            (prop) =>
                variantOverrides[prop.name] !== false &&
                (prop.type === 'boolean' || (prop.options && prop.options?.length > 1) || variantOverrides[prop.name]),
        ) || [];

    if (!variantProperties.length) return null;

    const Component = components[component.name as keyof typeof components];

    if (!Component) {
        logError(true, `Component "${component.name}" not found in components meta.`);
        return <p>Component not found.</p>;
    }

    return (
        <>
            <h2>Variants</h2>

            <p>These are possible variants of the component.</p>

            {variantProperties.map((prop) => {
                let options: unknown[] = prop.options || [true, false];

                const variantStateOverrides = variantOverrides[prop.name];
                if (
                    typeof variantStateOverrides === 'object' &&
                    'propOptions' in variantStateOverrides &&
                    Array.isArray(variantStateOverrides.propOptions)
                )
                    options = variantStateOverrides.propOptions;

                return (
                    <section data-variants key={prop.name}>
                        <h3 id={kebabCase(`Variant-${prop.name}`)}>{prop.name}</h3>
                        <Markup data-description>{prop.description}</Markup>

                        <Card variant="outlined">
                            {options?.map((option) => {
                                const overrideState = { ...component.defaultState, ...propState, [prop.name]: option };

                                const secondaryOverrides: Record<string, unknown>[] = [];

                                if (variantStateOverrides) {
                                    const overrides = variantStateOverrides;

                                    Object.entries(overrides).map(([key, value]) => {
                                        if (
                                            value &&
                                            typeof value === 'object' &&
                                            'options' in value &&
                                            Array.isArray(value.options)
                                        ) {
                                            secondaryOverrides.push(
                                                ...value.options.map((optionValue) => ({
                                                    [key]: optionValue,
                                                })),
                                            );
                                        } else {
                                            overrideState[key] = value;
                                        }
                                    });
                                }

                                return (
                                    <div data-option-container key={`${prop.name}-${option}`}>
                                        <Tag color="base" label={String(option)} />
                                        <div data-option-render>
                                            {(secondaryOverrides.length ? secondaryOverrides : [{}]).map(
                                                (secondaryOverride, index) => (
                                                    <ComponentRender
                                                        key={`${prop.name}-${option}-${index}`}
                                                        overrideState={{ ...overrideState, ...secondaryOverride }}
                                                        variant={{
                                                            value: option,
                                                            name: prop.name,
                                                        }}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </Card>
                    </section>
                );
            })}
        </>
    );
}
