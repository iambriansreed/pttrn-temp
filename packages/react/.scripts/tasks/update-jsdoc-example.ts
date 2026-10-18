/**
 * Update examples in each component file removing the function Example wrapper
 *
 * $ npx tsx .scripts/tasks/update-jsdoc-example.ts
 */

import fs from 'fs';
import path from 'path';
import { ComponentMeta, TypeMeta } from 'src/types/meta';

(async () => {
    //  execSync(`cd ../../docs && npm run meta`, { stdio: 'inherit' });

    const { componentsMeta } = JSON.parse(fs.readFileSync(path.resolve('../../docs/src/meta/data.json'), 'utf-8')) as {
        componentsMeta: ComponentMeta[];
        typesMeta: TypeMeta[];
    };

    componentsMeta.forEach((component) => {
        // ensure component.example contains only props available in the component
        // ensure all props are documented in the example

        const filePath = path.join('src', component.file);

        const fileContent = fs.readFileSync(filePath, 'utf-8');

        fs.writeFileSync(filePath, fileContent.replace('console.log', 'sendSnackbar'));
    });
})();
