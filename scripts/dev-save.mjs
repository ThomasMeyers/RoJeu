// Prints a browser snippet that seeds the local save (localStorage key `snake-meta`), and copies
// it to the clipboard. Paste it in the game's browser console: the save lives in the browser, so
// no script can write it from here.
//
// Usage: npm run dev-save                -> every talent maxed except the ending, enough points to buy it
//        npm run dev-save -- ending      -> same, ending already owned (end screen offers the replay)
//        npm run dev-save -- reset       -> clears the save
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ENDING_ID = 'ending_unlock';
const STORAGE_KEY = 'snake-meta';
/** Points left over in the `ending` preset, so the store still looks lived-in. */
const LEFTOVER_POINTS = 2000;

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const fail = (message) => {
  console.error(`dev-save: ${message}`);
  process.exit(1);
};

// Read the catalog instead of hardcoding levels and prices, so this follows the talent list.
const catalog = readFileSync(resolve(projectRoot, 'src/game/talentCatalog.ts'), 'utf8');
const talents = catalog
  .split(/\n {2}\{/)
  .slice(1)
  .map((block) => {
    const idMatch = block.match(/id: (?:'([^']+)'|ENDING_TALENT_ID)/);
    const maxLevelMatch = block.match(/maxLevel: (\d+)/);
    const firstCostMatch = block.match(/costsByLevel: \[(\d+)/);
    return {
      id: idMatch ? (idMatch[1] ?? ENDING_ID) : null,
      maxLevel: Number(maxLevelMatch?.[1] ?? 0),
      firstCost: Number(firstCostMatch?.[1] ?? 0),
    };
  })
  .filter((talent) => talent.id && talent.maxLevel > 0);

if (talents.length === 0) {
  fail('no talent found in src/game/talentCatalog.ts (has the catalog format changed?)');
}

const ending = talents.find((talent) => talent.id === ENDING_ID);
if (!ending) {
  fail(`no "${ENDING_ID}" talent found in src/game/talentCatalog.ts`);
}

const others = talents.filter((talent) => talent.id !== ENDING_ID);
const maxedOthers = Object.fromEntries(others.map((talent) => [talent.id, talent.maxLevel]));

const mode = process.argv[2] ?? 'all-but-ending';
let snippet;
let summary;

if (mode === 'all-but-ending' || mode === 'default') {
  const meta = {
    totalPoints: ending.firstCost,
    runCount: others.length * 2,
    talentLevels: maxedOthers,
  };
  snippet = `localStorage.setItem(${JSON.stringify(STORAGE_KEY)}, ${JSON.stringify(JSON.stringify(meta))}); location.reload();`;
  summary = `${others.length} talents maxés, ${ending.firstCost} p. en poche, "${ENDING_ID}" pas encore acheté`;
} else if (mode === 'ending' || mode === 'ending-owned' || mode === 'owned') {
  const meta = {
    totalPoints: LEFTOVER_POINTS,
    runCount: others.length * 2 + 1,
    talentLevels: { ...maxedOthers, [ENDING_ID]: 1 },
  };
  snippet = `localStorage.setItem(${JSON.stringify(STORAGE_KEY)}, ${JSON.stringify(JSON.stringify(meta))}); location.reload();`;
  summary = `tout maxé, "${ENDING_ID}" acheté, ${LEFTOVER_POINTS} p. en poche`;
} else if (mode === 'reset') {
  snippet = `localStorage.removeItem(${JSON.stringify(STORAGE_KEY)}); location.reload();`;
  summary = 'sauvegarde effacée';
} else {
  fail(`unknown preset "${mode}". Use: all-but-ending (default), ending, reset.`);
}

let copied = false;
try {
  execFileSync('pbcopy', { input: snippet });
  copied = true;
} catch {
  // No pbcopy (non-macOS, or restricted): the snippet is printed below anyway.
}

console.log(`\ndev-save [${mode}] : ${summary}`);
console.log(
  copied
    ? '→ snippet copié dans le presse-papier. Colle-le dans la console du navigateur (Cmd+Option+J).\n'
    : '→ copie le snippet ci-dessous dans la console du navigateur (Cmd+Option+J).\n',
);
console.log(snippet);
console.log('');
