// npm run check — syntax-checks every JS module and greps shipped files for banned franchise words.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SHIPPED_DIRS = ['js', 'css', 'assets'];
const SHIPPED_FILES = ['index.html', 'wand.html', 'sources.html', 'manifest.webmanifest'];
const BANNED = /doctor\s*strange|dr\.?\s*strange|sling\s*ring|marvel|kamar[-\s]?taj|avengers|\bmcu\b|sorcerer\s+supreme|mystic\s+arts/i;
let failed = 0;

const files = [...SHIPPED_FILES.map((f) => join(root, f))];
for (const d of SHIPPED_DIRS) for (const f of readdirSync(join(root, d))) { const p = join(root, d, f); if (statSync(p).isFile()) files.push(p); }

for (const f of files) {
  const text = readFileSync(f, 'utf8');
  const m = text.match(BANNED);
  if (m) { console.log(`BANNED WORD "${m[0]}" in ${relative(root, f)}`); failed++; }
  if (extname(f) === '.js') {
    const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    if (r.status !== 0) { console.log(`SYNTAX ERROR in ${relative(root, f)}\n${r.stderr}`); failed++; }
  }
}
try { JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8')); } catch (e) { console.log('manifest.webmanifest is not valid JSON'); failed++; }
console.log(failed ? `\n${failed} problem(s)` : `OK — ${files.length} files checked`);
process.exit(failed ? 1 : 0);
