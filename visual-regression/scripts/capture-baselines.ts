import { chromium, Browser, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import {
  DISPLAYS,
  VIEWPORT,
  gotoDisplay,
  openAnnouncer,
  runFullFlow,
  State,
} from '../src/capture-flow';

const OUT = path.resolve(__dirname, '..', 'tests', '__screenshots__');

async function captureAll(display: Page, label: State) {
  fs.mkdirSync(OUT, { recursive: true });
  for (const d of DISPLAYS) {
    await gotoDisplay(display, d.url);
    const file = path.join(OUT, `${d.name}-${label}-1080.png`);
    await display.screenshot({ path: file, fullPage: false });
    console.log(`  saved ${path.basename(file)}`);
  }
}

async function main() {
  const browser: Browser = await chromium.launch();
  const adminCtx = await browser.newContext({ viewport: VIEWPORT });
  const displayCtx = await browser.newContext({ viewport: VIEWPORT });
  const display = await displayCtx.newPage();
  const announcer = await openAnnouncer(adminCtx);

  await runFullFlow(display, announcer, async (d, _a, state) => {
    await captureAll(d, state);
  });

  await browser.close();
  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
