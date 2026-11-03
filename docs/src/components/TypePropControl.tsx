import { CheckboxGroup, CheckboxGroupOption } from '@ptrn/react/CheckboxGroup';
import { Input } from '@ptrn/react/Input';
import { InputNumber } from '@ptrn/react/InputNumber';
import { ListItemProps } from '@ptrn/react/ListItem';
import { RadioGroup, RadioGroupOption } from '@ptrn/react/RadioGroup';
import { SearchBar } from '@ptrn/react/SearchBar/SearchBar';
import { Select } from '@ptrn/react/Select';
import { Switch } from '@ptrn/react/Switch';
import { Textarea } from '@ptrn/react/Textarea';
import { useId } from '@ptrn/react/hooks/useId';
import { TypePropertyDemoWithControls } from '@ptrn/react/utils/demo';
import { useState } from 'react';
import { ICONS } from 'src/utils/icons';

export function TypePropControl({
    prop,
    value,
    onChange,
    readOnly = false,
}: {
    value: any;
    onChange: (nextValue: any) => void;
    prop: TypePropertyDemoWithControls;
    readOnly?: boolean;
}) {
    const baseId = useId();

    if (!prop) return null;

    // id props should not be in state as we need to generate a random id when the component is rendered
    if (prop.type === 'string' && (prop.name === 'id' || prop.name.endsWith('Id'))) return null;

    const type = prop.exampleType || prop.type;

    const controlProps = {
        label: prop.name,
        'aria-label': prop.name,
        name: prop.name,
        value,
        onChange,
        readOnly,
    };

    if (prop.multiline) return <Textarea id="" {...controlProps} size="small" />;

    if (type === 'number')
        return (
            <InputNumber
                data-testid={`${prop.name}-Input`}
                disabled={prop.disabled}
                id=""
                max={prop.maximum}
                min={prop.minimum}
                size="small"
                {...controlProps}
            />
        );

    if (Array.isArray(type) && type.sort().join() === 'boolean,string') {
        return (
            <label data-testid={`${prop.name}-Switch`}>
                <Switch checked={!!controlProps.value} {...controlProps} />
                {!!controlProps.value && (
                    <Input
                        {...controlProps}
                        data-testid={`${prop.name}-Input`}
                        disabled={prop.disabled}
                        readOnly={readOnly}
                        size="small"
                        style={{ marginTop: '10px' }}
                        value={typeof controlProps.value === 'string' ? controlProps.value : ''}
                    />
                )}
            </label>
        );
    }

    if (type === 'string')
        return (
            <Input
                {...controlProps}
                data-testid={`${prop.name}-Input`}
                disabled={prop.disabled}
                id={`${baseId}-Input-${prop.name}`}
                readOnly={readOnly}
                size="small"
                type="text"
            />
        );

    const controlOptions: string[] = prop.options?.map((o) => o.toString()) || [];

    const options: (CheckboxGroupOption & ListItemProps & RadioGroupOption)[] =
        controlOptions?.map((option) => ({
            id: option,
            label: option,
            value: option,
            name: option,
        })) || [];

    // if (!prop.required && !prop.default)
    //     options.unshift({ id: undefined as unknown as string, label: 'None', value: '', name: 'None' });

    if (type === 'PttrnIcon') return <PttrnIconSelect onChange={onChange} value={controlProps.value} />;

    if (type === 'checkboxes') {
        return (
            <CheckboxGroup
                {...controlProps}
                data-testid={`${prop.name}-CheckboxGroup`}
                disabled={prop.disabled}
                options={options}
                value={controlProps.value}
            />
        );
    }

    if (controlOptions.length > 0) {
        if (controlOptions.length > 3 || type === 'select')
            return (
                <Select
                    data-testid={`${prop.name}-Select`}
                    disabled={prop.disabled}
                    id={`${baseId}-Select-${prop.name}`}
                    options={options}
                    size="small"
                    {...controlProps}
                    onChange={onChange}
                    readOnly={readOnly}
                    value={controlProps.value}
                />
            );

        return <RadioGroup data-testid={`${prop.name}-RadioGroup`} options={options} {...controlProps} />;
    }

    if (type === 'boolean')
        return (
            <label data-testid={`${prop.name}-Switch`} htmlFor={`${prop.name}-Switch`}>
                <Switch
                    checked={!!controlProps.value}
                    id={`${prop.name}-Switch`}
                    {...controlProps}
                    disabled={readOnly || prop.disabled}
                />
            </label>
        );

    return null;
}

// eslint-disable-next-line react/no-multi-comp
function PttrnIconSelect({ onChange, value }: { onChange: (next: string) => void; value?: string }) {
    const [searchValue, setSearchValue] = useState<string | undefined>(value);
    // Option ids are DOM ids: a page with two icon props (leading and trailing) would repeat them without a prefix.
    const idPrefix = useId();

    return (
        <SearchBar
            aria-label="icon search"
            items={ICONS.filter((icon) => {
                return !searchValue || icon.name.toLowerCase().includes(searchValue.toLowerCase());
            })
                .filter((_, index) => index < 10)
                .map((icon) => ({
                    id: `${idPrefix}-${icon.name}`,
                    value: icon.name,
                    label: icon.name,
                }))}
            name="icon"
            onChange={(next, item) => {
                if (item) onChange(item.label);
                setSearchValue(next);
            }}
            placeholder=""
            size="small"
            value={searchValue}
        />
    );
}
