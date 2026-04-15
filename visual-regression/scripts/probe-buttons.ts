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
  }

  const all = await p.evaluate(`(() => {
    const seen = [];
    function visit(el) {
      const tag = el.tagName.toLowerCase();
      if (tag.indexOf('button') >= 0 || tag === 'button' || el.getAttribute('role') === 'button') {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          seen.push({
            tag,
            id: el.id,
            cls: (el.className || '').toString().slice(0, 40),
            text: (el.textContent || '').trim().slice(0, 40),
            title: el.getAttribute('title') || '',
            ariaLabel: el.getAttribute('aria-label') || '',
            theme: el.getAttribute('theme') || '',
            x: Math.round(rect.x), y: Math.round(rect.y),
            w: Math.round(rect.width), h: Math.round(rect.height),
          });
        }
      }
      if (el.shadowRoot) Array.from(el.shadowRoot.children).forEach(visit);
      Array.from(el.children).forEach(visit);
    }
    visit(document.body);
    return seen;
  })()`);
  console.log(JSON.stringify(all, null, 2));
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
