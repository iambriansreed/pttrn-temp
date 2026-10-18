import { execSync } from 'child_process';

const { MODE } = process.env;

console.log(`Building in ${MODE} mode`);

execSync(`npm run meta && vite build && cp dist/index.html dist/404.html`, {
    stdio: 'inherit',
});
