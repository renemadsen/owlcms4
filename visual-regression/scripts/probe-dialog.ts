import { chromium } from '@playwright/test';

async function main() {
  const b = await chromium.launch();
  const p = await b.newContext({ viewport: { width: 1920, height: 1080 } }).then(c => c.newPage());
  await p.goto('http://localhost:8080/displays/topsinclair?fop=A', { waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);
  // Find anything with text Luk
  const luks = p.getByText(/^Luk$/);
  const c1 = await luks.count();
  console.log('getByText Luk count:', c1);
  for (let i = 0; i < c1; i++) {
    const info = await luks.nth(i).evaluate((el) => ({
      tag: el.tagName,
      visible: (el as HTMLElement).offsetParent !== null || el.getClientRects().length > 0,
      parentTag: el.parentElement?.tagName,
    })).catch(e => 'err:' + e.message);
    console.log(`  [${i}]`, info);
  }
  // Try role button
  const btns = p.getByRole('button', { name: /Luk/ });
  console.log('role=button name=Luk count:', await btns.count());
  // Try vaadin-button via js
  const vbtns = await p.evaluate(() => {
    const all = Array.from(document.querySelectorAll('vaadin-button'));
    return all.map(el => ({ text: el.textContent?.trim(), visible: (el as HTMLElement).offsetParent !== null }));
  });
  console.log('vaadin-buttons:', JSON.stringify(vbtns));
  // Overlays
  const overlays = await p.evaluate(() => Array.from(document.querySelectorAll('vaadin-dialog-overlay, vaadin-confirm-dialog-overlay')).map(el => el.tagName));
  console.log('dialog overlays:', overlays);
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
