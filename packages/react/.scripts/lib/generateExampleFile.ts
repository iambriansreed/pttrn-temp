import fs from 'fs/promises';

/** Generates and writes a boilerplate component Example file for a component name and destination file path. */
export const generateAndWriteExampleFile = async (componentName: string, filePath: string) => {
    const exampleFileContent = generateExampleFile(componentName);
    await fs.writeFile(filePath, exampleFileContent);
};

export const generateExampleFile = (componentName: string) => {
    return `import { ${componentName}Props } from '.';
    import { ComponentExample, Preset } from '-/utils/demo';
    
    export const presets: Preset<${componentName}Props>[] = [];
    
    export const ${componentName}Example: ComponentExample<${componentName}Props> = {
    
        defaultState: {},
        disableProps: [],
        presets,
        render: ({ props, Component }) => <Component {...props} />,
        sections: [],
        variants: {},
    };
    `;
};
