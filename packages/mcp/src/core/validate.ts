import ts from 'typescript';

import { closest } from './search.js';
import type { Catalog, Component, Token } from './types.js';

export type Issue = {
    rule: string;
    severity: 'error' | 'warning';
    /** 1-based. */
    line: number;
    /** 1-based. */
    column: number;
    message: string;
    fix?: string;
};

export type ValidationResult = { version: string; ok: boolean; issues: Issue[] };

/** Attributes that pass straight through to the DOM element, so they are not listed as component props. */
const PASSTHROUGH = new Set(['key', 'ref', 'style', 'className', 'class', 'id', 'role', 'title', 'tabIndex', 'slot']);
/** Attributes whose string value is not styling, so `href="#bad"` is not read as a color. */
const NON_STYLE_ATTRIBUTES = new Set(['href', 'to', 'id', 'htmlFor', 'for', 'src', 'name', 'key']);
const NON_ICON_PATHS = new Set(['SvgIcon', 'meta', 'index']);
const HEX = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi;
const FUNCTIONAL_COLOR = /\b(?:rgba?|hsla?)\(/gi;
const SPACING_PROPERTY = /^(?:padding|margin)(?:[A-Z]\w*)?$|^(?:gap|rowGap|columnGap)$/;
const SPACING_IN_CSS = /\b(?:padding|margin|gap|row-gap|column-gap)(?:-[a-z]+)*\s*:\s*([^;'"`}]+)/gi;

const RAW_ELEMENTS: Record<string, string> = {
    button: 'Button',
    a: 'Link',
    hr: 'Divider',
    table: 'Table',
    textarea: 'Textarea',
    select: 'Select',
    img: 'Img',
    progress: 'ProgressBar',
};

const RAW_INPUT_TYPES: Record<string, string> = {
    text: 'Input',
    email: 'Input',
    search: 'Input',
    url: 'Input',
    checkbox: 'Checkbox',
    radio: 'Radio',
    number: 'InputNumber',
    password: 'Password',
    tel: 'InputPhone',
    file: 'FileUpload',
    range: 'Slider',
};

/** `#abc` and `#aabbcc` compare equal. */
function normalizeHex(hex: string): string {
    const body = hex.slice(1).toLowerCase();
    return `#${body.length <= 4 ? [...body].map((c) => c + c).join('') : body}`;
}

/** A token value as a normalized hex color, for an opaque `#hex` or `rgb(r g b)` value. */
function tokenHex(value: string): string | undefined {
    if (value.startsWith('#')) return normalizeHex(value);
    const rgb = value.match(/^rgb\((\d+) (\d+) (\d+)\)$/);
    return rgb ? `#${rgb.slice(1).map((n) => Number(n).toString(16).padStart(2, '0')).join('')}` : undefined;
}

function attributeName(attribute: ts.JsxAttribute): string {
    return ts.isIdentifier(attribute.name) ? attribute.name.text : attribute.name.getText();
}

function literalValue(attribute: ts.JsxAttribute): string | undefined {
    const init = attribute.initializer;
    if (!init) return undefined;
    if (ts.isStringLiteral(init)) return init.text;
    if (ts.isJsxExpression(init) && init.expression && ts.isStringLiteralLike(init.expression)) {
        return init.expression.text;
    }
    return undefined;
}

export function validateCode(catalog: Catalog, code: string): ValidationResult {
    const source = ts.createSourceFile('input.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const issues: Issue[] = [];

    const add = (node: ts.Node | number, rule: string, severity: Issue['severity'], message: string, fix?: string) => {
        const position = typeof node === 'number' ? node : node.getStart(source);
        const { line, character } = source.getLineAndCharacterOfPosition(position);
        const issue: Issue = { rule, severity, line: line + 1, column: character + 1, message };
        if (fix) issue.fix = fix;
        issues.push(issue);
    };

    const finish = (): ValidationResult => {
        issues.sort((a, b) => a.line - b.line || a.column - b.column);
        return {
            version: catalog.meta.version,
            ok: !issues.some((i) => i.severity === 'error'),
            issues,
        };
    };

    const syntaxErrors = (source as unknown as { parseDiagnostics: ts.Diagnostic[] }).parseDiagnostics;
    if (syntaxErrors.length > 0) {
        for (const diagnostic of syntaxErrors) {
            add(diagnostic.start ?? 0, 'syntax', 'error', ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '));
        }
        return finish();
    }

    const components = new Map(catalog.components.map((c) => [c.name, c]));
    const iconNames = catalog.icons.map((i) => i.name);
    const icons = new Set(iconNames);
    const spacingTokens = catalog.tokens.filter((t) => t.kind === 'spacing');
    const colorTokens = catalog.tokens.filter((t) => tokenHex(t.value) !== undefined);

    /** Local name to the pttrn component it was imported as. */
    const bound = new Map<string, Component>();
    /** Every name the file declares itself, so a local `Button` is not reported as a missing import. */
    const declared = new Set<string>();
    const reportedMissing = new Set<string>();

    const spacingToken = (px: number): Token | undefined => spacingTokens.find((t) => t.value === `${px}px`);

    const checkImport = (node: ts.ImportDeclaration) => {
        if (!ts.isStringLiteral(node.moduleSpecifier)) return;
        const specifier = node.moduleSpecifier.text;
        const named = node.importClause?.namedBindings;
        const specifiers = named && ts.isNamedImports(named) ? named.elements : [];

        if (specifier === '@ptrn/react') {
            add(
                node,
                'unknown-import',
                'error',
                '@ptrn/react has no root export.',
                "Import each component from its own path, for example import { Button } from '@ptrn/react/Button'.",
            );
        } else if (specifier.startsWith('@ptrn/react/')) {
            const segment = specifier.slice('@ptrn/react/'.length).split('/')[0];
            const component = components.get(segment);
            if (component) {
                for (const element of specifiers) {
                    if ((element.propertyName ?? element.name).text === component.name) {
                        bound.set(element.name.text, component);
                    }
                }
            } else if (/^[A-Z]/.test(segment)) {
                const [suggestion] = closest(
                    segment,
                    catalog.components.map((c) => c.name),
                    1,
                );
                add(
                    node,
                    'unknown-import',
                    'error',
                    `There is no pttrn component at ${specifier}.`,
                    suggestion
                        ? `Did you mean '@ptrn/react/${suggestion}'?`
                        : 'Use search_components to find the right component.',
                );
            }
        } else if (specifier.startsWith('@ptrn/icons/')) {
            const segment = specifier.slice('@ptrn/icons/'.length).split('/')[0];
            if (NON_ICON_PATHS.has(segment)) return;
            if (icons.has(segment)) {
                for (const element of specifiers) {
                    const imported = (element.propertyName ?? element.name).text;
                    if (imported !== `Svg${segment}`) {
                        add(
                            element,
                            'wrong-icon-export',
                            'error',
                            `${specifier} exports Svg${segment}, not ${imported}.`,
                            `import { Svg${segment} } from '${specifier}';`,
                        );
                    }
                }
            } else {
                const [suggestion] = closest(segment, iconNames, 1);
                add(
                    node,
                    'unknown-icon',
                    'error',
                    `There is no icon named ${segment}.`,
                    suggestion
                        ? `Did you mean ${suggestion}? import { Svg${suggestion} } from '@ptrn/icons/${suggestion}';`
                        : 'Use search_icons to find an icon.',
                );
            }
        }
    };

    const collectDeclarations = (node: ts.Node) => {
        if (
            (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isVariableDeclaration(node)) &&
            node.name &&
            ts.isIdentifier(node.name)
        ) {
            declared.add(node.name.text);
        }
        if (ts.isParameter(node) && ts.isIdentifier(node.name)) declared.add(node.name.text);
        if (ts.isImportDeclaration(node)) {
            const clause = node.importClause;
            if (clause?.name) declared.add(clause.name.text);
            const named = clause?.namedBindings;
            if (named && ts.isNamedImports(named)) for (const el of named.elements) declared.add(el.name.text);
            if (named && ts.isNamespaceImport(named)) declared.add(named.name.text);
        }
        ts.forEachChild(node, collectDeclarations);
    };

    const checkProps = (
        node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
        component: Component,
        hasChildren: boolean,
    ) => {
        const attributes = node.attributes.properties;
        const hasSpread = attributes.some((a) => ts.isJsxSpreadAttribute(a));
        const propsByName = new Map(component.props.map((p) => [p.name, p]));
        const given = new Set<string>();

        for (const attribute of attributes) {
            if (!ts.isJsxAttribute(attribute)) continue;
            const name = attributeName(attribute);
            given.add(name);
            const prop = propsByName.get(name);

            if (!prop) {
                const passthrough =
                    PASSTHROUGH.has(name) ||
                    name.startsWith('data-') ||
                    name.startsWith('aria-') ||
                    /^on[A-Z]/.test(name);
                if (passthrough || component.props.length === 0) continue;
                const [suggestion] = closest(
                    name,
                    component.props.map((p) => p.name),
                    1,
                );
                add(
                    attribute,
                    'unknown-prop',
                    'warning',
                    `${component.name} has no prop "${name}".`,
                    suggestion
                        ? `Did you mean "${suggestion}"?`
                        : `Use get_component ${component.name} to see its props.`,
                );
                continue;
            }

            const value = literalValue(attribute);
            if (value !== undefined && prop.options && !prop.options.includes(value)) {
                add(
                    attribute,
                    'invalid-prop-value',
                    'error',
                    `${component.name} ${name} must be one of ${prop.options.map((o) => `'${o}'`).join(', ')}, not '${value}'.`,
                );
            }
        }

        if (hasSpread) return;
        for (const prop of component.props) {
            if (!prop.required || given.has(prop.name)) continue;
            if (prop.name === 'children' && hasChildren) continue;
            add(node, 'missing-required-prop', 'error', `${component.name} requires the "${prop.name}" prop.`);
        }
    };

    const checkRawElement = (node: ts.JsxOpeningElement | ts.JsxSelfClosingElement, tag: string) => {
        let target = RAW_ELEMENTS[tag];
        if (tag === 'input') {
            const type = node.attributes.properties.find(
                (a): a is ts.JsxAttribute => ts.isJsxAttribute(a) && attributeName(a) === 'type',
            );
            target = RAW_INPUT_TYPES[type ? (literalValue(type) ?? '') : 'text'];
        }
        if (!target || !components.has(target)) return;
        add(
            node,
            'raw-html',
            'warning',
            `<${tag}> has a pttrn equivalent.`,
            `Use <${target}> from '@ptrn/react/${target}'. Look it up with get_component.`,
        );
    };

    const checkString = (node: ts.Node, text: string) => {
        const parent = node.parent;
        if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) || ts.isLiteralTypeNode(parent)) return;
        if (ts.isJsxAttribute(parent)) {
            const name = attributeName(parent);
            if (NON_STYLE_ATTRIBUTES.has(name) || name.startsWith('aria-')) return;
        }

        for (const match of text.matchAll(HEX)) {
            const wanted = normalizeHex(match[0]);
            const names = colorTokens
                .filter((t) => tokenHex(t.value) === wanted)
                .slice(0, 3)
                .map((t) => `var(${t.name})`);
            add(
                node,
                'hardcoded-color',
                'warning',
                `Hardcoded color ${match[0]} breaks theming and dark mode.`,
                names.length > 0
                    ? `Use ${names.join(' or ')}.`
                    : 'Use a --theme-color-* token. See get_tokens.',
            );
        }
        for (const match of text.matchAll(FUNCTIONAL_COLOR)) {
            add(
                node,
                'hardcoded-color',
                'warning',
                `Hardcoded ${match[0]}…) color breaks theming and dark mode.`,
                'Use a --theme-color-* token. See get_tokens.',
            );
        }
        for (const match of text.matchAll(SPACING_IN_CSS)) {
            for (const px of match[1].matchAll(/(\d+(?:\.\d+)?)px/g)) {
                const token = spacingToken(Number(px[1]));
                if (token) reportSpacing(node, px[0], token);
            }
        }
    };

    function reportSpacing(node: ts.Node, written: string, token: Token) {
        add(
            node,
            'hardcoded-spacing',
            'warning',
            `Hardcoded spacing ${written} has a token.`,
            `Use var(${token.name}) (${token.value}).`,
        );
    }

    const checkSpacingProperty = (node: ts.PropertyAssignment) => {
        const key = ts.isIdentifier(node.name) ? node.name.text : ts.isStringLiteral(node.name) ? node.name.text : '';
        if (!SPACING_PROPERTY.test(key)) return;
        const value = node.initializer;
        if (ts.isNumericLiteral(value)) {
            const token = spacingToken(Number(value.text));
            if (token && Number(value.text) > 0) reportSpacing(value, `${value.text}px`, token);
        } else if (ts.isStringLiteralLike(value)) {
            for (const px of value.text.matchAll(/(\d+(?:\.\d+)?)px/g)) {
                const token = spacingToken(Number(px[1]));
                if (token) reportSpacing(value, px[0], token);
            }
        }
    };

    const visit = (node: ts.Node) => {
        if (ts.isImportDeclaration(node)) checkImport(node);

        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
            if (ts.isIdentifier(node.tagName)) {
                const tag = node.tagName.text;
                let component = bound.get(tag);
                if (!component && components.has(tag) && !declared.has(tag)) {
                    component = components.get(tag);
                    if (!reportedMissing.has(tag)) {
                        reportedMissing.add(tag);
                        add(
                            node,
                            'missing-import',
                            'error',
                            `${tag} is not imported.`,
                            `import { ${tag} } from '@ptrn/react/${tag}';`,
                        );
                    }
                }
                if (component) {
                    const parent = node.parent;
                    const hasChildren =
                        ts.isJsxElement(parent) &&
                        parent.children.some((c) => !(ts.isJsxText(c) && c.containsOnlyTriviaWhiteSpaces));
                    checkProps(node, component, hasChildren);
                } else if (/^[a-z]/.test(tag)) {
                    checkRawElement(node, tag);
                }
            }
        }

        if (ts.isPropertyAssignment(node)) checkSpacingProperty(node);

        if (
            ts.isStringLiteralLike(node) ||
            ts.isTemplateHead(node) ||
            ts.isTemplateMiddle(node) ||
            ts.isTemplateTail(node)
        ) {
            checkString(node, node.text);
        }

        ts.forEachChild(node, visit);
    };

    collectDeclarations(source);
    visit(source);
    return finish();
}
