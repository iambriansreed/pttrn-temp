import { execSync } from 'node:child_process';
import readline from 'node:readline';

type Task = {
    description: string;
    name?: string;
    exec: string;
};

export const TASKS: Task[] = [
    {
        description: 'Run the @ptrn/react meta generation script',
        name: 'meta',
        exec: 'npm run meta',
    },
] as const;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.on('SIGINT', function () {
    rl?.close();
    process.exit();
});

// Call runMenu again to allow for another selection
rl?.on('close', () => {
    console.log('Exiting...');
    process.exit(0);
});

// a node cli script that displays a menu, waits for an input of an item number, then runs the callback, allow the menu to be skipped if an argument is passed, after the callback is run, the menu is displayed again, until the user selects exit
async function runMenu(looped = false) {
    const args = process.argv.slice(2);

    let task: Task | undefined;
    const hasArgument = args.length > 0;

    if (!looped && hasArgument) {
        const selectedItem = parseInt(args[0], 10);
        task = TASKS.find((_, index) => index + 1 === selectedItem);
    }

    if (!task) {
        console.log(
            looped
                ? '\n\nSelect another option or press Ctrl+C to exit.'
                : '\n\n⚡️\n\nSelect an option or press Ctrl+C to exit.',
        );

        TASKS.forEach(({ description }, index) => {
            console.log(`\n${index + 1}. ${description}`);
        });

        task = await new Promise((resolve) => {
            rl.question('\nEnter the number of the option you want to run: ', (answer) => {
                const selectedItem = parseInt(answer, 10);
                const taskChoice = TASKS.find((_, index) => index + 1 === selectedItem);

                if (taskChoice) resolve(taskChoice);

                console.log('Invalid selection.');
            });
        });
    }

    if (task) {
        console.log(`\n\nRunning ${task.name}...\n\n`);
        execSync(task.exec, { stdio: 'inherit' });
        console.log('\n\nComplete!\n\n');
        runMenu(true);
        return;
    } else {
        console.log('\n\nInvalid selection.');
        if (!hasArgument) runMenu(true);
        return;
    }

    // Call runMenu again to allow for another selection
}

runMenu();
