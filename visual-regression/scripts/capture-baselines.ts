import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const BASE = 'http://localhost:8080';
const OUT = path.resolve(__dirname, '..', 'tests', '__screenshots__');
const VIEWPORT = { width: 1920, height: 1080 };

const DISPLAYS: { name: string; url: string }[] = [
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

async function dismissSettingsDialog(display: Page) {
  const luk = display.getByRole('button', { name: /^Luk$/ }).first();
  if (await luk.isVisible().catch(() => false)) {
    await luk.click().catch(() => {});
    await display.waitForTimeout(500);
  }
}

async function captureAll(display: Page, label: string) {
  fs.mkdirSync(OUT, { recursive: true });
  for (const d of DISPLAYS) {
    try {
      await display.goto(BASE + d.url, { waitUntil: 'networkidle', timeout: 15000 });
    } catch {
      await display.goto(BASE + d.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    }
    await display.waitForTimeout(2000);
    await dismissSettingsDialog(display);
    await display.waitForTimeout(3000);
    const file = path.join(OUT, `${d.name}-${label}-1080.png`);
    await display.screenshot({ path: file, fullPage: false });
    console.log(`  saved ${path.basename(file)}`);
  }
}

async function openAnnouncer(ctx: BrowserContext): Promise<Page> {
  const p = await ctx.newPage();
  await p.goto(BASE + '/lifting/announcer?fop=A', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  return p;
}

async function openGroupMenu(announcer: Page) {
  await announcer.getByRole('menuitem', { name: /Gruppe/ }).first().click();
  await announcer.waitForTimeout(500);
}

async function selectGruppe2(announcer: Page) {
  await openGroupMenu(announcer);
  await announcer.locator('vaadin-menu-bar-overlay vaadin-menu-bar-item').filter({ hasText: 'Gruppe 2' }).first().click();
  await announcer.waitForTimeout(5000);
}

async function deselectGroup(announcer: Page) {
  await openGroupMenu(announcer);
  await announcer.locator('vaadin-menu-bar-overlay vaadin-menu-bar-item').filter({ hasText: 'Ingen gruppe' }).first().click();
  await announcer.waitForTimeout(5000);
}

async function togglePause(announcer: Page) {
  await announcer.getByRole('button', { name: /^(Pause|Genoptag|Resume|Start|Præsentation)$/i }).first().click({ timeout: 10000 });
  await announcer.waitForTimeout(5000);
}

async function main() {
  const browser: Browser = await chromium.launch();
  const adminCtx = await browser.newContext({ viewport: VIEWPORT });
  const displayCtx = await browser.newContext({ viewport: VIEWPORT });
  const display = await displayCtx.newPage();

  console.log('== Deselecting any current group ==');
  const announcer = await openAnnouncer(adminCtx);
  await deselectGroup(announcer);

  console.log('== WAIT (no group) ==');
  await captureAll(display, 'wait');

  console.log('== Selecting Gruppe 2 ==');
  await selectGruppe2(announcer);

  console.log('== ACTIVE (group loaded, pre-lift) ==');
  await captureAll(display, 'active');

  console.log('== PAUSE toggled ==');
  await togglePause(announcer);
  await captureAll(display, 'paused');

  console.log('== PAUSE released (reselect group) ==');
  await deselectGroup(announcer);
  await selectGruppe2(announcer);
  await captureAll(display, 'resumed');

  await browser.close();
  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
