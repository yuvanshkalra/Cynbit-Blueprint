// Zero-dependency build. Produces:
//   dist/index.html     one self-contained page (CSS and JS inlined) for any static host
//   dist/embed.html     the same page as a fragment with no <html>/<head>/<body> wrapper,
//                       for hosts that supply their own document skeleton
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFile(join(root, p), 'utf8');

// Modules in dependency order. Imports are single-line, so they can be removed and the
// `export` keyword dropped to bundle everything into one scope.
const order = ['src/config.js', 'src/estimate.js', 'src/share.js', 'src/brief.js', 'src/app.js'];

function stripModule(source) {
  return source
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export\s+/gm, '');
}

const bundle = (await Promise.all(order.map(read))).map(stripModule).join('\n');
if (/^\s*(import|export)\b/m.test(bundle)) {
  throw new Error('Bundle still contains import or export statements. Keep imports on one line.');
}

const css = await read('src/styles.css');
let html = await read('index.html');

html = html
  .replace('<link rel="stylesheet" href="./src/styles.css">', `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="./src/app.js"></script>', `<script>\n(() => {\n${bundle}\n})();\n</script>`);

if (html.includes('./src/')) throw new Error('Unreplaced local asset reference in built HTML.');

await mkdir(join(root, 'dist'), { recursive: true });
await writeFile(join(root, 'dist/index.html'), html);

// Fragment: keep head content (title, metas, fonts, style) and body content; drop the wrapper.
const head = /<head>([\s\S]*?)<\/head>/.exec(html)[1].replace(/<meta charset[^>]*>\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, '');
const body = /<body>([\s\S]*?)<\/body>/.exec(html)[1];
// Run the script after the markup it controls.
const fragment = `${head.trim()}\n${body.trim()}\n`;
await writeFile(join(root, 'dist/embed.html'), fragment);

console.log(`dist/index.html  ${(html.length / 1024).toFixed(1)} KB`);
console.log(`dist/embed.html  ${(fragment.length / 1024).toFixed(1)} KB`);
