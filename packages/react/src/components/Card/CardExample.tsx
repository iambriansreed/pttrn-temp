import { ExamplePlaceholder } from '-/components/ExamplePlaceholder';
import { ComponentExample } from '-/utils/demo';

export const CardExample: ComponentExample = {
    render: ({ props, Component }) => (
        <Component {...props}>
            <ExamplePlaceholder
                style={{
                    height: '200px',
                    // A definite width: a percentage min-width inside a card that sizes to its content cannot
                    // resolve, and browsers disagree on what it becomes (Chromium versions gave 50px and 250px).
                    width: '250px',
                    maxWidth: '100%',
                    backgroundColor: 'unset',
                }}
            />
        </Component>
    ),
};
