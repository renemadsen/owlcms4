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
  if (await begynd.count() > 0) {
    await begynd.click({ timeout: 5000 }).catch(() => {});
    await p.waitForTimeout(5000);
  } else {
    console.log('Begynd konkurrencen already cleared');
  }

  // Open display page BEFORE clock start so push stays bound
  const d = await ctx.newPage();
  await d.goto('http://localhost:8080/displays/attemptBoard?fop=A', { waitUntil: 'networkidle' });
  await d.waitForTimeout(3000);
  const luk = d.getByRole('button', { name: /^Luk$/ }).first();
  if (await luk.isVisible().catch(() => false)) { await luk.click().catch(() => {}); await d.waitForTimeout(500); }

  // Reload group to force recomputeRecordsMap with refreshed athlete instances
  await p.getByRole('button', { name: /^Genindlæs gruppe$/ }).first().click({ timeout: 5000 });
  await p.waitForTimeout(5000);
  console.log('group reloaded');

  // Bump all athletes' cj1 to 150
  const lastNames = await p.evaluate(`(() => {
    const cells = Array.from(document.querySelectorAll('vaadin-grid-cell-content'));
    const texts = cells.map(el => (el.textContent || '').trim());
    const names = [];
    for (let row = 0; row < (texts.length - 8) / 8; row++) {
      const name = texts[8 + row * 8 + 1];
      if (name) names.push(name);
    }
    return names;
  })()`) as string[];
  console.log('athletes:', lastNames);

  for (const last of lastNames) {
    try {
      await p.locator('vaadin-grid-cell-content').filter({ hasText: new RegExp(`^${last}$`) }).first().click({ timeout: 5000 });
      await p.waitForTimeout(1000);
      const fld = p.locator('vaadin-text-field#\\33_4').first();
      if (await fld.count() === 0) {
        await p.getByRole('button', { name: /^Annuller$/ }).first().click({ timeout: 3000 }).catch(() => {});
        continue;
      }
      await fld.click();
      await fld.locator('input').first().fill('150');
      await p.waitForTimeout(200);
      await p.getByRole('button', { name: /^Opdatér$/ }).first().click({ timeout: 5000 });
      await p.waitForTimeout(1500);
    } catch (e: any) {
      console.log(`failed ${last}: ${e.message.slice(0, 60)}`);
      await p.keyboard.press('Escape').catch(() => {});
    }
  }

  await p.waitForTimeout(3000);
  const st = await d.evaluate(`(() => {
    const el = document.querySelector('attempt-board-template');
    return { name: el?.lastName, w: el?.weight, rec: el?.recordAttempt, msg: el?.recordMessage };
  })()`);
  console.log('final:', JSON.stringify(st));
  await d.screenshot({ path: '/tmp/record-clock.png' });

  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
