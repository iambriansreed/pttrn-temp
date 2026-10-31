import { ExamplePlaceholder } from '-/components/ExamplePlaceholder';
import { ComponentExample } from '-/utils/demo';

export const CardExample: ComponentExample = {
    render: ({ props, Component }) => (
        <Component {...props}>
            <ExamplePlaceholder
                style={{
                    height: '200px',
                    width: '100%',
                    minWidth: 'min(250px, 100%)',
                    backgroundColor: 'unset',
                }}
            />
        </Component>
    ),
};
