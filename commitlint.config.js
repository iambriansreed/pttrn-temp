/** Conventional Commits, enforced by the commit-msg hook and in CI. See CONTRIBUTING.md. */
export default {
    extends: ['@commitlint/config-conventional'],
    // Dependabot writes its own subjects ("Bump x from 1 to 2"); the dependency bumps are reviewed, not lint-checked.
    ignores: [(message) => message.includes('Signed-off-by: dependabot[bot]')],
    rules: {
        'scope-enum': [
            2,
            'always',
            ['react', 'web', 'icons', 'styles', 'mcp', 'docs', 'plugin', 'tokens', 'ci', 'deps', 'release', 'repo'],
        ],
        'body-max-line-length': [0],
        'footer-max-line-length': [0],
    },
};
