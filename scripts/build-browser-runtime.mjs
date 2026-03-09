import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const entryFile = path.join(projectRoot, 'src', 'browser', 'runtime', 'nightmare-runtime.ts');
const outputFile = path.join(projectRoot, 'src', 'browser', 'dist', 'nightmare-runtime.js');

await build({
  entryPoints: [entryFile],
  outfile: outputFile,
  bundle: true,
  format: 'iife',
  platform: 'neutral',
  target: ['es2022'],
  sourcemap: true,
  logLevel: 'info',
  legalComments: 'none',
  external: ['fs', 'path', 'os', 'url', 'http', 'https', 'nw.gui'],
  banner: {
    js: '/* NW.js runtime: Node.js built-ins available via require() */',
  },
});
