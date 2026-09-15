// Real verification of the Phase 1 status-computation engine. Exercises
// EVERY Yes/No/Not-sure combination for every item in the real
// items.en.json placeholder content, via the actual computeStatus()
// function exported by public/assets/checklist.js — not a
// reimplementation of the logic under test.
//
// Run: node phase-1/tests/status-engine.test.js
// No dependencies beyond Node itself.

const path = require('path');
const fs = require('fs');

const PHASE1_DIR = path.join(__dirname, '..');
const ChecklistEngine = require(path.join(PHASE1_DIR, 'public/assets/checklist.js'));
const content = JSON.parse(fs.readFileSync(path.join(PHASE1_DIR, 'public/content/items.en.json'), 'utf8'));

let failures = 0;
let checks = 0;

function assertEqual(actual, expected, label) {
  checks++;
  if (actual !== expected) {
    failures++;
    console.error(`FAIL: ${label} — expected "${expected}", got "${actual}"`);
  }
}

function cartesian(arrays) {
  return arrays.reduce(
    (acc, arr) => acc.flatMap((combo) => arr.map((v) => combo.concat([v]))),
    [[]]
  );
}

function comboMatches(combo, subQuestionIds, answers) {
  return subQuestionIds.every((id) => combo[id] === answers[id]);
}

content.items.forEach((item) => {
  const subQuestionIds = item.subQuestions.map((q) => q.id);
  const allCombos = cartesian(subQuestionIds.map(() => ['yes', 'no', 'not_sure']));

  allCombos.forEach((comboValues) => {
    const answers = {};
    subQuestionIds.forEach((id, i) => {
      answers[id] = comboValues[i];
    });

    const status = ChecklistEngine.computeStatus(item, answers);
    const hasNotSure = comboValues.includes('not_sure');

    if (hasNotSure) {
      // Fixed platform rule: ANY not_sure forces needs_check, regardless
      // of the other answers or per-item content (design-spec.md 2.2c).
      assertEqual(status, 'needs_check', `${item.id} ${JSON.stringify(answers)} (contains not_sure)`);
    } else {
      const rule = item.statusRule;
      const isCompliant = (rule.compliantWhen || []).some((c) => comboMatches(c, subQuestionIds, answers));
      const isNotCompliant = (rule.notCompliantWhen || []).some((c) => comboMatches(c, subQuestionIds, answers));
      let expected;
      if (isCompliant) expected = 'compliant';
      else if (isNotCompliant) expected = 'not_compliant';
      else expected = 'needs_check'; // unmatched-combination fallback

      assertEqual(status, expected, `${item.id} ${JSON.stringify(answers)}`);
    }
  });
});

// Explicitly confirm item-3's deliberately-unmatched Yes/No combination
// hits the fallback (not just a not_sure-driven needs_check) — proves
// the "unmatched combination -> needs_check" safety net is real, using
// real content, not a synthetic case (see items.en.json's item-3 "_note").
(function checkItem3Fallback() {
  const item3 = content.items.find((i) => i.id === 'item-3');
  const fallbackAnswers = { 'item-3-q1': 'yes', 'item-3-q2': 'yes', 'item-3-q3': 'no' };
  const status = ChecklistEngine.computeStatus(item3, fallbackAnswers);
  assertEqual(status, 'needs_check', 'item-3 deliberately-unmatched Yes/No combo -> needs_check fallback');
})();

// Confirm a partially-answered item safely returns null (never guesses).
(function checkPartial() {
  const item1 = content.items.find((i) => i.id === 'item-1');
  const status = ChecklistEngine.computeStatus(item1, { 'item-1-q1': 'yes' });
  assertEqual(status, null, 'item-1 partially answered -> null, not a guessed status');
})();

console.log(`${checks} checks run, ${failures} failures.`);
process.exit(failures === 0 ? 0 : 1);
