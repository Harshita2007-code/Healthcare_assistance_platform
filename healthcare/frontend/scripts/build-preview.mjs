// Build a self-contained preview to avoid subresource access in restricted frames.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = process.cwd();
let html = await readFile(resolve(root, 'dist/index.html'), 'utf8');
const jsMatch = html.match(/<script\s+type="module"\s+crossorigin\s+src="([^"]+)"\s*><\/script>/);
const cssMatch = html.match(/<link\s+rel="stylesheet"\s+crossorigin\s+href="([^"]+)"\s*>/);
if (!jsMatch || !cssMatch) throw new Error('Could not locate bundled preview assets.');
let js = await readFile(resolve(root, 'dist', '.' + jsMatch[1]), 'utf8');
let css = await readFile(resolve(root, 'dist', '.' + cssMatch[1]), 'utf8');
// System fallbacks are used in offline/sandboxed previews.
css = css.replace(/@import\s+["']https:\/\/fonts\.googleapis\.com\/[^"]*["'];?/g, '');
js = js.replace(/<\/script/gi, '<\\/script');
css = css.replace(/<\/style/gi, '<\\/style');
html = html.replace(jsMatch[0], () => `<script type="module">${js}</script>`)
  .replace(cssMatch[0], () => `<style>${css}</style>`);
await mkdir(resolve(root, 'preview'), { recursive: true });
await writeFile(resolve(root, 'preview/index.html'), html);
console.log('Self-contained preview built: preview/index.html');
