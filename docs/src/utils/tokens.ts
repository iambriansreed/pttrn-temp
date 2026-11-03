import { TokenInfo } from '@ptrn/styles/tokens';

export type { TokenInfo };

/**
 * Loads the typed token catalog `@ptrn/styles` builds. It is a large module that only the search and the token catalog
 * need, so it is a separate chunk loaded on first use; the module system keeps the one copy.
 */
export function loadTokens(): Promise<TokenInfo[]> {
    return import('@ptrn/styles/tokens').then((module) => Object.values(module.tokens));
}

/** The tier a token belongs to, from its prefix: `--usa-*` primitives, `--theme-*` and `--component-*`. */
export function tokenTier(token: Pick<TokenInfo, 'collection' | 'css'>): string {
    if (token.css.startsWith('--usa-')) return 'Primitive';
    if (token.css.startsWith('--theme-')) return 'Theme';
    if (token.css.startsWith('--component-')) return 'Component';
    return token.collection;
}

/** The catalog's address for one token: the token catalog on the Design Tokens page, filtered to it. */
export function tokenUrl(css: string): string {
    return `/tokens?token=${encodeURIComponent(css)}#token-catalog`;
}
