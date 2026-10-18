import fs from 'fs/promises';

/** Generates and writes a boilerplate test for a component name and destination file path. */
export const generateAndWriteTestFile = async (componentName: string, filePath: string) => {
    const testFileContent = generateTestFile(componentName);
    await fs.writeFile(filePath, testFileContent, 'utf-8');
};

export const generateTestFile = (componentName: string) => {
    return `import { ${componentName} } from './${componentName}';
import { presets } from './${componentName}Example';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { render } from '-/rtl/util';

describe('${componentName} (RTL)', () => {
    presets.forEach((preset) => {
        it(\`has no basic a11y issues - \${preset.label}\`, hasNoBasicA11yIssues(<${componentName} {...preset.propState} />));
    });

    it('renders', () => {
        const { getByText } = render(<${componentName} {...presets[0].propState} />);

        expect(getByText('whoop there it is')).toBeInTheDocument();
    });
});

`;
};
