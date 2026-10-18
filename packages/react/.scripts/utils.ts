/* eslint-disable no-console */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ComponentMeta, TypeMeta } from 'src/types/meta';

globalThis.__dirname = globalThis.__dirname || path.dirname(fileURLToPath(import.meta.url));

export async function getLocalMeta(force = false): Promise<{
    componentsMeta: ComponentMeta[];
    typesMeta: TypeMeta[];
}> {
    const tempDir = path.resolve(process.cwd(), '.tmp');

    if (force || !fs.existsSync(`${tempDir}/index.ts`)) {
        execSync(`mkdir -p ${tempDir}`, { stdio: 'inherit' });
        execSync(`npm run meta out=${tempDir} target=local`, { stdio: 'inherit' });
    }

    return import(`${tempDir}/index.ts`).then((module) => ({
        ...module,
    }));
}

export async function pretty(filePath: string) {
    execSync(`npx prettier --write "${filePath}"`, { stdio: 'inherit' });
}

export async function prettyLint(filePath: string) {
    execSync(`npx prettier --write "${filePath}"`, { stdio: 'inherit' });
    execSync(`npx eslint --fix "${filePath}"`, { stdio: 'inherit' });
}

export function kebabCase(str: string): string {
    return (
        str
            .normalize('NFD') // Normalize to decompose accents
            .replace(/[\u0300-\u036f&()']/g, '') // Remove accents
            // Handle camelCase by inserting hyphens between lowercase and uppercase
            .replace(/([a-zA-Z])([A-Z][a-z])/g, '$1-$2')
            // do it again for the next uppercase letter
            .replace(/([a-zA-Z])([A-Z][a-z])/g, '$1-$2')
            .replace(/[^a-zA-Z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
            .replace(/^-+|-+$/g, '') // Trim leading or trailing hyphens
            .replace(/--+/g, '-') // Replace multiple hyphens with a single hyphen
            .toLowerCase()
    ); // Convert to lowercase
}

export function capitalizeFirstLetter(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export function titleCase(toTransform: string) {
    return toTransform.replace(/\b([a-z])/g, function (_, initial) {
        return initial.toUpperCase();
    });
}

export function camelCase(str: string, lowerFirst = false) {
    return kebabCase(str)
        .replace(/-([\w])/g, (_, char) => char.toUpperCase())
        .replace(/^([a-zA-Z])/, (_, char) => (lowerFirst ? char.toLowerCase() : char.toUpperCase()));
}

export const { componentsDir, srcDir, hooksDir, rootPath } = {
    srcDir: path.resolve(__dirname, 'src'),
    hooksDir: path.resolve(__dirname, 'src', 'hooks'),
    componentsDir: path.resolve(__dirname, 'src', 'components'),
    rootPath: path.resolve(__dirname),
} as const;

export function reportMissingVariables(variables: Record<string, string>) {
    // ensure all sass files in src do not reference variables not in @ptrn/styles

    const srcFiles = fs
        .readdirSync(path.resolve(__dirname, '../src'), { withFileTypes: true, recursive: true })
        .filter((file) => file.isFile() && file.name.endsWith('.scss'))
        .map((file) => {
            const filePath = path.resolve(file.parentPath, file.name);
            return {
                content: fs.readFileSync(filePath, 'utf-8'),
                filePath,
            };
        });

    const variableBeingSetRegex = /--[^:)]+:/g;
    const variablesBeingUsedRegex = /var\(--[^)\s]+\)/g;

    const baseContent = fs.readFileSync(path.resolve(__dirname, '../src/styles/base.scss'), 'utf-8');
    const colorsContent = fs.readFileSync(path.resolve(__dirname, '../src/styles/_color-variants.scss'), 'utf-8');

    const variableBeingSetMatchesBase = [
        ...(baseContent.match(variableBeingSetRegex)?.map((match) => match.replace(':', '')) || []),
        ...(colorsContent.match(variableBeingSetRegex)?.map((match) => match.replace(':', '')) || []),
    ];

    const missingVariables = srcFiles.flatMap(({ content, filePath }) => {
        const variablesBeingUsedMatches = content
            .match(variablesBeingUsedRegex)
            ?.map((match) => match.replace(/var\((--[^)]+)\)/, '$1'));
        if (!variablesBeingUsedMatches) return [];

        const variableBeingSetMatches = content.match(variableBeingSetRegex)?.map((match) => match.replace(':', ''));

        const missing = variablesBeingUsedMatches.filter((variable) => {
            // check if variable is
            // NOT in @ptrn/styles
            // NOT being set in the current file
            // AND NOT being set in base.scss
            // AND NOT built by Sass interpolation, which only resolves at compile time
            return (
                !variable.includes('#{') &&
                !variables[variable] &&
                !variableBeingSetMatches?.includes(variable) &&
                !variableBeingSetMatchesBase?.includes(variable)
            );
        });

        if (missing.length) {
            console.error(`\nMissing variables in ${filePath}\n: ${[...new Set([...missing])].join(', ')}`);
        }
        return missing;
    });

    if (missingVariables.length) {
        console.error(`Missing variables in src: ${missingVariables.join(', ')}`);
        process.exit(1);
    }

    console.log('No undefined CSS variables found :)');
}

export function getStylesRoot() {
    return path.dirname(import.meta.resolve('@ptrn/styles/package.json').split('file:')[1]);
}

export function getCssVariables() {
    // every theme file defines the same variables, so the tokens plus one theme cover them all
    const css = ['tokens.css', 'themes/default.css']
        .map((file) => fs.readFileSync(path.resolve(getStylesRoot(), file), 'utf8'))
        .join('\n');
    const variableMatches = css.matchAll(/(--[^:]+):\s*([^\n;]+)/g);
    return Object.fromEntries([...variableMatches].map((match) => [match[1], match[2]]));
}
