import { chromium } from '@playwright/test';

async function main() {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
  const d = await ctx.newPage();
  await d.goto('http://localhost:8080/displays/attemptBoard?fop=A', { waitUntil: 'networkidle' });
  await d.waitForTimeout(3000);
  const luk = d.getByRole('button', { name: /^Luk$/ }).first();
  if (await luk.isVisible().catch(() => false)) { await luk.click().catch(() => {}); await d.waitForTimeout(500); }

  const st = await d.evaluate(`(() => {
    const el = document.querySelector('attempt-board-template');
    return {
      name: el?.lastName, weight: el?.weight, attempt: el?.attempt,
      recordAttempt: el?.recordAttempt, recordMessage: el?.recordMessage,
      recordKind: el?.recordKind, recordValue: el?.recordValue,
      records: el?.records ? JSON.stringify(el.records).slice(0,500) : null,
      allProps: Object.keys(el || {}).filter(k => k.toLowerCase().includes('record'))
    };
  })()`);
  console.log(JSON.stringify(st, null, 2));
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
