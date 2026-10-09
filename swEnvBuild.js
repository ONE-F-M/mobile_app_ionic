import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Resolve the build mode: `--mode <name>` / `--mode=<name>` on the command line,
// else the MODE env var, else production (vite build's own default).
export function resolveMode(argv = process.argv) {
    const idx = argv.indexOf('--mode');
    if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
    const inline = argv.find((arg) => arg.startsWith('--mode='));
    if (inline) return inline.slice('--mode='.length);
    return process.env.MODE || 'production';
}

// Write public/sw-env.js from .env.<mode> so the service worker gets the same
// Firebase config as the bundle built in that mode.
export function writeSwEnv(mode = resolveMode()) {
    dotenv.config({ path: `.env.${mode}` });

    const envVariables = {
        VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
        VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
        VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID,
        VITE_FIREBASE_MEASUREMENT_ID: process.env.VITE_FIREBASE_MEASUREMENT_ID,
        VITE_FIREBASE_VAPID_KEY: process.env.VITE_FIREBASE_VAPID_KEY,
    };

    const filePath = join(__dirname, 'public/sw-env.js');
    const fileContent = `self.__env = ${JSON.stringify(envVariables)};`;
    writeFileSync(filePath, fileContent, { encoding: 'utf8' });

    console.log(`Service worker environment variables (mode: ${mode}) have been written to ${filePath}`);
}

// Run directly (`node swEnvBuild.js --mode staging`); importing it has no side effects.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    writeSwEnv();
}
