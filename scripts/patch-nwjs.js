#!/usr/bin/env node
/**
 * Patch the NW.js app bundle to use Nightmare's icon and name.
 * Run after `npm install` or before `npm run dev`.
 */

import { copyFileSync, existsSync, readdirSync } from 'fs';
import { execFileSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ICON_SRC = join(ROOT, 'src', 'assets', 'icon.icns');
const NW_DIR = join(ROOT, 'node_modules', 'nw');

// Find the app bundle (either Nightmare.app or nwjs.app)
function findNwjsApp() {
  if (!existsSync(NW_DIR)) return null;
  const entries = readdirSync(NW_DIR);
  for (const entry of entries) {
    if (entry.startsWith('nwjs-')) {
      const nightmare = join(NW_DIR, entry, 'Nightmare.app');
      if (existsSync(nightmare)) return nightmare;
      const app = join(NW_DIR, entry, 'nwjs.app');
      if (existsSync(app)) return app;
    }
  }
  return null;
}

const nwjsApp = findNwjsApp();
if (!nwjsApp) {
  console.log('[patch-nwjs] NW.js app not found, skipping');
  process.exit(0);
}

const plist = join(nwjsApp, 'Contents', 'Info.plist');
const iconDst = join(nwjsApp, 'Contents', 'Resources', 'app.icns');

// Replace icon
if (existsSync(ICON_SRC) && existsSync(iconDst)) {
  copyFileSync(ICON_SRC, iconDst);
  console.log('[patch-nwjs] Icon replaced');
}

// Update display name and bundle identifier (new ID forces macOS to drop icon cache)
if (existsSync(plist) && process.platform === 'darwin') {
  try {
    execFileSync('/usr/libexec/PlistBuddy', ['-c', "Set :CFBundleDisplayName 'Nightmare Browser'", plist]);
    execFileSync('/usr/libexec/PlistBuddy', ['-c', "Set :CFBundleName 'Nightmare Browser'", plist]);
    execFileSync('/usr/libexec/PlistBuddy', ['-c', "Set :CFBundleIdentifier com.nightmare.browser", plist]);
    console.log('[patch-nwjs] App name and bundle ID updated');
  } catch {
    console.log('[patch-nwjs] Could not update plist (non-macOS?)');
  }
}

console.log('[patch-nwjs] Done');
