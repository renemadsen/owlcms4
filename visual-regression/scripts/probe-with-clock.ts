import { chromium } from '@playwright/test';

async function main() {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8080/lifting/announcer?fop=A', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);

  // Select Gruppe 2
  await p.getByRole('menuitem', { name: /Gruppe/ }).first().click();
  await p.waitForTimeout(800);
  await p.locator('vaadin-menu-bar-overlay vaadin-menu-bar-item').filter({ hasText: 'Gruppe 2' }).first().click();
  await p.waitForTimeout(6000);

  // Begynd konkurrencen
  await p.getByRole('button', { name: /^Begynd konkurrencen$/ }).first().click({ timeout: 10000 });
  await p.waitForTimeout(5000);

  console.log('buttons after start:', await p.evaluate(() => Array.from(document.querySelectorAll('vaadin-button')).filter(el => (el as HTMLElement).offsetParent !== null).map(el => (el.textContent || '').trim().slice(0, 50))));

  // Try start clock (Start ur / Ur / 1:00)
  const startClock = p.locator('vaadin-button').filter({ hasText: /Start.*ur|^Start$|Begynd ur/i }).first();
  if (await startClock.count() > 0) {
    console.log('clicking start-clock');
    await startClock.click({ timeout: 5000 });
    await p.waitForTimeout(2000);
  }

  // Stop clock
  const stopClock = p.locator('vaadin-button').filter({ hasText: /Stop|Stands/i }).first();
  if (await stopClock.count() > 0) {
    console.log('clicking stop-clock');
    await stopClock.click({ timeout: 5000 }).catch(() => {});
    await p.waitForTimeout(2000);
  }

  // Open display
  const d = await ctx.newPage();
  await d.goto('http://localhost:8080/displays/attemptBoard?fop=A', { waitUntil: 'networkidle' });
  await d.waitForTimeout(3000);
  const luk = d.getByRole('button', { name: /^Luk$/ }).first();
  if (await luk.isVisible().catch(() => false)) { await luk.click().catch(() => {}); await d.waitForTimeout(500); }

  // Bump Ulla (OBEL) cj1 declaration to 150
  const cell = p.locator('vaadin-grid-cell-content').filter({ hasText: /^OBEL$/ }).first();
  await cell.click({ timeout: 5000 });
  await p.waitForTimeout(1500);
  const fld = p.locator('vaadin-text-field#\\32_4').first();
  await fld.click();
  await fld.locator('input').first().fill('150');
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: /^Opdatér$/ }).first().click({ timeout: 5000 });
  await p.waitForTimeout(4000);

  const st = await d.evaluate(() => {
    const el: any = document.querySelector('attempt-board-template');
    return { name: el?.lastName, w: el?.weight, rec: el?.recordAttempt, msg: el?.recordMessage };
  });
  console.log('final:', JSON.stringify(st));

  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
