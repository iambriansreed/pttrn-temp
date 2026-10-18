import { Table } from '@ptrn/react/Table';
import { Tag } from '@ptrn/react/Tag';
import { Txt } from '@ptrn/react/Txt';
import { TypePropertyDemo, TypePropertyDemoWithControls } from '@ptrn/react/utils/demo';
import { useMemo } from 'react';
import { Markup } from 'components/Markup';
import { TypePropControl } from 'components/TypePropControl';
import { PROPERTY_NAME_CUSTOM_SORT } from 'src/config';

const hasPropTypeControl = (prop: TypePropertyDemo) => {
    const type = prop.exampleType || prop.type;

    return Boolean(
        type === 'icon' ||
        type === 'multiline' ||
        type === 'string' ||
        type === 'string,boolean' ||
        type === 'number' ||
        type === 'boolean' ||
        (Array.isArray(type) && type.join() === 'string,boolean') ||
        prop.options,
    );
};

const propsWithControls = (prop: TypePropertyDemo) => {
    const nextProp: TypePropertyDemoWithControls = {
        ...prop,
        typeOptions: [],
        haveControl: hasPropTypeControl(prop),
        multiline: prop.type === 'multiline',
        libraryDefault: prop.default,
    };
    if (nextProp.type === 'multiline') nextProp.type = 'string';
    if (nextProp.type === 'string,boolean') nextProp.type = ['string', 'boolean'];

    nextProp.typeOptions = nextProp.type ? [nextProp.type].flat() : nextProp.options;

    return nextProp;
};

export function TypeProps({
    props,
    state,
    onChange,
}: {
    props: TypePropertyDemo[];
    state?: Record<string, any>;
    onChange?: (nextState: Record<string, any>) => void;
}) {
    const propsWithControl = useMemo(() => props.map(propsWithControls), [props]);

    // Sort props by
    // 1. whether they are editable (have a control)
    // 2. whether they are required
    // 3. alphabetically
    propsWithControl.sort((a, b) => {
        if (!a.haveControl !== !b.haveControl) return !a.haveControl > !b.haveControl ? 1 : -1;

        if (!a.required !== !b.required) return !a.required > !b.required ? 1 : -1;

        if (!a.disabled !== !b.disabled) return !a.disabled < !b.disabled ? 1 : -1;

        // ensure value props are always first
        if (a.name === 'value') return -1;
        if (b.name === 'value') return 1;

        const propertyNameSort = PROPERTY_NAME_CUSTOM_SORT.find((arr) => arr.includes(a.name) && arr.includes(b.name));

        if (propertyNameSort) {
            const aIndex = propertyNameSort.indexOf(a.name);
            const bIndex = propertyNameSort.indexOf(b.name);
            return aIndex - bIndex;
        }

        return a.name.localeCompare(b.name);
    });

    return (
        <Table
            columns={[
                {
                    key: 'name',
                    label: 'Name',
                    width: 'auto',
                    valign: 'top',
                    formatter: (row) => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--usa-spacing-1)' }}>
                            {row.name}
                        </div>
                    ),
                },
                {
                    key: 'description-type',
                    label: 'Description / Type',
                    width: '1fr',
                    valign: 'top',
                    formatter: (row) => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--usa-spacing-1)' }}>
                            {row['description-type']}
                        </div>
                    ),
                },
                {
                    key: 'default',
                    label: 'Default',
                    width: 'auto',
                    valign: 'top',
                },
                !!onChange && {
                    key: 'controls',
                    label: 'Controls',
                    width: '200px',
                    valign: 'top',
                },
            ]}
            data={propsWithControl.map((prop) => {
                return {
                    id: prop.name,
                    name: (
                        <>
                            <Txt as="div" variant="labels-small">
                                {prop.name}
                            </Txt>
                            {prop.required && <Tag color="error" label="required" size="x-small" />}
                        </>
                    ),
                    'description-type': (
                        <>
                            <Markup data-description>{prop.description}</Markup>
                            <div data-type-options>
                                {prop.typeOptions?.map((o) => (
                                    <Tag
                                        color="info"
                                        key={`${o}1`}
                                        label={o.toString()}
                                        size="x-small"
                                        variant="flat"
                                    />
                                ))}
                            </div>
                            {'minimum' in prop && (
                                <Txt
                                    as="div"
                                    style={{
                                        fontStyle: 'italic',
                                        color: 'var(--theme-color-base-dark)',
                                    }}
                                    variant="labels-small"
                                >{`Minimum: ${prop.minimum}`}</Txt>
                            )}
                            {'maximum' in prop && (
                                <Txt
                                    as="div"
                                    style={{
                                        fontStyle: 'italic',
                                        color: 'var(--theme-color-base-dark)',
                                    }}
                                    variant="labels-small"
                                >{`Maximum: ${prop.maximum}`}</Txt>
                            )}
                        </>
                    ),
                    default:
                        typeof prop.libraryDefault === 'undefined' ? (
                            <Tag color="warning" label="None" size="x-small" variant="flat" />
                        ) : (
                            <Tag
                                color="success"
                                label={prop.libraryDefault != null ? prop.libraryDefault.toString() : ''}
                                size="x-small"
                                variant="flat"
                            />
                        ),
                    controls: onChange && (
                        <div style={{ width: '180px' }}>
                            <TypePropControl
                                onChange={(nextValue) => onChange({ [prop.name]: nextValue })}
                                prop={prop}
                                value={state?.[prop.name]}
                            />
                        </div>
                    ),
                };
            })}
            data-props
            data-type-props
            pageSize={99}
        />
    );
}
