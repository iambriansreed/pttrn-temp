/* eslint-disable no-console */
/**
 * $ npm run meta
 *
 * This script generates the meta file which contains the information about the component, hooks, and utilities. This
 * file scrapes from the JSdoc and also the Typescript types.
 *
 * The output file should not be included in this repo. ⚡️
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import * as TJS from 'typescript-json-schema';

import {
    ComponentMeta,
    TypeProperty,
    UtilityMeta,
    TypeMeta,
    ComponentPhase,
    BlockConfig,
    ComponentSpec,
} from './src/types/meta';

const COMPONENT_PHASE_ORDER: ComponentPhase[] = [
    'Utility', // Utility components are not tracked in the progress
    'Backlog', // components that are not actively being worked on
    'Dev', // components that are actively being developed
    'UXReview', // components that are in UX Review
    'Stable', // production ready
];

const RESET = '\x1b[0m';
const BLUE = '\x1b[34m';
const GREEN = '\x1b[32m';
const ORANGE = '\x1b[38;5;208m';

function getArgValue(name: string, defaultValue: string = ''): string {
    const arg = process.argv.find((arg2) => arg2.startsWith(`${name}=`));
    return arg ? arg.substring(name.length + 1) : defaultValue;
}

const outDirectory = getArgValue('out');
const uiHash = getArgValue('hash');
const build = getArgValue('build', '0');
const target = getArgValue('target');
const mode = getArgValue('mode', 'production');

if (!outDirectory) {
    console.error('Please provide a path to the meta file.');
    process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { componentsDir, srcDir, hooksDir, rootPath } = {
    srcDir: path.resolve(__dirname, 'src'),
    hooksDir: path.resolve(__dirname, 'src', 'hooks'),
    componentsDir: path.resolve(__dirname, 'src', 'components'),
    rootPath: path.resolve(__dirname),
} as const;

function jsDocParse(content: string) {
    try {
        const contentTrimmed = content
            .trim()
            .replace(/^\/\*\*/, '')
            .replace(/\*\/$/, '');

        const chunks: string[] = contentTrimmed.replace(/\n\s*\* @/g, '&&split&&%%variable%%').split('&&split&&');

        const data: Record<string, string> = {};

        chunks.forEach((chunk) => {
            if (chunk.startsWith('%%variable%%')) {
                const chunkMatch = [...(chunk.match(/^%%variable%%([^\s]+)\s(.*)/s) || [])];

                if (!chunkMatch) throw new Error(`Unable to process chunk.`);

                const [, key, value] = chunkMatch;

                if (!value) return;

                data[key] = value
                    .replace(/\n[ ]+\*([ ]*)/g, '\n')
                    .replace(/^\s+\*\s+/, '')
                    .trim()
                    .replace(/;$/, '');

                return;
            }

            data.description = chunk
                .replace(/\n[ ]+\*([ ]*)/g, '\n')
                .replace(/(\S)\n(\S)/g, (_, a, b) => `${a} ${b}`)
                .trim();
        });

        return data;
    } catch (error) {
        console.error(error);
        return {};
    }
}

async function pretty(filePath: string) {
    execSync(`npx prettier --write "${filePath}"`, { stdio: 'inherit' });
}

function kebabCase(str: string): string {
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

const ENUM_SIZE_ORDER = [
    'x-small',
    'small',
    'medium',
    'base',
    'large',
    'x-large',
    'xx-large',
    'xxx-large',
    'xxxx-large',
    'xxxxx-large',
];

const componentFiles = fs.readdirSync(componentsDir, { withFileTypes: true, encoding: 'utf-8' }).flatMap((dirent) => {
    if (!dirent.isDirectory()) return [];

    const filePath = path.resolve(dirent.parentPath, dirent.name, `${dirent.name}.tsx`);
    if (!fs.existsSync(filePath)) return [];

    const content = fs.readFileSync(filePath, 'utf-8');
    return {
        filePath,
        name: dirent.name,
        content,
        dir: path.resolve(dirent.parentPath, dirent.name),
        example: '',
        // eslint-disable-next-line no-useless-escape
        jsDocs: content.match(/\/\*\*\s*\n([^\*]|(\*(?!\/)))*\*\//g)?.map((jsDoc) => {
            const doc = jsDocParse(jsDoc);
            return {
                id: kebabCase(doc.description),
                ...doc,
            } as Record<string, string>;
        }),
    };
});

type ComponentFile = (typeof componentFiles)[0];

/** The component's behavior specification, when it has a `spec.ts`. */
async function loadSpec(dir: string, name: string): Promise<ComponentSpec | undefined> {
    const specPath = path.join(dir, 'spec.ts');
    if (!fs.existsSync(specPath)) return undefined;
    const module = (await import(specPath)) as { spec?: ComponentSpec };
    if (!module.spec || module.spec.name !== name) {
        throw new Error(`${name}/spec.ts must export \`spec\` with name "${name}"`);
    }
    return module.spec;
}

function generateComponentMeta({
    filePath: componentFile,
    content,
    name,
    jsDocs,
    dir,
}: ComponentFile): ComponentMeta | null {
    const componentFunctionMatch = content.match(new RegExp(`function ${name}[(<]`));

    if (!componentFunctionMatch) {
        return null;
    }

    const componentDoc = [...(jsDocs || [])].find((doc) => doc.name === name);

    if (!componentDoc) {
        // console.warn(`No JSDoc found for component ${name} for ${componentFile}`);
        return null;
    }

    const slug = kebabCase(componentDoc.name);

    const dependenciesMatches = [...content.matchAll(/import { ([^}]+) } from '-\/components\/([a-zA-Z]+)';/g)];

    const dependencies = dependenciesMatches
        //
        ?.flatMap((d) => d.slice(1).flatMap((x) => x.split(', ')))
        .filter((d, i, arr) => arr.indexOf(d) === i);

    if (!dependencies?.length) {
        //console.info(`No dependencies OR CSS found for component ${name} for ${componentFile}`);
    }

    const cssPath = path.join(dir, `${slug}.scss`);

    const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, { encoding: 'utf-8' }) : '';

    const usage = componentDoc.example
        ? {
              code: componentDoc.example,
              description: componentDoc.exampleDescription,
          }
        : undefined;

    const blockFilePath =
        //
        path.join(srcDir, 'components', name, `${name}BlockConfigs.tsx`);

    let blockConfigs: BlockConfig[] | undefined;
    if (fs.existsSync(blockFilePath)) {
        blockConfigs = generateBlocksMeta(blockFilePath);
    }

    return {
        description: componentDoc.description,
        file: componentFile.split(srcDir)[1],
        name,
        slug,
        dependencies,
        usage,
        css,
        hasTouchTarget: css.includes('data-touch-target'),
        phase: (COMPONENT_PHASE_ORDER.includes(componentDoc.phase as ComponentPhase)
            ? componentDoc.phase
            : 'Backlog') as ComponentPhase,
        generated: 'generated' in componentDoc,
        blockConfigs,
    } as ComponentMeta;
}

async function generateUtilityMeta(utilityFile: string): Promise<UtilityMeta | null> {
    const content = fs.readFileSync(utilityFile, 'utf-8');

    const fileName = path.basename(utilityFile).replace(/\.[^.]+$/, '');

    const utility = fileName;

    const comment = content.match(/\/\*\*\s*\n([^*]|(\*(?!\/)))*\*\//g)?.map(jsDocParse);

    if (!comment?.[0]) {
        // console.info(`No JSDoc found for hook ${utility} for ${hooksDir}/${utility}.tsx`);
        return null;
    }

    const utilityDoc = comment.find((doc) => doc.example);

    if (!utilityDoc?.example) {
        // console.info(`No example found for hook ${utility} for ${hooksDir}/${utility}.tsx`, comment[0]);
        return null;
    }

    return {
        description: utilityDoc.description,
        example: utilityDoc.example,
        file: utilityFile.split(srcDir)[1],
        name: utility,
    };
}

function generateTypes() {
    const files = fs.readdirSync(srcDir, { recursive: true, withFileTypes: true }).flatMap((f) => {
        if (!f.isFile()) return [];

        if (!f.name.endsWith('.tsx') && !f.name.endsWith('.ts')) return [];

        // The test helpers in rtl/ use Jest globals, which this program does not know.
        if (f.parentPath.split(path.sep).includes('rtl')) return [];

        const filePath = path.resolve(f.parentPath, f.name);

        const content = fs.readFileSync(filePath, 'utf-8');

        // we want to ignore some problematic utility components
        return content.includes('export type') || content.includes('export interface')
            ? [`${f.parentPath}/${f.name}`]
            : [];
    });

    const program = TJS.getProgramFromFiles(
        files,
        {
            module: 'ES2020',
            target: 'ES2020',
            lib: ['es5', 'dom'],
            sourceMap: true,
            jsx: 'react-jsx',
            moduleResolution: 'node',
            noImplicitReturns: true,
            noImplicitThis: true,
            noImplicitAny: true,
            strictNullChecks: true,
            esModuleInterop: true,
            baseUrl: '.',
            rootDir: './src',
            outDir: './dist',
            paths: {
                '-/components/*': ['src/components/*'],
                '-/hooks/*': ['src/hooks/*'],
                '-/styles/*': ['src/styles/*'],
                '-/utils/*': ['src/utils/*'],
                '-/types/*': ['src/types/*'],
                '-/constants/*': ['src/constants/*'],
            },
        },
        rootPath,
    );

    const generator = TJS.buildGenerator(program, {
        required: true,
        defaultProps: true,
        noExtraProps: false,
    })!;

    const { definitions } = generator.getSchemaForSymbols(generator.getMainFileSymbols(program), true);

    fs.writeFileSync(path.resolve(__dirname, 'types.json'), JSON.stringify(definitions, null, 2));

    const nextTypes: TypeMeta[] = [];

    const cleanUpDefinitionEnums = (def: TJS.Definition): number[] | string[] | undefined => {
        // IF all enums are numerical, fix numerical sorting
        if (def.enum?.every((e) => typeof e === 'number')) {
            def.enum.sort((a, b) => a - b);
            return def.enum;
        }

        const defEnum = def.enum?.flatMap((e) => (typeof e === 'string' ? e : e?.toString() || []));
        if (!defEnum || !defEnum.length) return undefined;

        if (defEnum.some((e) => ENUM_SIZE_ORDER.includes(e)))
            defEnum.sort((a, b) => ENUM_SIZE_ORDER.indexOf(a) - ENUM_SIZE_ORDER.indexOf(b));

        return defEnum;
    };

    const defineProperty = (
        name: string,
        definition: TJS.Definition,
        required: string[],
        context: {
            componentFile: ComponentFile | null;
            parent: string;
        },
    ): TypeProperty | undefined => {
        // the auto-generated types aren't always correct, so we need to fix them
        const jsDoc = definition.description
            ? context.componentFile?.jsDocs?.find(({ id }) => id === kebabCase(definition.description!))
            : undefined;

        const type = definition.type?.toString();

        const arrayType = type?.match(/Array<(.+)>/)?.[1];

        const next: TypeProperty = {
            name,
            required: required?.includes(name),
            description: jsDoc?.description || definition.description,
            default: definition.default === 'undefined' ? undefined : definition.default,
            type,
            exampleType: jsDoc?.exampleType,
            minimum: definition.minimum,
            maximum: definition.maximum,
            options: jsDoc?.options?.split(',').map((o) => o.trim()),
            example: jsDoc?.example,
            arrayType,
        };

        if (next.name.match(/^on[A-Z]/)) next.type = 'function';

        const defEnum = cleanUpDefinitionEnums(definition);

        if (defEnum) {
            next.type = defEnum?.map((e) => e?.toString());
            next.options = defEnum;
        }

        if (definition.$ref) {
            next.type = definition.$ref.split('/').pop() as string;

            if (definitions && definitions[next.type] && typeof definitions[next.type] !== 'boolean') {
                next.options = cleanUpDefinitionEnums(definitions[next.type] as TJS.Definition) || next.options;
            }
        }

        return next;
    };

    if (definitions)
        Object.entries(definitions).forEach(([definitionName, definition]) => {
            if (typeof definition !== 'object') return;

            let componentFile: ComponentFile | null = null;
            // only care about ComponentProps
            if (definitionName.endsWith('Props')) {
                componentFile = componentFiles.find((f) => f.name === definitionName.replace(/Props$/, '')) || null;
            }

            const context = { componentFile, parent: definitionName };

            if (!definition?.properties && !definition?.allOf) return;

            if (['React', 'Omit<'].some((n) => definitionName.startsWith(n))) return;

            let properties: TypeProperty[] = [];

            if (definition.allOf) {
                properties = definition.allOf.flatMap((ofDefinition) => {
                    if (typeof ofDefinition !== 'object') return [];

                    if (ofDefinition.properties) {
                        return Object.entries(ofDefinition.properties).flatMap(([refName, refDefinition]) =>
                            typeof refDefinition !== 'object'
                                ? []
                                : defineProperty(refName, refDefinition, ofDefinition.required || [], context) || [],
                        );
                    }

                    if (!ofDefinition['$ref']) return [];

                    const reference = ofDefinition['$ref'].substring(14);

                    const defReference = definitions[reference];

                    if (typeof defReference === 'boolean') return [];

                    return Object.entries(defReference.properties || {}).flatMap(([refName, refDefinition]) => {
                        return typeof refDefinition !== 'object'
                            ? []
                            : defineProperty(refName, refDefinition, defReference.required || [], context) || [];
                    });
                });
            }

            if (definition.properties) {
                const props = definition.properties as Record<string, TJS.Definition>;
                const hasDescription = Object.values(props).some((p) => p.description);
                if (!hasDescription) {
                    // probably a type that is only used as a reference
                    // console.error(`${definitionName} has no description`);
                    return;
                }
                properties = Object.entries(props).flatMap(
                    ([propName, prop]) => defineProperty(propName, prop, definition.required || [], context) || [],
                );
            }

            nextTypes.push({
                file: componentFile?.filePath.split(srcDir)[1] || '',
                name: definitionName,
                properties,
                id: kebabCase(definitionName),
                description: definition.description,
                components: componentFile?.name ? [componentFile.name] : [],
            });
        });

    // we don't reference types that have names less than 3 characters long
    const nextTypeNames = nextTypes.flatMap((t) => (t.name.length > 3 ? t.name : []));

    nextTypes.forEach((nextType) => {
        const references = nextType.properties
            ?.flatMap((prop) =>
                nextTypeNames.filter((name) => prop.description?.includes(name) || prop.type?.includes(name)),
            )
            ?.filter((name, index, arr) => arr.indexOf(name) === index);

        if (!references || references.length === 0) return;

        nextType.references = references;

        if (!nextType.components || nextType.components.length === 0) return;

        nextTypes
            .filter((t) => references.includes(t.name))
            .forEach((t) => {
                t.components = t.components || [];
                t.components.push(...nextType.components!);
            });
    });

    const duplicateIds = nextTypes.flatMap((t) => t.id).filter((id, index, arr) => arr.indexOf(id) !== index);

    if (duplicateIds.length > 0) {
        console.error(`Duplicate IDs found: ${duplicateIds.join(', ')}`);
        console.error('Please fix the IDs in the components.');
        process.exit(1);
    }

    return nextTypes;
}

let componentsMeta: ComponentMeta[] = [];
async function createMeta() {
    componentsMeta = componentFiles
        .flatMap((component) => generateComponentMeta(component) || [])
        // filter out dependencies that aren't components
        .map((m, _, arr): ComponentMeta => {
            return {
                ...m,
                dependencies: m.dependencies?.filter((d) => arr.find((c) => c.name === d)),
            };
        });

    for (const component of componentsMeta) {
        const file = componentFiles.find((f) => f.name === component.name);
        if (file) component.spec = await loadSpec(file.dir, component.name);
    }

    componentsMeta.sort((a, b) => a.name.localeCompare(b.name));

    const hookFiles = fs.readdirSync(hooksDir).flatMap((f) => {
        if (!f.endsWith('.tsx') && !f.endsWith('.ts')) return [];

        const filePath = path.resolve(hooksDir, f);

        return filePath;
    });

    const metaComponentNames: string[] = componentsMeta.map((m) => m.name);

    const utilitiesMeta: UtilityMeta[] = [];
    for (const hookFile of hookFiles) {
        const elementMeta = await generateUtilityMeta(hookFile);
        if (elementMeta) utilitiesMeta.push(elementMeta);
    }
    utilitiesMeta.sort((a, b) => a.name.localeCompare(b.name));

    const typesMeta = generateTypes();
    typesMeta.sort((a, b) => a.name.localeCompare(b.name));

    const componentImport = (name: string) =>
        `${name}: React.lazy(() => import('@ptrn/react/${name}').then((module) => ({ default: module.${name} })))`;

    const uiVersion = (
        JSON.parse(fs.readFileSync(path.resolve(rootPath, 'package.json'), 'utf-8')) as { version: string }
    ).version;

    console.info(`${ORANGE}${mode} meta build.${RESET}`);

    const metaJsonPath = path.join(outDirectory, 'data.json');

    fs.writeFileSync(
        metaJsonPath,
        JSON.stringify(
            {
                VERSION: uiVersion,
                UI_HASH: uiHash,
                BUILD: build,
                MODE: mode,
                componentsMeta,
                utilitiesMeta,
                typesMeta,
            },
            null,
            2,
        ),
    );

    const metaFilePath = path.join(outDirectory, 'index.ts');

    fs.writeFileSync(
        metaFilePath,
        [
            target === 'local'
                ? `import meta from './data.json';`
                : `import React from 'react';\nimport meta from 'src/meta/data.json';\n\n`,
            `export const componentsMeta = meta.componentsMeta as ComponentMeta[];
export const utilitiesMeta = meta.utilitiesMeta as UtilityMeta[];
export const typesMeta = meta.typesMeta as TypeMeta[];
export const MODE = meta.MODE as 'development' | 'production' | 'test';
export const UI_HASH = meta.UI_HASH as string;
export const VERSION = meta.VERSION as string;
export const BUILD = meta.BUILD as string;`,

            fs.readFileSync(path.resolve(__dirname, './src/types/meta.ts'), { encoding: 'utf-8' }),

            `export type MetaComponentName = '${metaComponentNames.join("' | '")}';`,

            target === 'local'
                ? ''
                : `export const components: Partial<Record<MetaComponentName, React.LazyExoticComponent<any>>> = {${metaComponentNames.map(componentImport).join(',')}\n};`,
        ].join('\n\n'),
    );

    pretty(metaFilePath);

    console.info('Create meta complete.');

    return {
        componentsMeta,
        utilitiesMeta,
        typesMeta,
    };
}

function createExamples() {
    if (target === 'local') return;

    const examplesFilePath = path.join(outDirectory, 'examples.ts');

    const componentsWithExamples = componentFiles.filter(({ name }) =>
        fs.existsSync(path.resolve(__dirname, `src/components/${name}/${name}Example.tsx`)),
    );

    fs.writeFileSync(
        examplesFilePath,
        `${componentsWithExamples
            .map(({ name }) => `import { ${name}Example as ${name} } from '@ptrn/react/${name}/${name}Example';`)
            .join('\n')}
import { ComponentExample, ComponentExampleFn } from '@ptrn/react/utils/demo';
import { MetaComponentName } from 'src/meta';

export const examples: Partial<Record<MetaComponentName, ComponentExample<any> | ComponentExampleFn<any>>> = {
${componentsWithExamples.map(({ name }) => `    ${name},`).join('\n')}
}`,
    );

    pretty(examplesFilePath);
}

async function main() {
    console.log(`${BLUE}Building pttrn UI meta...${RESET}`);

    await createMeta();

    createExamples();

    console.log(`${GREEN}pttrn UI meta build completed successfully${RESET}`);
    process.exit(0);
}

function generateBlocksMeta(blockFilePath: string) {
    const blockFileContent = fs.readFileSync(path.resolve(blockFilePath), 'utf-8');

    const exampleContent = blockFileContent.matchAll(/<BlockExample\s([\s\S]*?)<\/BlockExample>/g);

    const blocks: BlockConfig[] = [...exampleContent].map((match) => {
        const blockString = match[1];

        const nameMatch = blockString.match(/name=["|'](.*?)["|']/);
        const name = nameMatch ? nameMatch[1] : 'Unnamed Block';

        const componentMatch = blockString.match(
            /<BlockExample\.Component>\s*([\s\S]*?)\s*<\/BlockExample\.Component>/,
        );
        const component = componentMatch ? componentMatch[1].trim() : '';

        const patternMatch = blockString.match(/<BlockExample\.Pattern>\s*([\s\S]*?)\s*<\/BlockExample\.Pattern>/);
        const pattern = patternMatch ? patternMatch[1].trim() : '';

        return {
            name,
            component,
            pattern,
        };
    });

    return blocks;
}
main();
