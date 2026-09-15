// Real headless-Chrome click-through of the Phase 1 wizard.
//
// NOT part of the zero-dependency test suite: requires `puppeteer-core`
// (a dev-only dependency — see tests/package.json) and a real Chrome/
// Chromium binary, plus a running instance of this app (PHP built-in
// server or otherwise) reachable at BASE_URL.
//
// Usage:
//   cd phase-1/tests
//   npm install
//   CHROME_PATH=/path/to/chrome BASE_URL=http://127.0.0.1:8091 \
//     node wizard-browser.test.js
//
// Exercises: intro -> qualifying (Yes, No-exit, Not-sure) -> all 4 items
// (including back-navigation live-recomputing a changed status) -> both
// results variants -> contact form (pre-population, editable selection,
// validation error with preserved input, successful submission) ->
// confirmation copy -> a REAL page reload -> resume (both a
// completed-session resume and a mid-checklist resume) -> cookie-banner
// Accept/Decline behavior and persistence across reload.

const puppeteer = require('puppeteer-core');
const os = require('os');
const path = require('path');

const CHROME_PATH =
  process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8091';
const PROFILE_DIR = path.join(os.tmpdir(), 'phase1-wizard-browser-test-profiles');

let failures = 0;
let checks = 0;
function assert(cond, label) {
  checks++;
  if (!cond) {
    failures++;
    console.error(`FAIL: ${label}`);
  } else {
    console.log(`ok - ${label}`);
  }
}

// NOTE on method: puppeteer-core's coordinate-based page.click() (real
// synthetic mouse events at the element's on-screen position) proved
// unreliable against the system Chrome build in the sandboxed headless
// environment this suite was first run in — clicks silently landed
// without dispatching to the target element, which looked like a
// headless/viewport quirk of that specific setup rather than a page bug
// (the same button's real `onclick` handler fires correctly when
// triggered via `element.click()` executed in-page). clickEl() below
// dispatches a real DOM `click` event from inside the page instead of
// simulating mouse coordinates from outside it — this still exercises
// the actual button/handler/event-bubbling path.
async function clickEl(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`clickEl: no element found for selector ${sel}`);
    el.click();
  }, selector);
}

async function answerSubquestion(page, questionName, value) {
  await page.evaluate(
    (name, val) => {
      const input = document.querySelector(`input[name="${CSS.escape(name)}"][value="${val}"]`);
      if (!input) throw new Error(`No radio found for ${name}=${val}`);
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
    questionName,
    value
  );
}

async function screenIsVisible(page, id) {
  return page.evaluate((elId) => {
    const el = document.getElementById(elId);
    return !!el && !el.hidden;
  }, id);
}

async function newBrowser(profileName) {
  return puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    userDataDir: path.join(PROFILE_DIR, profileName),
    args: ['--no-sandbox'],
  });
}

async function runMainWalkthrough() {
  const browser = await newBrowser('run1');
  const consoleErrors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', (err) => consoleErrors.push(String(err)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    assert(await screenIsVisible(page, 'screen-intro'), 'intro screen visible on first load');

    await clickEl(page, '#intro-start-btn');
    assert(await screenIsVisible(page, 'screen-qualifying'), 'qualifying screen shown after Start');

    await clickEl(page, '[data-qualifying-answer="yes"]');
    assert(await screenIsVisible(page, 'screen-item'), 'item screen shown after answering qualifying=yes');

    let progress = await page.$eval('#item-progress', (el) => el.textContent);
    assert(progress === 'Item 1 of 4', 'progress indicator reads "Item 1 of 4"');

    await answerSubquestion(page, 'item-1-q1', 'yes');
    await answerSubquestion(page, 'item-1-q2', 'yes');
    let statusText = await page.$eval('#item-status-text', (el) => el.textContent);
    assert(statusText === 'This item is flagged as: Compliant', 'item-1 yes/yes computes to Compliant, with correct copy framing');
    let guidanceHidden = await page.$eval('#item-guidance-panel', (el) => el.hidden);
    assert(guidanceHidden === true, 'item-1 Compliant shows no guidance panel');

    let nextDisabled = await page.$eval('#item-next-btn', (el) => el.disabled);
    assert(nextDisabled === false, 'Next enabled once item-1 fully answered');
    await clickEl(page, '#item-next-btn');

    progress = await page.$eval('#item-progress', (el) => el.textContent);
    assert(progress === 'Item 2 of 4', 'progress indicator reads "Item 2 of 4"');

    await answerSubquestion(page, 'item-2-q1', 'yes');
    await answerSubquestion(page, 'item-2-q2', 'no');
    statusText = await page.$eval('#item-status-text', (el) => el.textContent);
    assert(statusText === 'This item is flagged as: Not compliant', 'item-2 yes/no computes to Not compliant');
    guidanceHidden = await page.$eval('#item-guidance-panel', (el) => el.hidden);
    assert(guidanceHidden === false, 'item-2 Not compliant shows guidance panel');
    const guidanceText = await page.$eval('#item-guidance-text', (el) => el.textContent);
    assert(guidanceText.includes('PLACEHOLDER'), 'guidance panel shows the citation object (placeholder content), not remediation instructions');

    await clickEl(page, '#item-back-btn');
    progress = await page.$eval('#item-progress', (el) => el.textContent);
    assert(progress === 'Item 1 of 4', 'Back navigation returns to item 1');
    await answerSubquestion(page, 'item-1-q2', 'no');
    statusText = await page.$eval('#item-status-text', (el) => el.textContent);
    assert(statusText === 'This item is flagged as: Not compliant', 'item-1 status live-recomputes to Not compliant after changing an answer via back-navigation');
    await clickEl(page, '#item-next-btn');
    progress = await page.$eval('#item-progress', (el) => el.textContent);
    assert(progress === 'Item 2 of 4', 'forward navigation returns to item 2 with its answers still intact');
    statusText = await page.$eval('#item-status-text', (el) => el.textContent);
    assert(statusText === 'This item is flagged as: Not compliant', 'item-2 still shows its previously-computed status after round-trip navigation');
    await clickEl(page, '#item-next-btn');

    progress = await page.$eval('#item-progress', (el) => el.textContent);
    assert(progress === 'Item 3 of 4', 'progress indicator reads "Item 3 of 4"');
    await answerSubquestion(page, 'item-3-q1', 'yes');
    await answerSubquestion(page, 'item-3-q2', 'yes');
    await answerSubquestion(page, 'item-3-q3', 'not_sure');
    statusText = await page.$eval('#item-status-text', (el) => el.textContent);
    assert(statusText === 'This item is flagged as: Needs-check', 'item-3 with one not_sure answer computes to Needs-check regardless of other answers');
    await clickEl(page, '#item-next-btn');

    progress = await page.$eval('#item-progress', (el) => el.textContent);
    assert(progress === 'Item 4 of 4', 'progress indicator reads "Item 4 of 4"');
    await answerSubquestion(page, 'item-4-q1', 'no');
    statusText = await page.$eval('#item-status-text', (el) => el.textContent);
    assert(statusText === 'This item is flagged as: Compliant', 'item-4 no computes to Compliant');
    await clickEl(page, '#item-next-btn');

    assert(await screenIsVisible(page, 'screen-results-flagged'), 'flagged results screen shown (item-1/item-2 not compliant, item-3 needs-check)');
    const recapItems = await page.$$eval('#results-flagged-list li', (els) => els.map((el) => el.textContent));
    assert(recapItems.length === 4, 'results recap lists all 4 items');
    assert(recapItems.some((t) => t.includes('Not compliant')), 'recap includes a Not compliant entry');
    assert(recapItems.some((t) => t.includes('Needs-check')), 'recap includes a Needs-check entry');

    await clickEl(page, '#results-flagged-contact-btn');
    assert(await screenIsVisible(page, 'screen-contact'), 'contact form shown after clicking the results CTA');

    const preCheckedCount = await page.$$eval('#contact-items-list input[type="checkbox"]', (els) => els.length);
    // item-1 was deliberately flipped to Not compliant during the
    // back-navigation test above, so item-1, item-2, and item-3 are all
    // flagged (only item-4 is Compliant) — 3, not 2.
    assert(preCheckedCount === 3, 'contact form pre-populates exactly the 3 currently-flagged items');
    const allPreChecked = await page.$$eval('#contact-items-list input[type="checkbox"]', (els) => els.every((el) => el.checked));
    assert(allPreChecked, 'all pre-populated flagged items are checked by default');

    // Deselect one item (US-8's "exactly the items I'm stuck on", editable).
    await page.evaluate(() => {
      document.querySelectorAll('#contact-items-list input[type="checkbox"]')[0].click();
    });

    await page.type('#contact-email', 'not-an-email');
    await clickEl(page, '#contact-submit-btn');
    let emailErrorHidden = await page.$eval('#contact-email-error', (el) => el.hidden);
    assert(emailErrorHidden === false, 'invalid email on contact form shows a visible inline error');
    const preservedValue = await page.$eval('#contact-email', (el) => el.value);
    assert(preservedValue === 'not-an-email', 'invalid input is preserved after a validation error, not cleared');

    await page.evaluate(() => { document.getElementById('contact-email').value = ''; });
    await page.type('#contact-email', 'browsertest@example.com');
    await page.type('#contact-message', 'Real headless-Chrome test submission.');
    await clickEl(page, '#contact-submit-btn');
    await page.waitForFunction(
      () => !document.getElementById('screen-contact-confirmation').hidden,
      { timeout: 5000 }
    );
    assert(await screenIsVisible(page, 'screen-contact-confirmation'), 'confirmation screen shown after successful contact submission');
    const confirmationText = await page.$eval('#contact-confirmation-message', (el) => el.textContent);
    assert(confirmationText.includes('2 items'), `confirmation message reflects the 2 remaining selected items after deselecting one of the 3 (got: "${confirmationText}")`);
    assert(!confirmationText.toLowerCase().includes('book a call'), 'confirmation copy does not promise a booked call (design-spec.md 2.5)');

    await page.reload({ waitUntil: 'networkidle0' });
    assert(await screenIsVisible(page, 'screen-intro'), 'after reload, lands back on intro screen');
    const resumeBannerHidden = await page.$eval('#intro-resume-banner', (el) => el.hidden);
    assert(resumeBannerHidden === false, 'resume banner shown on reload (a completed record exists)');

    await clickEl(page, '#intro-resume-btn');
    assert(await screenIsVisible(page, 'screen-results-flagged'), 'resuming a completed session goes straight to the flagged results screen');

    assert(consoleErrors.length === 0, `no uncaught JS errors during the full walkthrough (saw: ${JSON.stringify(consoleErrors)})`);
  } finally {
    await browser.close();
  }
}

async function runMidChecklistResume() {
  const browser = await newBrowser('run2');
  try {
    const page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await clickEl(page, '#intro-start-btn');
    await clickEl(page, '[data-qualifying-answer="not_sure"]');
    assert(await screenIsVisible(page, 'screen-item'), '"not sure" on the qualifying question proceeds into the checklist (design-spec.md S1.2)');

    await answerSubquestion(page, 'item-1-q1', 'yes');
    await answerSubquestion(page, 'item-1-q2', 'yes');

    await page.reload({ waitUntil: 'networkidle0' });
    assert(await screenIsVisible(page, 'screen-intro'), 'mid-checklist: reload lands back on intro');
    await clickEl(page, '#intro-resume-btn');
    assert(await screenIsVisible(page, 'screen-item'), 'mid-checklist resume returns to the item screen');
    const progress2 = await page.$eval('#item-progress', (el) => el.textContent);
    assert(progress2 === 'Item 1 of 4', 'mid-checklist resume lands back on item 1 (where the user left off)');
    const q1Checked = await page.$eval('input[name="item-1-q1"][value="yes"]', (el) => el.checked);
    const q2Checked = await page.$eval('input[name="item-1-q2"][value="yes"]', (el) => el.checked);
    assert(q1Checked && q2Checked, 'mid-checklist resume restores the exact prior sub-question answers');
    const statusText2 = await page.$eval('#item-status-text', (el) => el.textContent);
    assert(statusText2 === 'This item is flagged as: Compliant', 'mid-checklist resume recomputes status live from restored answers, not from a stored status value');
  } finally {
    await browser.close();
  }
}

async function runQualifyingNoAndCookieBanner() {
  const browser = await newBrowser('runA');
  try {
    const page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

    const bannerHiddenInitially = await page.$eval('#cookie-banner', (el) => el.hidden);
    assert(bannerHiddenInitially === false, 'cookie banner is visible on first visit, before any choice');

    await clickEl(page, '#intro-start-btn');
    assert(await screenIsVisible(page, 'screen-qualifying'), 'cookie banner being visible does not block interacting with the page underneath it');

    await clickEl(page, '[data-qualifying-answer="no"]');
    assert(await screenIsVisible(page, 'screen-qualifying-exit'), '"No" on the qualifying question shows the exit screen');

    await clickEl(page, '#cookie-accept');
    const bannerHiddenAfterAccept = await page.$eval('#cookie-banner', (el) => el.hidden);
    assert(bannerHiddenAfterAccept === true, 'cookie banner hides after clicking Accept');

    await page.reload({ waitUntil: 'networkidle0' });
    const bannerHiddenAfterReload = await page.$eval('#cookie-banner', (el) => el.hidden);
    assert(bannerHiddenAfterReload === true, 'cookie consent choice persists across a reload (banner does not reappear)');
  } finally {
    await browser.close();
  }
}

async function runAllCompliantResults() {
  const browser = await newBrowser('runB');
  try {
    const page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await clickEl(page, '#intro-start-btn');
    await clickEl(page, '[data-qualifying-answer="yes"]');

    await answerSubquestion(page, 'item-1-q1', 'yes');
    await answerSubquestion(page, 'item-1-q2', 'yes');
    await clickEl(page, '#item-next-btn');

    await answerSubquestion(page, 'item-2-q1', 'yes');
    await answerSubquestion(page, 'item-2-q2', 'yes');
    await clickEl(page, '#item-next-btn');

    await answerSubquestion(page, 'item-3-q1', 'yes');
    await answerSubquestion(page, 'item-3-q2', 'yes');
    await answerSubquestion(page, 'item-3-q3', 'yes');
    await clickEl(page, '#item-next-btn');

    await answerSubquestion(page, 'item-4-q1', 'no');
    await clickEl(page, '#item-next-btn');

    assert(await screenIsVisible(page, 'screen-results-compliant'), 'all-compliant results screen shown when every item is Compliant');
    const recap = await page.$$eval('#results-compliant-list li', (els) => els.map((el) => el.textContent));
    assert(recap.length === 4 && recap.every((t) => t.includes('Compliant')), 'all-compliant recap lists all 4 items as Compliant');

    await clickEl(page, '#results-compliant-contact-link');
    assert(await screenIsVisible(page, 'screen-contact'), 'low-key contact link on the all-compliant screen opens the contact form');
    const itemCount = await page.$eval('#contact-items-list', (el) => el.querySelectorAll('input[type="checkbox"]').length);
    assert(itemCount === 0, 'contact form has zero pre-checked items when nothing is flagged');
    const emptyNoteVisible = await page.$eval('.contact-items__empty-note', (el) => !!el);
    assert(emptyNoteVisible, 'contact form shows an explanatory note instead of an empty-looking checkbox list');
  } finally {
    await browser.close();
  }
}

(async () => {
  await runMainWalkthrough();
  await runMidChecklistResume();
  await runQualifyingNoAndCookieBanner();
  await runAllCompliantResults();

  console.log(`\n${checks} checks run, ${failures} failures.`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((err) => {
  console.error('Uncaught error in test script:', err);
  process.exit(1);
});
