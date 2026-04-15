import { chromium } from '@playwright/test';

async function main() {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8080/lifting/announcer?fop=A', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);

  // Reset: deselect + reselect
  await p.getByRole('menuitem', { name: /Gruppe/ }).first().click();
  await p.waitForTimeout(500);
  try { await p.locator('vaadin-menu-bar-overlay vaadin-menu-bar-item').filter({ hasText: 'Ingen gruppe' }).first().click({ timeout: 2000 }); } catch { await p.keyboard.press('Escape'); }
  await p.waitForTimeout(3000);
  await p.getByRole('menuitem', { name: /Gruppe/ }).first().click();
  await p.waitForTimeout(500);
  await p.locator('vaadin-menu-bar-overlay vaadin-menu-bar-item').filter({ hasText: 'Gruppe 2' }).first().click();
  await p.waitForTimeout(5000);

  // Open display
  const d = await ctx.newPage();
  await d.goto('http://localhost:8080/displays/attemptBoard?fop=A', { waitUntil: 'networkidle' });
  await d.waitForTimeout(3000);
  const luk = d.getByRole('button', { name: /^Luk$/ }).first();
  if (await luk.isVisible().catch(() => false)) { await luk.click().catch(() => {}); await d.waitForTimeout(500); }

  console.log('== before Begynd ==');
  console.log('H3:', await p.locator('h3').first().textContent());

  // Begynd konkurrencen
  await p.getByRole('button', { name: /^Begynd konkurrencen$/ }).first().click({ timeout: 10000 });

  // Poll state every 2s for 20s
  for (let t = 0; t < 20; t += 2) {
    await p.waitForTimeout(2000);
    const h3 = await p.locator('h3').first().textContent();
    const btns = await p.evaluate(() => Array.from(document.querySelectorAll('vaadin-button')).filter(el => (el as HTMLElement).offsetParent !== null).map(el => (el.textContent || '').trim().slice(0, 40)));
    const menus = await p.evaluate(() => Array.from(document.querySelectorAll('vaadin-menu-bar-item')).filter(el => (el as HTMLElement).offsetParent !== null).map(el => (el.textContent || '').trim().slice(0, 40)));
    const st = await d.evaluate(() => {
      const el: any = document.querySelector('attempt-board-template');
      return { name: el?.lastName, w: el?.weight, att: el?.attempt, rec: el?.recordAttempt, comp: el?.competitionName, nextG: el?.nextGroup };
    });
    console.log(`+${t+2}s  h3="${h3}"  btns=${JSON.stringify(btns)}  menus=${JSON.stringify(menus)}`);
    console.log(`       display=${JSON.stringify(st)}`);
  }

  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
