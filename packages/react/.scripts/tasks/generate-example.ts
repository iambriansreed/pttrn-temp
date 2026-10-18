/* eslint-disable no-console */
/**
 * Generates the example file for a component
 *
 * $ npx tsx .scripts/tasks/generate-example.ts
 *
 * UI: gen-ex - Generate the example file for a component
 */
import fs from 'fs';
import { generateAndWriteExampleFile } from '.scripts/lib/generateExampleFile';

function main() {
    const [nameArg] = process.argv.slice(2);

    const filePath = `src/components/${nameArg}/${nameArg}Example.tsx`;

    if (fs.existsSync(filePath)) {
        console.error(`Example file already exists at ${filePath}. Use "force" mode to overwrite.`);
        process.exit(1);
    }

    generateAndWriteExampleFile(nameArg, filePath);

    console.info(`\nExample file generated at ${filePath}`);
}

main();
