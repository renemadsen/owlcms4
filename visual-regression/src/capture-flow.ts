import { BrowserContext, Page } from '@playwright/test';

export const BASE = 'http://localhost:8080';
export const VIEWPORT = { width: 1920, height: 1080 };

export interface Display {
  name: string;
  url: string;
}

export const DISPLAYS: Display[] = [
  { name: 'publicScoreboard',     url: '/displays/publicScoreboard?fop=A' },
  { name: 'currentathlete',       url: '/displays/currentathlete?fop=A' },
  { name: 'attemptBoard',         url: '/displays/attemptBoard?fop=A' },
  { name: 'athleteFacingDecision',url: '/displays/athleteFacingDecision?fop=A' },
  { name: 'publicStartList',      url: '/displays/publicStartList?fop=A' },
  { name: 'resultsMedals',        url: '/displays/resultsMedals?fop=A' },
  { name: 'resultsLeadersRanks',  url: '/displays/resultsLeadersRanks?fop=A' },
  { name: 'resultsLeaders',       url: '/displays/resultsLeaders?fop=A' },
  { name: 'topsinclair',          url: '/displays/topsinclair?fop=A' },
  { name: 'topteams',             url: '/displays/topteams?fop=A' },
  { name: 'topteamsinclair',      url: '/displays/topteamsinclair?fop=A' },
];

export const STATES = ['wait', 'active', 'record', 'paused', 'resumed'] as const;
export type State = typeof STATES[number];

export async function dismissSettingsDialog(display: Page) {
  const luk = display.getByRole('button', { name: /^Luk$/ }).first();
  if (await luk.isVisible().catch(() => false)) {
    await luk.click().catch(() => {});
    await display.waitForTimeout(500);
  }
}

export async function gotoDisplay(display: Page, url: string) {
  try {
    await display.goto(BASE + url, { waitUntil: 'networkidle', timeout: 15000 });
  } catch {
    await display.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  }
  await display.waitForTimeout(2000);
  await dismissSettingsDialog(display);
  await display.waitForTimeout(3000);
}

export async function openAnnouncer(ctx: BrowserContext): Promise<Page> {
  const p = await ctx.newPage();
  await p.goto(BASE + '/lifting/announcer?fop=A', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  return p;
}

async function openGroupMenu(announcer: Page) {
  await announcer.getByRole('menuitem', { name: /Gruppe/ }).first().click();
  await announcer.waitForTimeout(500);
}

export async function selectGruppe2(announcer: Page) {
  await openGroupMenu(announcer);
  await announcer.locator('vaadin-menu-bar-overlay vaadin-menu-bar-item').filter({ hasText: 'Gruppe 2' }).first().click();
  await announcer.waitForTimeout(5000);
}

export async function deselectGroup(announcer: Page) {
  await openGroupMenu(announcer);
  await announcer.locator('vaadin-menu-bar-overlay vaadin-menu-bar-item').filter({ hasText: 'Ingen gruppe' }).first().click();
  await announcer.waitForTimeout(5000);
}

export async function startCompetition(announcer: Page) {
  const begynd = announcer.getByRole('button', { name: /^Begynd konkurrencen$/ }).first();
  if (await begynd.count() > 0) {
    await begynd.click({ timeout: 10000 }).catch(() => {});
    await announcer.waitForTimeout(5000);
  }
}

async function editAthleteRecordDeclared(announcer: Page, last: string): Promise<boolean> {
  // Open the athlete card.
  await announcer.locator('vaadin-grid-cell-content').filter({ hasText: new RegExp(`^${last}$`) }).first().click({ timeout: 5000 });

  const fld = announcer.locator('vaadin-text-field#\\33_4').first();
  try {
    await fld.waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    await announcer.getByRole('button', { name: /^Annuller$/ }).first().click({ timeout: 3000 }).catch(() => {});
    return false;
  }

  // Wait for the form to finish populating (server-side updatingResults=true
  // clobbers fields mid-init on slower runners). Detect stability: the field's
  // input.value must remain unchanged for ~800ms.
  const input = fld.locator('input').first();
  let lastVal = '';
  for (let i = 0; i < 8; i++) {
    const v = await input.inputValue().catch(() => '');
    if (i > 0 && v === lastVal) break;
    lastVal = v;
    await announcer.waitForTimeout(200);
  }

  // Fill with retry — if Vaadin re-renders post-fill, the value can revert.
  for (let attempt = 0; attempt < 3; attempt++) {
    await input.click();
    await input.fill('');
    await input.pressSequentially('150', { delay: 40 });
    await input.press('Tab');
    await announcer.waitForTimeout(600);
    const v = await input.inputValue().catch(() => '');
    if (v === '150') break;
  }

  await announcer.getByRole('button', { name: /^Opdatér$/ }).first().click({ timeout: 5000 }).catch(() => {});
  await announcer.waitForTimeout(1500);
  return true;
}

export async function triggerRecordAttempt(announcer: Page) {
  // Push all Gruppe 2 athletes' cj1 Change1 to 150 so the current athlete
  // (Obel, K69) challenges the Danish Senior CJ record of 120 kg. Athletes
  // who already have recorded actuals that conflict will be rejected by
  // server-side validation — that's expected; we only need the current
  // athlete's declared to land for the record banner to appear.
  const lastNames = await announcer.evaluate(`(() => {
    const cells = Array.from(document.querySelectorAll('vaadin-grid-cell-content'));
    const texts = cells.map(el => (el.textContent || '').trim());
    const names = [];
    for (let row = 0; row < (texts.length - 8) / 8; row++) {
      const name = texts[8 + row * 8 + 1];
      if (name) names.push(name);
    }
    return names;
  })()`) as string[];

  for (const last of lastNames) {
    try {
      await editAthleteRecordDeclared(announcer, last);
    } catch {
      await announcer.keyboard.press('Escape').catch(() => {});
    }
    await closeOverlays(announcer);
  }
  await announcer.waitForTimeout(3000);
  await closeOverlays(announcer);
}

export async function togglePause(announcer: Page) {
  await announcer.getByRole('button', { name: /^(Pause|Genoptag|Resume|Start|Præsentation)$/i }).first().click({ timeout: 10000 });
  await announcer.waitForTimeout(5000);
}

export async function closeOverlays(announcer: Page) {
  for (let i = 0; i < 5; i++) {
    const overlays = await announcer.locator('vaadin-dialog-overlay').count();
    if (overlays === 0) break;
    await announcer.getByRole('button', { name: /^Annuller$/ }).first().click({ timeout: 2000 }).catch(() => {});
    await announcer.keyboard.press('Escape').catch(() => {});
    await announcer.waitForTimeout(500);
  }
}

/** Per-state hook: given the state label, receives (display, announcer) to act. */
export type StateHandler = (display: Page, announcer: Page, state: State) => Promise<void>;

/**
 * Walk all 5 states in order, invoking `onState` after the announcer has been
 * driven into each state. Caller decides what to do with each display page
 * (save PNGs vs. assert screenshots).
 */
export async function runFullFlow(
  display: Page,
  announcer: Page,
  onState: StateHandler,
): Promise<void> {
  console.log('== Deselecting any current group ==');
  await deselectGroup(announcer);

  console.log('== WAIT (no group) ==');
  await onState(display, announcer, 'wait');

  console.log('== Selecting Gruppe 2 ==');
  await selectGruppe2(announcer);

  console.log('== ACTIVE (group loaded, pre-lift) ==');
  await onState(display, announcer, 'active');

  console.log('== RECORD attempt (Begynd, bump all cj1 to 150) ==');
  await startCompetition(announcer);
  await triggerRecordAttempt(announcer);
  await onState(display, announcer, 'record');

  console.log('== PAUSE toggled ==');
  await togglePause(announcer);
  await onState(display, announcer, 'paused');

  console.log('== PAUSE released (reselect group) ==');
  await closeOverlays(announcer);
  await deselectGroup(announcer);
  await selectGruppe2(announcer);
  await onState(display, announcer, 'resumed');
}
