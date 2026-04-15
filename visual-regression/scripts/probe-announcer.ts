import { chromium } from '@playwright/test';

async function main() {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8080/lifting/announcer?fop=A', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const gruppe = p.getByRole('menuitem', { name: /Gruppe/ }).first();
  await gruppe.click();
  await p.waitForTimeout(1500);
  const overlays = await p.locator('vaadin-menu-bar-overlay').count();
  console.log('overlays:', overlays);
  for (let i = 0; i < overlays; i++) {
    const html = await p.locator('vaadin-menu-bar-overlay').nth(i).innerHTML();
    console.log(`-- overlay ${i} --`);
    console.log(html.slice(0, 3000));
  }
  // Try any visible element containing Gruppe 2
  const matches = p.locator('text=Gruppe 2');
  const cnt = await matches.count();
  console.log('text=Gruppe 2 count:', cnt);
  for (let i = 0; i < cnt; i++) {
    const vis = await matches.nth(i).isVisible().catch(() => false);
    const tag = await matches.nth(i).evaluate((el) => el.tagName).catch(() => '?');
    console.log(`  [${i}] visible=${vis} tag=${tag}`);
  }
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
