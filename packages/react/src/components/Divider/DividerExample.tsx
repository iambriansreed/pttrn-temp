import { CSSProperties } from 'react';

import { DividerProps } from './Divider';
import { ExamplePlaceholder } from '-/components/ExamplePlaceholder';
import { ComponentExample, Preset } from '-/utils/demo';

export const presets: Preset<DividerProps>[] = [
    {
        label: 'Divider - Horizontal',
        propState: {
            orientation: 'horizontal',
        },
    },
    {
        label: 'Divider - Vertical',
        propState: {
            orientation: 'vertical',
        },
    },
];

export const DividerExample: ComponentExample<DividerProps> = {
    render: ({ props, Component }) => {
        const style: CSSProperties =
            props.orientation === 'vertical' ? { height: 300, width: 100 } : { height: 100, width: 300 };
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: props.orientation === 'vertical' ? 'row' : 'column',
                    alignItems: props.orientation === 'vertical' ? 'center' : 'stretch',
                    justifyContent: props.orientation === 'vertical' ? 'center' : 'stretch',
                    // Horizontal: up to 300px wide, and narrower on a phone.
                    width: props.orientation !== 'vertical' ? '100%' : 'auto',
                    maxWidth: props.orientation !== 'vertical' ? 300 : 'auto',
                }}
            >
                <ExamplePlaceholder
                    style={{ ...style, flexDirection: props.orientation !== 'vertical' ? 'row' : 'column' }}
                />
                <Component {...props} />
                <ExamplePlaceholder
                    style={{ ...style, flexDirection: props.orientation !== 'vertical' ? 'row' : 'column' }}
                />
            </div>
        );
    },
};
