import { Flex, FlexProps } from './Flex';
import { ComponentExample, Preset } from '-/utils/demo';

export const presets: Preset<FlexProps>[] = [];

export const FlexExample: ComponentExample<FlexProps> = {
    render: ({ props, Component }) => {
        return (
            <Component {...props}>
                <div>Alpha</div>
                <div>Beta</div>
                <div>Gamma</div>
            </Component>
        );
    },
    presets,
    // The demo wraps, so the large gap and padding variants still fit a phone; the wrap variant shows both settings.
    defaultState: { wrap: 'wrap' },
};

export const Usage = () => {
    return (
        <Flex gap="24" justify="center" style={{ width: '100%' }}>
            <div>Alpha</div>
            <div>Beta</div>
            <div>Gamma</div>
        </Flex>
    );
};
