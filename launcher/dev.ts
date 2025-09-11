// dev.ts
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const electronMain = path.resolve(__dirname, '..', 'electron/main.ts');

const child = spawn('electron', [electronMain], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--import=tsx',
  },
});
