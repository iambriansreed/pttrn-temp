/**
 * Build Material Icons
 *
 * Npx tsx .scripts/build-material.ts
 */

import { execSync } from 'child_process';
import fs from 'fs';
import { NOWHERE_PATH, ICON_SIZE, MATERIAL_PATH } from './build-config';
export const MATERIAL_SOURCE_PATH = '../material-design-icons/symbols/web';

const MATERIAL_ICONS_LIST = 'assets/material-icons.txt';

function processMaterialList() {
    execSync(`rm -rf assets/material && mkdir -p assets/material`);

    // path checks
    [MATERIAL_SOURCE_PATH, MATERIAL_PATH, NOWHERE_PATH].forEach((path) => {
        if (!fs.existsSync(path)) {
            throw new Error(`path does not exist: ${path}`);
        }
    });

    const allExistingMaterialIcons = fs
        .readdirSync(MATERIAL_SOURCE_PATH, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name.toLowerCase());

    const allExistingNowhereIcons = fs
        .readdirSync(NOWHERE_PATH)
        .flatMap((file) => (file.endsWith('.svg') && file.replace('.svg', '')) || []);

    // validated material icons
    const patternMaterialIcons = fs
        .readFileSync(MATERIAL_ICONS_LIST, 'utf-8')
        .split('\n')
        // filter out non-exisiting icons && remove nowhere icon duplicates
        .flatMap((line) => {
            const [originalName, ...flags] = line.split(',').flatMap((item) => (item.trim() ? [item.trim()] : []));
            let iconName = originalName.trim().replace(/ /g, '_').toLowerCase();

            if (!allExistingMaterialIcons.includes(iconName)) iconName = iconName.replace(/_fill$/, '');

            if (!allExistingMaterialIcons.includes(iconName)) {
                console.error(`Icon "${iconName}" not found in material source`);
                return [];
            }

            if (allExistingNowhereIcons.includes(iconName)) {
                console.warn(`Icon "${iconName}" already exists in nowhere`);
                return [];
            }

            return { iconName, originalName, flags };
        })
        // remove duplicates
        .filter((icon, index, arr) => arr.findIndex((i) => i === icon) === index && icon);

    const FLAGS = { IGNORE_FILL: '-ignore-fill' };

    patternMaterialIcons.sort((a, b) => a.iconName.localeCompare(b.iconName));

    patternMaterialIcons.forEach(({ iconName, originalName, flags }) => {
        const iconPath =
            `${MATERIAL_SOURCE_PATH}/${iconName}/materialsymbolsrounded/` + `${iconName}_${ICON_SIZE}px.svg`;

        const iconPathFilled = flags.includes(FLAGS.IGNORE_FILL)
            ? ''
            : `${MATERIAL_SOURCE_PATH}/${iconName}/materialsymbolsrounded/` + `${iconName}_fill1_${ICON_SIZE}px.svg`;

        if (!fs.existsSync(iconPath)) throw new Error(`icon not found: ${iconName} / ${iconName}`);

        const code = fs.readFileSync(iconPath, 'utf-8');

        fs.writeFileSync(`${MATERIAL_PATH}/${iconName}.svg`, code);

        if (iconPathFilled && fs.existsSync(iconPathFilled)) {
            const codeFilled = fs.readFileSync(iconPathFilled, 'utf-8');
            fs.writeFileSync(`${MATERIAL_PATH}/${iconName}_fill.svg`, codeFilled);
        }
    });
}

processMaterialList();
