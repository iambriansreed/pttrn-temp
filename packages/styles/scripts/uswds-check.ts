/* eslint-disable no-console */
/**
 * Checks the USWDS primitives in `tokens/` against the token sources of a USWDS Core release (`@uswds/uswds`), so a
 * drift between the Figma Design Kit the tokens come from and the USWDS code is caught: a color whose hex changed, a
 * spacing step or type-scale size that moved, or a token the kit has that USWDS Core does not.
 *
 * Npx tsx scripts/uswds-check.ts [--uswds <version>] [--package <extracted @uswds/uswds dir>] [--write]
 *
 * By default the release recorded in `tokens/uswds.json` is downloaded with `npm pack` into a temporary directory;
 * `--package` points at an already extracted copy instead. The kit is the source of truth, so a shared token whose
 * values differ is not an error in itself: `tokens/uswds.json` records the known differences, and the command exits 1
 * only when the comparison no longer matches that record (new drift, or a difference that went away). `--write`
 * refreshes the record after the differences have been reviewed.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ColorValue, DimensionValue, Manifest, round } from './dtcg.js';

const args = process.argv.slice(2);
const option = (name: string, fallback: string) => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : fallback;
};
const packageRoot = path.resolve(import.meta.dirname, '..');
const tokensDir = path.join(packageRoot, 'tokens');
const recordFile = path.join(tokensDir, 'uswds.json');

type Difference = { kit: string; core: string };
type CheckRecord = {
    core: string;
    checkedAt?: string;
    shared?: number;
    differences?: { [css: string]: Difference };
    kitOnly?: string[];
};
const record: CheckRecord = fs.existsSync(recordFile)
    ? JSON.parse(fs.readFileSync(recordFile, 'utf8'))
    : { core: '3.14.0', differences: {} };
const version = option('--uswds', record.core);

// --- USWDS sources -------------------------------------------------------------------------------------------------

/** A Sass map literal as nested plain objects; values stay as source text. */
type SassMap = { [key: string]: SassMap | string };

/** Parses `$name: ( key: value, "key": ( ... ), );` declarations out of a token source file. */
function parseSassMaps(scss: string): { [name: string]: SassMap } {
    const text = scss.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const maps: { [name: string]: SassMap } = {};
    for (const match of text.matchAll(/\$([a-z0-9-]+)\s*:\s*\(/g)) {
        let depth = 0;
        let i = match.index! + match[0].length - 1;
        for (; i < text.length; i++) {
            if (text[i] === '(') depth++;
            else if (text[i] === ')' && --depth === 0) break;
        }
        maps[match[1]] = parseMap(text.slice(match.index! + match[0].length, i));
    }
    return maps;
}

function parseMap(body: string): SassMap {
    const map: SassMap = {};
    let depth = 0;
    let start = 0;
    const entries: string[] = [];
    for (let i = 0; i < body.length; i++) {
        const char = body[i];
        if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (char === ',' && depth === 0) {
            entries.push(body.slice(start, i));
            start = i + 1;
        }
    }
    entries.push(body.slice(start));
    for (const entry of entries) {
        const colon = entry.indexOf(':');
        if (colon < 0) continue;
        const key = entry.slice(0, colon).trim().replace(/^"|"$/g, '');
        const value = entry.slice(colon + 1).trim();
        if (!key) continue;
        map[key] = value.startsWith('(') ? parseMap(value.slice(1, value.lastIndexOf(')'))) : value;
    }
    return map;
}

const hex2 = (n: number) => n.toString(16).padStart(2, '0');

/** A USWDS color literal (`#rrggbb`, `#rgb`, `rgba(r, g, b, a)`, `white`, `black`, `transparent`) as pttrn writes it. */
function cssColor(text: string): string | null {
    const named: { [name: string]: string } = { white: '#ffffff', black: '#000000' };
    const hex = (named[text] ?? text).match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
        const digits = hex[1].length === 3 ? [...hex[1]].map((d) => d + d).join('') : hex[1];
        return `#${digits.toLowerCase()}`;
    }
    const rgba = text.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/);
    if (rgba) {
        const [r, g, b] = [rgba[1], rgba[2], rgba[3]].map(Number);
        const alpha = rgba[4] === undefined ? 1 : Number(rgba[4]);
        return `#${hex2(r)}${hex2(g)}${hex2(b)}${alpha === 1 ? '' : ` / ${round(alpha, 4)}`}`;
    }
    if (text === 'transparent') return 'transparent';
    return null;
}

/** `usa.color.<family>.<grade>[v]` → value, from every `$system-color-*` map plus the global colors. */
function uswdsColors(dir: string) {
    const colors = new Map<string, string>();
    const colorDir = path.join(dir, 'packages/uswds-core/src/styles/tokens/color');
    for (const file of fs.readdirSync(colorDir)) {
        if (!file.startsWith('_') || file === '_index.scss') continue;
        const maps = parseSassMaps(fs.readFileSync(path.join(colorDir, file), 'utf8'));
        for (const [name, map] of Object.entries(maps)) {
            if (name === 'tokens-color-global') {
                for (const [key, value] of Object.entries(map)) {
                    const color = typeof value === 'string' ? cssColor(value) : null;
                    if (color) colors.set(`usa.color.${key}`, color);
                }
                continue;
            }
            if (!name.startsWith('system-color-')) continue;
            for (const [family, grades] of Object.entries(map)) {
                if (typeof grades === 'string') continue;
                const add = (grade: string, value: SassMap | string, suffix: string) => {
                    const color = typeof value === 'string' ? cssColor(value) : null;
                    if (color) colors.set(`usa.color.${family}.${grade}${suffix}`, color);
                };
                for (const [grade, value] of Object.entries(grades)) {
                    if (grade === 'vivid' && typeof value !== 'string') {
                        for (const [vividGrade, vividValue] of Object.entries(value)) add(vividGrade, vividValue, 'v');
                    } else {
                        add(grade, value, '');
                    }
                }
            }
        }
    }
    return colors;
}

/** `usa.spacing.<unit>` → px, from `$system-spacing` (`spacing-multiple(n)` is n × 8px). Negatives are skipped. */
function uswdsSpacing(dir: string) {
    const spacing = new Map<string, string>();
    const file = path.join(dir, 'packages/uswds-core/src/styles/tokens/units/spacing.scss');
    const { 'system-spacing': map } = parseSassMaps(fs.readFileSync(file, 'utf8'));
    for (const group of Object.values(map ?? {})) {
        if (typeof group === 'string') continue;
        for (const [unit, value] of Object.entries(group)) {
            if (typeof value !== 'string' || unit.includes('neg-prefix')) continue;
            const multiple = value.match(/^spacing-multiple\((-?[\d.]+)\)$/);
            const px = multiple ? `${round(Number(multiple[1]) * 8)}px` : value.match(/^-?[\d.]+px$/) ? value : null;
            if (px) spacing.set(`usa.spacing.${unit}`, px);
        }
    }
    return spacing;
}

/** `usa.font-size.<step>` → px, from `$system-type-scale`. */
function uswdsTypeScale(dir: string) {
    const sizes = new Map<string, string>();
    const file = path.join(dir, 'packages/uswds-core/src/styles/tokens/font/type-scale.scss');
    const { 'system-type-scale': map } = parseSassMaps(fs.readFileSync(file, 'utf8'));
    for (const [step, value] of Object.entries(map ?? {})) {
        if (typeof value === 'string' && /^[\d.]+px$/.test(value)) sizes.set(`usa.font-size.${step}`, value);
    }
    return sizes;
}

// --- pttrn tokens ----------------------------------------------------------------------------------------------------

type Token = { $type?: string; $value: unknown; $extensions: { pttrn: { css: string; figma: string } } };
type Group = { [key: string]: Group | Token };

/** Every literal `usa.*` primitive in the default-mode token files, keyed by its path below the collection. */
function pttrnPrimitives() {
    const manifest: Manifest = JSON.parse(fs.readFileSync(path.join(tokensDir, 'manifest.json'), 'utf8'));
    const primitives = new Map<string, { value: string; css: string }>();
    const walk = (node: Group, trail: string[]) => {
        for (const [key, value] of Object.entries(node)) {
            if (key.startsWith('$')) continue;
            if (value && typeof value === 'object' && '$value' in value) {
                const token = value as Token;
                const tokenPath = [...trail, key].join('.');
                if (!tokenPath.startsWith('usa.') || typeof token.$value === 'string') continue;
                const text = literal(token);
                if (text && !primitives.has(tokenPath))
                    primitives.set(tokenPath, { value: text, css: token.$extensions.pttrn.css });
            } else {
                walk(value as Group, [...trail, key]);
            }
        }
    };
    for (const collection of manifest.collections) {
        const file = collection.file ?? collection.files![collection.defaultMode ?? Object.keys(collection.files!)[0]];
        const document: Group = JSON.parse(fs.readFileSync(path.join(tokensDir, file), 'utf8'));
        const group = document[collection.slug];
        if (group && !('$value' in group)) walk(group as Group, []);
    }
    return primitives;
}

function literal(token: Token): string | null {
    if (token.$type === 'color') {
        const { hex, alpha } = token.$value as ColorValue;
        return `${hex}${alpha === 1 ? '' : ` / ${round(alpha, 4)}`}`;
    }
    if (token.$type === 'dimension') {
        const { value, unit } = token.$value as DimensionValue;
        return `${round(value)}${unit}`;
    }
    return null;
}

// --- compare ---------------------------------------------------------------------------------------------------------

function main() {
    let dir = option('--package', '');
    let temp: string | null = null;
    if (!dir) {
        temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pttrn-uswds-'));
        console.log(`Downloading @uswds/uswds@${version}`);
        execFileSync('npm', ['pack', `@uswds/uswds@${version}`, '--silent', '--pack-destination', temp], {
            stdio: 'pipe',
        });
        const tarball = fs.readdirSync(temp).find((file) => file.endsWith('.tgz'))!;
        execFileSync('tar', ['-xzf', path.join(temp, tarball), '-C', temp, 'package/packages/uswds-core/src/styles'], {
            stdio: 'pipe',
        });
        dir = path.join(temp, 'package');
    }

    try {
        const uswds = new Map([...uswdsColors(dir), ...uswdsSpacing(dir), ...uswdsTypeScale(dir)]);
        const kit = pttrnPrimitives();

        const differences: { [css: string]: Difference } = {};
        const kitOnly: string[] = [];
        let shared = 0;
        for (const [tokenPath, { value, css }] of kit) {
            const expected = uswds.get(tokenPath);
            if (expected === undefined) kitOnly.push(tokenPath);
            else if (expected !== value) differences[css] = { kit: value, core: expected };
            else shared++;
        }
        const uswdsOnly = [...uswds.keys()].filter((tokenPath) => !kit.has(tokenPath)).length;
        const differing = Object.keys(differences);

        console.log(`USWDS Core ${version}: ${uswds.size} primitives; the kit: ${kit.size}.`);
        console.log(`  ${shared} shared tokens agree.`);
        console.log(
            `  ${kitOnly.length} kit tokens are not in USWDS Core${kitOnly.length ? `: ${kitOnly.join(', ')}` : '.'}`,
        );
        console.log(`  ${uswdsOnly} USWDS Core tokens are not in the kit (the kit exports a subset).`);
        if (differing.length) {
            console.log(`  ${differing.length} shared tokens differ:`);
            for (const css of differing)
                console.log(`    ${css}: the kit has ${differences[css].kit}, USWDS Core has ${differences[css].core}`);
        }

        // The record is the reviewed state; anything else is drift to look at.
        const known = record.differences ?? {};
        const drift = [
            ...differing
                .filter(
                    (css) =>
                        !known[css] ||
                        known[css].kit !== differences[css].kit ||
                        known[css].core !== differences[css].core,
                )
                .map((css) => `${css} differs and tokens/uswds.json does not record it that way`),
            ...Object.keys(known)
                .filter((css) => !differences[css])
                .map((css) => `${css} is recorded as a difference but agrees now`),
        ];
        if (version !== record.core)
            drift.push(`checked USWDS Core ${version}; tokens/uswds.json records ${record.core}`);

        if (args.includes('--write')) {
            const next: CheckRecord = {
                core: version,
                checkedAt: new Date().toISOString().slice(0, 10),
                shared,
                differences,
                kitOnly,
            };
            fs.writeFileSync(recordFile, `${JSON.stringify(next, null, 4)}\n`);
            console.log(`\nRecorded in tokens/uswds.json.`);
        } else if (drift.length) {
            console.error(`\nThe comparison does not match tokens/uswds.json:`);
            drift.forEach((line) => console.error(`  ${line}`));
            console.error('Review the differences, then run with --write to record them.');
            process.exit(1);
        } else {
            console.log(`\nMatches tokens/uswds.json (checked ${record.checkedAt ?? 'before'}).`);
        }
    } finally {
        if (temp) fs.rmSync(temp, { recursive: true, force: true });
    }
}

main();
