import fs from 'fs/promises';
import { kebabCase } from '../utils';

/** Generates and writes a boilerplate component file for a component name and destination file path. */
export const generateAndWriteComponentFile = async (componentName: string, filePath: string) => {
    const componentFileContent = generateComponentFile(componentName);
    await fs.writeFile(filePath, componentFileContent);
};

export const generateComponentFile = (componentName: string) => {
    const slug = kebabCase(componentName);

    return `import './${slug}.scss';

    export type ${componentName}Props = {
        /**
         * The content of the ${slug}.
         *
         * @required
         */
        children: string;
    };
    
    /**
     * Component description.
     *
     * @example
     *     import { ${componentName} } from '@ptrn/react/${componentName}';
     *
     *     <${componentName}>Example ${componentName}</${componentName}>
     *
     * @name ${componentName}
     * @phase Dev
     * 
     */
    export function ${componentName}({ children, variant = DEFAULT.variant }: ${componentName}Props) {
        return (
            <span data-pttrn="${slug}" data-variant={variant || undefined}>
                {children}
            </span>
        );
    }
    
    `;
};
