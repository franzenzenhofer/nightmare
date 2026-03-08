#!/usr/bin/env node
/**
 * Generate icon files from SVG source for all platforms.
 * Requires: rsvg-convert (brew install librsvg)
 * macOS: Creates .icns via iconutil
 * Windows: Creates .ico (requires ImageMagick)
 */

import { execFileSync } from 'child_process';
import { mkdirSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SVG = join(ROOT, 'src', 'assets', 'icon.svg');
const ICONS_DIR = join(ROOT, 'src', 'assets', 'icons');
const ASSETS_DIR = join(ROOT, 'src', 'assets');

const SIZES = [16, 32, 48, 64, 128, 256, 512, 1024];

function run(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function hasCommand(cmd) {
  try {
    execFileSync('which', [cmd], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// Ensure output dirs
mkdirSync(ICONS_DIR, { recursive: true });

console.log('[icons] Source SVG:', SVG);

// Step 1: Generate PNGs
if (!hasCommand('rsvg-convert')) {
  console.error('[icons] rsvg-convert not found. Install: brew install librsvg');
  process.exit(1);
}

for (const size of SIZES) {
  const out = join(ICONS_DIR, `icon_${size}x${size}.png`);
  run('rsvg-convert', ['-w', String(size), '-h', String(size), SVG, '-o', out]);
  console.log(`[icons] ${existsSync(out) ? '✓' : '✗'} ${size}x${size}`);
}

// Copy 512x512 as the main icon.png
const mainPng = join(ASSETS_DIR, 'icon.png');
const src512 = join(ICONS_DIR, 'icon_512x512.png');
if (existsSync(src512)) {
  copyFileSync(src512, mainPng);
  console.log('[icons] ✓ icon.png (512x512)');
}

// Step 2: Create .icns (macOS only)
if (process.platform === 'darwin') {
  const iconsetDir = '/tmp/nightmare.iconset';
  mkdirSync(iconsetDir, { recursive: true });

  const icnsMappings = [
    [16, 'icon_16x16.png'],
    [32, 'icon_16x16@2x.png'],
    [32, 'icon_32x32.png'],
    [64, 'icon_32x32@2x.png'],
    [128, 'icon_128x128.png'],
    [256, 'icon_128x128@2x.png'],
    [256, 'icon_256x256.png'],
    [512, 'icon_256x256@2x.png'],
    [512, 'icon_512x512.png'],
    [1024, 'icon_512x512@2x.png'],
  ];

  for (const [size, name] of icnsMappings) {
    const src = join(ICONS_DIR, `icon_${size}x${size}.png`);
    const dst = join(iconsetDir, name);
    if (existsSync(src)) {
      copyFileSync(src, dst);
    }
  }

  const icnsOut = join(ASSETS_DIR, 'icon.icns');
  if (run('iconutil', ['-c', 'icns', iconsetDir, '-o', icnsOut])) {
    console.log('[icons] ✓ icon.icns');
  } else {
    console.log('[icons] ✗ icon.icns (iconutil failed)');
  }
}

// Step 3: Create .ico (Windows)
const icoOut = join(ASSETS_DIR, 'icon.ico');
if (hasCommand('magick')) {
  const icoSources = [16, 32, 48, 256]
    .map(s => join(ICONS_DIR, `icon_${s}x${s}.png`))
    .filter(existsSync);
  if (icoSources.length > 0) {
    if (run('magick', [...icoSources, icoOut])) {
      console.log('[icons] ✓ icon.ico (ImageMagick)');
    }
  }
} else {
  console.log('[icons] ⚠ No ImageMagick. Skipping .ico. Install: brew install imagemagick');
}

console.log('[icons] Done.');
