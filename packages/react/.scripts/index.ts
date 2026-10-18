#!/usr/bin/env npx tsx
/* eslint-disable @cspell/spellchecker */
/* eslint-disable no-console */
/**
 * A simple CLI script to run development tasks.
 *
 * Run this script from packages/react with: $ npx tsx .scripts/index.ts {task} [args]
 *
 * For example to create a new component, you can run:
 *
 * $ npx tsx .scripts/index.ts newc Dropdown
 *
 * To see a list of available tasks, run:
 *
 * $ npx tsx .scripts/index.ts
 *
 * This will show an arrow-navigable menu of available tasks.
 *
 * You can add new tasks by creating a new TypeScript file in the `.scripts/tasks` directory.
 *
 * Each task file should execute be able to be run directly with:
 *
 * $ npx tsx .scripts/tasks/{task-file}.ts [args]
 *
 * Each task file should have a comment block at the top with the following format:
 *
 * // UI: {tag} - {description}
 *
 * Where `{tag}` is the command you want to use to run the task, and `{description}` is a brief description of what the
 * task does.
 *
 * For example:
 *
 * // UI: newc - Create a new component
 *
 * This will allow you to run the task with:
 *
 * $ npx tsx .scripts/index.ts newc [args]
 *
 * The script will pass any additional arguments to the task file.
 */

// look for tasks with the pattern "UI: {tag} - {description}" in a comment block near the top of the file

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

const tasksDir = path.resolve('./.scripts/tasks');

const tasks: { [key: string]: { description: string; filePath: string } } = {};

fs.readdirSync(tasksDir).forEach((file) => {
    if (file.endsWith('.ts')) {
        const filePath = path.join(tasksDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const match = content.match(/UI:\s*(\S+)\s*-\s*(.+)/);
        if (match) {
            const [, tag, description] = match;
            tasks[tag] = { description, filePath };
        }
    }
});

const [taskTag, ...args] = process.argv.slice(2);

function runTask(taskKey?: string) {
    const task = taskKey && tasks[taskKey];
    if (!task) return;

    console.log(`Running task: ${taskKey} - ${task.description}`);
    try {
        execSync(`npx tsx ${task.filePath} ${args.join(' ')}`, { stdio: 'inherit' });
        process.exit(0);
    } catch (error) {
        console.error(`Task "${taskKey}" failed:`, error);
        process.exit(1);
    }
}

runTask(taskTag);
// List available tasks if no valid task is provided make it a arrow navigable menu

async function createArrowKeyMenu() {
    const questions = [
        {
            type: 'list',
            name: 'selectedOption',
            message: 'Choose an task:',
            choices: [
                ...Object.keys(tasks),
                new inquirer.Separator(), // Optional separator
                'Exit',
            ],
        },
    ];

    const answers = await inquirer.prompt(questions as any);
    console.log('You selected:', answers.selectedOption);
    runTask(answers.selectedOption);

    if (answers.selectedOption === 'Exit') {
        process.exit(); // Exit the process if 'Exit' is chosen
    }
    // You can add logic here based on the selected option
}

createArrowKeyMenu();
