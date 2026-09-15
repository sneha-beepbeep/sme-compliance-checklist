// Real verification of save/resume persistence logic (public/assets/
// persistence.js), using a simulated but functionally real (not
// canned-response) localStorage. Exercises: fresh load, a save ->
// (simulated reload) -> resume cycle, and a contentVersion bump
// triggering the "start again" (stale) path.
//
// Run: node phase-1/tests/persistence.test.js
// No dependencies beyond Node itself.

const path = require('path');

function makeFakeLocalStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

global.localStorage = makeFakeLocalStorage();

const PHASE1_DIR = path.join(__dirname, '..');
const Persistence = require(path.join(PHASE1_DIR, 'public/assets/persistence.js'));

let failures = 0;
let checks = 0;
function assert(cond, label) {
  checks++;
  if (!cond) {
    failures++;
    console.error(`FAIL: ${label}`);
  }
}

// 1. Fresh load: nothing stored yet.
const fresh = Persistence.load(1);
assert(fresh.state === null, 'fresh load: state is null');
assert(fresh.stale === false, 'fresh load: not flagged stale');

// 2. Simulate mid-checklist progress and save it.
const midState = {
  contentVersion: 1,
  qualifyingAnswer: 'yes',
  answers: {
    'item-1': { 'item-1-q1': 'yes', 'item-1-q2': 'no' },
    'item-2': { 'item-2-q1': 'yes' },
  },
  currentItemId: 'item-2',
  completed: false,
  contactSubmitted: false,
};
Persistence.save(midState);

// 3. Simulate a page reload: persistence.js keeps no in-memory state of
// its own (it always reads from the storage object on every load() call)
// — calling load() again here is the equivalent of a fresh page load
// reading from the same browser's localStorage.
const resumed = Persistence.load(1);
assert(resumed.state !== null, 'resume: state is present after reload');
assert(resumed.stale === false, 'resume: not flagged stale (same contentVersion)');
assert(resumed.state.qualifyingAnswer === 'yes', 'resume: qualifyingAnswer preserved');
assert(resumed.state.currentItemId === 'item-2', 'resume: currentItemId preserved');
assert(
  resumed.state.answers['item-1']['item-1-q1'] === 'yes' &&
    resumed.state.answers['item-1']['item-1-q2'] === 'no',
  'resume: item-1 sub-answers preserved exactly'
);
assert(
  resumed.state.answers['item-2']['item-2-q1'] === 'yes',
  'resume: item-2 partial sub-answers preserved (mid-item resume)'
);
assert(resumed.state.completed === false, 'resume: completed flag preserved');

// 4. Content version bump: content edited since the user started. load()
// must return state:null, stale:true, and must have cleared the stored
// record as a side effect (no silent remapping of old answers onto new
// questions — /plan Section 5's recommendation-turned-default).
const staleResult = Persistence.load(2);
assert(staleResult.state === null, 'stale: state is null on contentVersion mismatch');
assert(staleResult.stale === true, 'stale: flagged stale on contentVersion mismatch');

const afterStaleLoad = Persistence.load(2);
assert(afterStaleLoad.state === null, 'stale: record actually cleared, not just reported stale');
assert(afterStaleLoad.stale === false, 'stale: a second load after clearing is a normal fresh load, not a repeated stale flag');

// 5. Explicit clear() works directly too.
Persistence.save(midState);
Persistence.clear();
const afterClear = Persistence.load(1);
assert(afterClear.state === null, 'explicit clear(): removes the record');

console.log(`${checks} checks run, ${failures} failures.`);
process.exit(failures === 0 ? 0 : 1);
