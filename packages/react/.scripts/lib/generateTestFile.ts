import fs from 'fs/promises';

/** Generates and writes a boilerplate test for a component name and destination file path. */
export const generateAndWriteTestFile = async (componentName: string, filePath: string) => {
    const testFileContent = generateTestFile(componentName);
    await fs.writeFile(filePath, testFileContent, 'utf-8');
};

export const generateTestFile = (componentName: string) => {
    return `import { ${componentName} } from './${componentName}';
import { presets } from './${componentName}Example';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

// One test per behavior in spec.ts. A behavior without a test fails, and so does a test the spec does not list.
describeBehaviors(spec, {
    renders: () => {
        render(<${componentName} {...presets[0].propState} />);

        expect(screen.getByText('whoop there it is')).toBeInTheDocument();
    },
    'axe-clean': async () => {
        for (const preset of presets) {
            await hasNoBasicA11yIssues(<${componentName} {...preset.propState} />)();
        }
    },
});

`;
};
