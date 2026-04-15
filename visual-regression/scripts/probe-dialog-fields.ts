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
  if (await begynd.count() > 0) { await begynd.click({ timeout: 5000 }).catch(() => {}); await p.waitForTimeout(3000); }

  const cells = await p.evaluate(`(() => Array.from(document.querySelectorAll('vaadin-grid-cell-content')).map(el => (el.textContent || '').trim()).filter(Boolean))()`);
  console.log('cells:', JSON.stringify(cells));
  // Click first non-empty data cell that looks like a name (after header row of 8 items)
  const name = (cells as string[]).slice(8).find(c => /^[A-ZÆØÅ][a-zæøå]/.test(c));
  console.log('clicking:', name);
  await p.locator('vaadin-grid-cell-content').filter({ hasText: new RegExp(`^${name}$`) }).first().click({ timeout: 5000 });
  await p.waitForTimeout(2000);

  const fields = await p.evaluate(`(() => {
    const overlay = document.querySelector('vaadin-dialog-overlay');
    if (!overlay) return { err: 'no overlay' };
    const root = overlay.shadowRoot || overlay;
    // Walk whole overlay including shadow
    const out = [];
    function visit(el) {
      const tag = el.tagName ? el.tagName.toLowerCase() : '';
      if (tag.includes('text-field') || tag.includes('number-field') || tag.includes('integer-field')) {
        const rect = el.getBoundingClientRect();
        // Find nearest label
        let label = '';
        const labelEl = el.querySelector('label') || el.shadowRoot?.querySelector('label');
        if (labelEl) label = (labelEl.textContent || '').trim();
        out.push({
          tag,
          id: el.id,
          label: label.slice(0, 40),
          value: el.value,
          x: Math.round(rect.x), y: Math.round(rect.y),
          w: Math.round(rect.width),
        });
      }
      if (el.shadowRoot) Array.from(el.shadowRoot.children).forEach(visit);
      Array.from(el.children || []).forEach(visit);
    }
    visit(overlay);
    return out;
  })()`);
  console.log(JSON.stringify(fields, null, 2));
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
