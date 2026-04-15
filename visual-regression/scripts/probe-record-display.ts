import { chromium } from '@playwright/test';
async function main() {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8080/displays/attemptBoard?fop=A', { waitUntil: 'networkidle' });
  await p.waitForTimeout(5000);
  const luk = p.getByRole('button', { name: /^Luk$/ }).first();
  if (await luk.isVisible().catch(() => false)) { await luk.click().catch(() => {}); await p.waitForTimeout(500); }
  // Check recordAttempt property on AttemptBoard element
  const state = await p.evaluate(() => {
    const el = document.querySelector('attempt-board-template, decision-board-template, [component-type]');
    const anyEl: any = el;
    return {
      tag: el?.tagName,
      recordAttempt: anyEl?.recordAttempt,
      recordBroken: anyEl?.recordBroken,
      weight: anyEl?.weight,
      athlete: anyEl?.fullName,
    };
  });
  console.log('state:', JSON.stringify(state, null, 2));
  await p.screenshot({ path: '/tmp/record-probe.png' });
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
