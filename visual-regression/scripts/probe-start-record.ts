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
  console.log('H3 after group:', await p.locator('h3').first().textContent());

  // List visible buttons
  const btns1 = await p.evaluate(() => Array.from(document.querySelectorAll('vaadin-button')).filter(el => (el as HTMLElement).offsetParent !== null).map(el => (el.textContent || '').trim().slice(0, 60)));
  console.log('buttons after group select:', JSON.stringify(btns1));

  // Click Begynd konkurrencen
  console.log('\n== click Begynd konkurrencen ==');
  await p.getByRole('button', { name: /^Begynd konkurrencen$/ }).first().click({ timeout: 10000 });
  await p.waitForTimeout(6000);
  console.log('H3 after start:', await p.locator('h3').first().textContent());

  const btns2 = await p.evaluate(() => Array.from(document.querySelectorAll('vaadin-button')).filter(el => (el as HTMLElement).offsetParent !== null).map(el => (el.textContent || '').trim().slice(0, 60)));
  console.log('buttons after start:', JSON.stringify(btns2));

  // Now open a second page to check attemptBoard state
  const d = await ctx.newPage();
  await d.goto('http://localhost:8080/displays/attemptBoard?fop=A', { waitUntil: 'networkidle' });
  await d.waitForTimeout(5000);
  const luk = d.getByRole('button', { name: /^Luk$/ }).first();
  if (await luk.isVisible().catch(() => false)) { await luk.click().catch(() => {}); await d.waitForTimeout(500); }
  const state1 = await d.evaluate(() => {
    const el = document.querySelector('attempt-board-template');
    const anyEl: any = el;
    return { lastName: anyEl?.lastName, firstName: anyEl?.firstName, weight: anyEl?.weight, attempt: anyEl?.attempt, recordAttempt: anyEl?.recordAttempt };
  });
  console.log('attemptBoard state after start:', JSON.stringify(state1));
  await d.screenshot({ path: '/tmp/record-start-state.png' });

  // Click the row for the currently-announced athlete (Nora per state1)
  const currentLast = (state1 as any).lastName || 'Quist';
  console.log(`\n== click row for "${currentLast}" ==`);
  const cell = p.locator('vaadin-grid-cell-content').filter({ hasText: currentLast }).first();
  await cell.click({ timeout: 5000 });
  await p.waitForTimeout(2000);
  const overlays = await p.locator('vaadin-dialog-overlay').count();
  console.log('dialog overlays:', overlays);
  const title = await p.evaluate(() => document.querySelector('vaadin-dialog-overlay')?.querySelector('h2,h3,h4,[slot="title"]')?.textContent?.trim());
  console.log('dialog title:', title);

  // Set cj1 declaration (2_4) to 150 — Ulla's current attempt
  console.log('== set 2_4 to 150 ==');
  const s1 = p.locator('vaadin-text-field#\\32_4').first();
  await s1.click();
  await s1.locator('input').first().fill('150');
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: /^Opdatér$/ }).first().click({ timeout: 5000 });
  await p.waitForTimeout(5000);

  // Re-check display
  const state2 = await d.evaluate(() => {
    const el = document.querySelector('attempt-board-template');
    const anyEl: any = el;
    return { lastName: anyEl?.lastName, firstName: anyEl?.firstName, fullName: anyEl?.fullName, weight: anyEl?.weight, attempt: anyEl?.attempt, recordAttempt: anyEl?.recordAttempt, recordBroken: anyEl?.recordBroken };
  });
  console.log('attemptBoard state after decl=150:', JSON.stringify(state2));
  const h3After = await p.locator('h3').first().textContent();
  console.log('announcer H3 after decl change:', h3After);
  await d.screenshot({ path: '/tmp/record-after.png' });

  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
