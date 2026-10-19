import fs from 'fs/promises';

/** Generates and writes the behavior specification scaffold for a component. */
export const generateAndWriteSpecFile = async (componentName: string, filePath: string) => {
    await fs.writeFile(filePath, generateSpecFile(componentName), 'utf-8');
};

export const generateSpecFile = (componentName: string) => {
    return `import { ComponentSpec } from '-/types/meta';

/**
 * What ${componentName} is made of, how the keyboard drives it, what it owes assistive technology, and the behaviors
 * every implementation must pass. Write this before the component: the tests register one case per behavior id, the
 * docs render it and the MCP serves it.
 */
export const spec: ComponentSpec = {
    name: '${componentName}',
    summary: 'One sentence: what it is and what it does.',
    anatomy: [{ part: 'root', description: 'Describe each named part and the role it plays.' }],
    keyboard: [],
    accessibility: {
        roles: 'How roles, states and relationships are exposed.',
        labels: 'What labels it needs and where they come from.',
        focus: 'Where focus lands and how it moves.',
    },
    behaviors: [
        { id: 'renders', description: 'Renders its content.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
`;
};
