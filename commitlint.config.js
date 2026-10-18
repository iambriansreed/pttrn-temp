/** Conventional Commits, enforced by the commit-msg hook and in CI. See CONTRIBUTING.md. */
export default {
    extends: ['@commitlint/config-conventional'],
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
