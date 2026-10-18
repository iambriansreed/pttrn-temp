import fs from 'fs/promises';
import { kebabCase } from '../utils';

/** Generates and writes a boilerplate component styles (sass) file for a component name and destination file path. */
export const generateAndWriteStylesFile = async (componentName: string, filePath: string) => {
    const styleFileContent = generateStylesFile(componentName);
    await fs.writeFile(filePath, styleFileContent);
};

export const generateStylesFile = (componentName: string) => {
    const slug = kebabCase(componentName);

    return `[data-pttrn='${slug}'] {
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: fit-content;
    }
    
    `;
};
