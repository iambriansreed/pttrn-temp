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
