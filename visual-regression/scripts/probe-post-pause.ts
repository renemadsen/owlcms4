import { chromium } from '@playwright/test';
async function main() {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8080/lifting/announcer?fop=A', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  const items = await p.evaluate(() => Array.from(document.querySelectorAll('vaadin-menu-bar-button, vaadin-menu-bar-item')).map(el => ({ tag: el.tagName, text: el.textContent?.trim().slice(0, 80), visible: (el as HTMLElement).offsetParent !== null })));
  console.log('MENU:', JSON.stringify(items, null, 2));
  const all = await p.evaluate(() => Array.from(document.querySelectorAll('button, vaadin-button, [role="button"]')).filter(el => (el as HTMLElement).offsetParent !== null).map(el => ({ tag: el.tagName, role: el.getAttribute('role'), text: el.textContent?.trim().slice(0, 60) })));
  console.log('VISIBLE BTNS:', JSON.stringify(all, null, 2));
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
