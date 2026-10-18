/**
 * This script cleans up temporary and build files generated during development.
 *
 * $ npx tsx .scripts/clean.ts
 */

/* eslint-disable no-console */
import fs from 'fs/promises';

const itemsToRemove = ['/.tmp', '/dist', '.scripts/symbols.json', 'component-files.json', 'types.json'];

// look for any empty directories in ./src and remove them
const removeEmptyDirs = async (dir: string) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    if (entries.length === 0) {
        // Directory is empty
        await fs.rmdir(dir);
        console.log(`✅ Removed empty directory: ${dir}`);
        return;
    }

    for (const entry of entries) {
        if (entry.isDirectory()) {
            await removeEmptyDirs(`${dir}/${entry.name}`);
        }
    }

    // Re-check if the directory is empty after removing subdirectories
    const updatedEntries = await fs.readdir(dir);
    if (updatedEntries.length === 0) {
        await fs.rmdir(dir);
        console.log(`Removed empty directory: ${dir}`);
    }
};

// Start by removing empty directories in ./src
removeEmptyDirs('./src').catch((error) => {
    console.error(`Error while removing empty directories: ${error.message}`);
});

(async () => {
    for (const item of itemsToRemove) {
        process.stdout.write(`🕑  ${item}...`);

        const isDirectory = item.startsWith('/');
        const path = isDirectory ? item.slice(1) : item;

        try {
            await fs.access(path); // Check if the item exists

            await fs.rm(path, { recursive: isDirectory, force: true });

            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            console.log(`✅ ${item}`);
        } catch (error) {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);

            if (error.code === 'ENOENT') {
                console.log(`⚠️  ${item} not found`);
            } else {
                console.log(`❌  Failed to remove ${item}: ${error.message}`);
            }
        }
    }
})();
