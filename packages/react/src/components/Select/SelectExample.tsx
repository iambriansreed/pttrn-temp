/* eslint-disable react/no-multi-comp */
import { useState } from 'react';
import { Select, SelectProps } from '.';
import { Avatar } from '-/components/Avatar';
import { Field } from '-/components/Field';
import { Tag } from '-/components/Tag';
import { Txt } from '-/components/Txt';
import { ComponentExample, Preset } from '-/utils/demo';

const TrailingPrice = ({ price }: { price: number }) => (
    <Txt>{`${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(price / 100)}`}</Txt>
);
const DEFAULT_OPTIONS = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
    { value: '4', label: 'Option 4' },
    { value: '5', label: 'Option 5' },
    { value: '6', label: 'Option 6' },
    { value: '7', label: 'Option 7' },
    { value: '8', label: 'Option 8' },
    { value: '9', label: 'Option 9' },
    { value: '10', label: 'Option 10' },
];

export const presets: Preset<SelectProps>[] = [
    {
        label: 'Simple',
        propState: {
            options: DEFAULT_OPTIONS,
            name: 'demo-select',
            value: '',
            menuWidth: '',
        },
    },
    {
        label: 'SubText',
        propState: {
            options: [
                {
                    value: 'Claude 3.7 Sonnet',
                    label: 'Claude 3.7 Sonnet',
                    subText: 'bedrock • us.anthropic.claude-3-7-sonnet-20250219-v1:0',
                },
                {
                    value: 'Claude 4 Sonnet',
                    label: 'Claude 4 Sonnet',
                    subText: 'bedrock • us.anthropic.claude-sonnet-4-20250514-v1:0',
                },
                {
                    value: 'Claude 4.5 Sonnet',
                    label: 'Claude 4.5 Sonnet',
                    subText: 'bedrock • us.anthropic.claude-sonnet-4-5-20250929-v1:0',
                },
                {
                    value: 'GPT 4.1',
                    label: 'GPT 4.1',
                    subText: 'azure • gpt-41',
                },
            ],
            name: 'demo-select-long',
            value: '',
            menuWidth: '600px',
        },
    },
    {
        label: 'Long text',
        propState: {
            options: [
                { value: '1', label: 'This is a very long option that should truncate' },
                { value: '2', label: 'This is another long option that should truncate' },
                { value: '3', label: 'Short option' },
                { value: '4', label: 'Another short option' },
            ],
            name: 'demo-select-long',
            value: '',
            menuWidth: '',
        },
    },
    {
        label: 'Trailing Tags',
        propState: {
            options: [
                //
                {
                    value: 'a',
                    label: 'Package A',
                    trailing: <Tag color="info" label="Recommended" size="x-small" />,
                },
                {
                    value: 'b',
                    label: 'Package B',
                    trailing: <Tag color="success" label="Best Value" size="x-small" />,
                },
                { value: 'c', label: 'Package C' },
                { value: 'd', label: 'Package D' },
            ],
            name: 'demo-select-tags',
            value: 'a',
            menuWidth: '',
        },
    },
    {
        label: 'Trailing Text',
        propState: {
            options: [
                {
                    value: '1',
                    label: 'Option A',
                    trailing: <TrailingPrice price={400} />,
                },
                { value: '2', label: 'Option B', trailing: <TrailingPrice price={1000} /> },
                { value: '3', label: 'Option C', trailing: <TrailingPrice price={1600} /> },
                { value: '4', label: 'Option D', trailing: <TrailingPrice price={2000} /> },
            ],
            name: 'demo-select-trailing',
            value: '',
            menuWidth: '',
        },
    },
    {
        label: 'Leading Avatar',
        propState: {
            options: [
                //
                {
                    value: 'Jessica',
                    label: 'Jessica P.',
                    leading: <Avatar name="Jessica P." size="small" />,
                },
                {
                    value: 'Louis',
                    label: 'Louis L.',
                    leading: <Avatar name="Louis L." size="small" />,
                },
                {
                    value: 'Harvey',
                    label: 'Harvey S.',
                    leading: <Avatar name="Harvey S." size="small" />,
                },
                {
                    value: 'Mike',
                    label: 'Mike R.',
                    leading: <Avatar name="Mike R." size="small" />,
                },
            ],
            name: 'demo-select-avatar',
            value: '',
            menuWidth: '',
        },
    },
];

export const SelectExample: ComponentExample<SelectProps> = {
    defaultState: {
        options: DEFAULT_OPTIONS,
        scrollLimit: 5,
        value: '',
        'aria-label': 'select aria-label',
    },
    render: ({ props, Component, preset }) => <Component key={preset?.label} {...props} />,
    presets,
    containerStyle: { width: 320, padding: 0 },
};

export const Usage = () => {
    const OPTIONS = [
        { id: '1', label: 'Option 1', value: '1' },
        { id: '2', label: 'Option 2', value: '2' },
        { id: '3', label: 'Option 3', value: '3' },
        { id: '4', label: 'Option 4', value: '4' },
        { id: '5', label: 'Option 5', value: '5' },
        { id: '6', label: 'Option 6', value: '6' },
    ];

    const [selected, setSelected] = useState<string | undefined>(undefined);

    return (
        <div style={{ width: 320 }}>
            <Field
                controlId="example-select"
                helperText="The select allows you to choose one option from a list of options."
                label="Select an option"
            >
                <Select
                    id="example-select"
                    name="example-select"
                    onChange={setSelected}
                    options={OPTIONS}
                    placeholder="Select an option"
                    scrollLimit={5}
                    size="medium"
                    value={selected}
                />
            </Field>
        </div>
    );
};
