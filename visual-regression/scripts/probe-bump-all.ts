import { chromium, Page } from '@playwright/test';

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

  // Start competition
  await p.getByRole('button', { name: /^Begynd konkurrencen$/ }).first().click({ timeout: 10000 });
  await p.waitForTimeout(5000);

  // Open display
  const d = await ctx.newPage();
  await d.goto('http://localhost:8080/displays/attemptBoard?fop=A', { waitUntil: 'networkidle' });
  await d.waitForTimeout(5000);
  const luk = d.getByRole('button', { name: /^Luk$/ }).first();
  if (await luk.isVisible().catch(() => false)) { await luk.click().catch(() => {}); await d.waitForTimeout(500); }

  // Read the lifting-order grid: extract lastNames of all athletes
  const lastNames = await p.evaluate(() => {
    // cells are in row-major order: 8 header cells + 8 per row
    const cells = Array.from(document.querySelectorAll('vaadin-grid-cell-content'));
    const texts = cells.map(el => (el.textContent || '').trim());
    const names: string[] = [];
    // Efternavn is column index 1 (0-based) within a row of 8 cols; header row occupies indices 0..7
    for (let row = 0; row < (texts.length - 8) / 8; row++) {
      const name = texts[8 + row * 8 + 1];
      if (name) names.push(name);
    }
    return names;
  });
  console.log('athletes:', lastNames);

  // For each athlete, open their card, set cj1 decl (2_4) to 150, update
  for (const last of lastNames) {
    console.log(`\n-- bumping ${last} --`);
    try {
      await p.locator('vaadin-grid-cell-content').filter({ hasText: new RegExp(`^${last}$`) }).first().click({ timeout: 5000 });
      await p.waitForTimeout(1200);
      const fld = p.locator('vaadin-text-field#\\32_4').first();
      if (await fld.count() === 0) {
        console.log(`  no 2_4 field for ${last}, cancel`);
        await p.getByRole('button', { name: /^Annuller$/ }).first().click({ timeout: 3000 }).catch(() => {});
        await p.waitForTimeout(500);
        continue;
      }
      await fld.click();
      await fld.locator('input').first().fill('150');
      await p.waitForTimeout(300);
      await p.getByRole('button', { name: /^Opdatér$/ }).first().click({ timeout: 5000 });
      await p.waitForTimeout(2500);
      const st = await d.evaluate(() => {
        const el: any = document.querySelector('attempt-board-template');
        return { name: el?.lastName, w: el?.weight, rec: el?.recordAttempt };
      });
      console.log(`  attemptBoard:`, JSON.stringify(st));
    } catch (e: any) {
      console.log(`  failed: ${e.message.slice(0, 80)}`);
      await p.keyboard.press('Escape').catch(() => {});
      await p.waitForTimeout(500);
    }
  }

  console.log('\n== final screenshot ==');
  await d.screenshot({ path: '/tmp/record-final.png' });
  const final = await d.evaluate(() => {
    const el: any = document.querySelector('attempt-board-template');
    return { lastName: el?.lastName, firstName: el?.firstName, weight: el?.weight, recordAttempt: el?.recordAttempt, recordBroken: el?.recordBroken };
  });
  console.log('final state:', JSON.stringify(final));

  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
