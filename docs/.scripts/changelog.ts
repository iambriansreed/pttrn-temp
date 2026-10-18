/**
 * $ vite-node .scripts/changelog.ts
 *
 * This script generates a changelog based on the git commit history.
 */

import * as fs from 'fs';
import * as path from 'path';

import { simpleGit, SimpleGit } from 'simple-git';

const git: SimpleGit = simpleGit(path.resolve(__dirname, '../../packages/react'));

export const TYPES = {
    feat: 'Features',
    fix: 'Fix',
    perf: 'Performance Improvements',
    refactor: 'Code Refactoring',
    test: 'Tests',
    chore: 'Chores',
    docs: 'Documentation',
    style: 'Styles',
};

interface Commit {
    hash: string;
    date: string;
    message: string;
    author_name: string;
    files: string[];
}

async function getCommits(): Promise<Commit[]> {
    const log = await git.log({ '--name-only': null });
    return log.all.map((commit) => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author_name: commit.author_name,
        files: commit?.diff?.files.map((file) => file.file) || [],
    }));
}

interface Changes extends Commit {
    type: string;
    components: string[];
    breakingChange?: boolean;
}

async function generateChangelog() {
    const commits = await getCommits();

    // merge commit messages between each release
    let releases: { [key: string]: Changes[] } = {};

    let lastRelease: string | null = null;
    commits.forEach((commit) => {
        const release = commit.message.match(/chore\(release\): ([\d.]+)/)?.[1];
        if (release) {
            if (!releases[release]) {
                releases[release] = [];
            }
            lastRelease = release;
            return;
        } else if (lastRelease) {
            const message = commit.message.split(/: (.*)/s);

            const components = commit.files.flatMap((f) => {
                const match = f.match(/src\/([A-Z]\w+).tsx/);
                return match?.[1] || [];
            });

            releases[lastRelease].push({
                ...commit,
                date: commit.date,
                message: message[1] || commit.message,
                components,
                type: message[0] || 'other',
            });
        }
    });
    releases = Object.fromEntries(
        Object.entries(releases).filter(([release]) => {
            // filter out releases with no commits
            return (
                commits.length > 0 &&
                release !== 'undefined' &&
                release !== 'null' &&
                !release.startsWith('1') &&
                !release.startsWith('0')
            );
        }),
    );

    fs.writeFileSync(
        path.join(__dirname, '../src/docs/CHANGELOG.md'),
        `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

${Object.entries(releases)
    .map(([release, changes]) => {
        return `## ${release}\n${changes
            .map((change) => {
                let message = ``;

                if (change.components.length) {
                    message += `Updates to ${change.components.map((c) => `**${c}**`).join(', ')}`;
                }

                if (change.breakingChange) {
                    message += `\n\n**Breaking Change**: ${change.message}`;
                }

                return `${message}\n\n${change.message}`;
            })
            .join('')}`;
    })
    .join('\n\n')}
`,
    );

    //fs.writeFileSync(path.join(__dirname, 'commits.json'), JSON.stringify({ releases }, null, 2));
}

generateChangelog().catch((err) => console.error(err));
