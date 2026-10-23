/* eslint-disable no-console */
/**
 * $ npx tsx .scripts/tasks/lint-specs.ts
 *
 * Checks the component behavior specifications (`src/components/<Name>/spec.ts`) and the suites that depend on them:
 *
 * - A spec exports `spec` with the folder's name, unique kebab-case behavior ids and no empty text.
 * - A component with a spec has a React suite that registers its behaviors with `describeBehaviors`.
 * - A Web Component in `@ptrn/web` requires a spec for its React counterpart and a Playwright suite that registers the
 *   behaviors with `describeBehaviors`, so the two implementations are held to the same cases.
 * - Every Stable component has a spec. A component cannot reach Stable without its behavior contract.
 */
import fs from 'fs';
import path from 'path';

import { ComponentSpec } from 'src/types/meta';

import { getLocalMeta } from '.scripts/utils';

const componentsDir = path.resolve('./src/components');
const webComponentsDir = path.resolve('../web/src/components');
const webTestsDir = path.resolve('../web/tests');

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

function checkSpec(name: string, spec: ComponentSpec | undefined, errors: string[]) {
    const where = `${name}/spec.ts`;
    if (!spec) return errors.push(`❌ ${where} does not export \`spec\``);
    if (spec.name !== name) errors.push(`❌ ${where} is named "${spec.name}", not "${name}"`);
    if (!spec.summary?.trim()) errors.push(`❌ ${where} has no summary`);
    if (!spec.anatomy?.length) errors.push(`❌ ${where} lists no anatomy`);
    if (!spec.behaviors?.length) errors.push(`❌ ${where} lists no behaviors`);
    for (const key of ['roles', 'labels', 'focus'] as const) {
        if (!spec.accessibility?.[key]?.trim()) errors.push(`❌ ${where} accessibility.${key} is empty`);
    }
    const ids = new Set<string>();
    for (const behavior of spec.behaviors ?? []) {
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(behavior.id)) {
            errors.push(`❌ ${where} behavior id "${behavior.id}" is not kebab-case`);
        }
        if (ids.has(behavior.id)) errors.push(`❌ ${where} lists "${behavior.id}" twice`);
        ids.add(behavior.id);
        if (!behavior.description?.trim()) errors.push(`❌ ${where} behavior "${behavior.id}" has no description`);
    }
    for (const part of spec.anatomy ?? []) {
        if (!part.part?.trim() || !part.description?.trim())
            errors.push(`❌ ${where} has an anatomy entry without a part or description`);
    }
    for (const key of spec.keyboard ?? []) {
        if (!key.keys?.length || !key.description?.trim())
            errors.push(`❌ ${where} has a keyboard entry without keys or a description`);
    }
}

const usesBehaviors = (file: string) =>
    fs.existsSync(file) && fs.readFileSync(file, 'utf-8').includes('describeBehaviors(');

async function main() {
    const errors: string[] = [];
    const { componentsMeta } = await getLocalMeta(true);

    const withSpec: string[] = [];
    const stableWithout: string[] = [];

    for (const { name, phase, spec } of componentsMeta) {
        const dir = path.join(componentsDir, name);
        const hasSpecFile = fs.existsSync(path.join(dir, 'spec.ts'));
        if (!hasSpecFile) {
            if (phase === 'Stable') stableWithout.push(name);
            continue;
        }
        withSpec.push(name);
        checkSpec(name, spec, errors);

        const suite = path.join(dir, `${name}.rtl.test.tsx`);
        if (!usesBehaviors(suite)) {
            errors.push(`❌ ${name} has a spec but ${name}.rtl.test.tsx does not call describeBehaviors(spec, …)`);
        }
    }

    if (fs.existsSync(webComponentsDir)) {
        for (const dirent of fs.readdirSync(webComponentsDir, { withFileTypes: true })) {
            if (!dirent.isDirectory()) continue;
            const name = dirent.name;
            if (!fs.existsSync(path.join(componentsDir, name, 'spec.ts'))) {
                errors.push(`❌ @ptrn/web has ${name} but @ptrn/react has no ${name}/spec.ts; write the spec first`);
            }
            const suite = path.join(webTestsDir, `${kebab(name)}.spec.ts`);
            if (!usesBehaviors(suite)) {
                errors.push(
                    `❌ @ptrn/web has ${name} but tests/${kebab(name)}.spec.ts does not call describeBehaviors(spec, …)`,
                );
            }
        }
    }

    console.log(`${withSpec.length} components have a spec: ${withSpec.join(', ') || 'none'}`);
    stableWithout.forEach((name) =>
        errors.push(`❌ ${name} is Stable but has no spec.ts; write its spec and register the behaviors in its suite`),
    );

    if (errors.length) {
        errors.forEach((error) => console.error(error));
        process.exit(1);
    }
    console.log('✅ specs are consistent with their suites');
}

main();
