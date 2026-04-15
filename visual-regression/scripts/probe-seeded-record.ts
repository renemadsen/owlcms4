import { chromium } from '@playwright/test';

async function main() {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8080/lifting/announcer?fop=A', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  await p.getByRole('menuitem', { name: /Gruppe/ }).first().click();
  await p.waitForTimeout(500);
  await p.locator('vaadin-menu-bar-overlay vaadin-menu-bar-item').filter({ hasText: 'Gruppe 2' }).first().click();
  await p.waitForTimeout(5000);
  const begynd = p.getByRole('button', { name: /^Begynd konkurrencen$/ }).first();
  if (await begynd.count() > 0) await begynd.click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(4000);

  const d = await ctx.newPage();
  await d.goto('http://localhost:8080/displays/attemptBoard?fop=A', { waitUntil: 'networkidle' });
  await d.waitForTimeout(4000);
  const luk = d.getByRole('button', { name: /^Luk$/ }).first();
  if (await luk.isVisible().catch(() => false)) { await luk.click().catch(() => {}); await d.waitForTimeout(500); }
  await d.waitForTimeout(2000);

  const st = await d.evaluate(`(() => {
    const el = document.querySelector('attempt-board-template');
    return { name: el?.lastName, w: el?.weight, att: el?.attempt, rec: el?.recordAttempt, msg: el?.recordMessage };
  })()`);
  console.log('state:', JSON.stringify(st));
  await d.screenshot({ path: '/tmp/seeded-record.png' });
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
