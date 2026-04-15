import { chromium } from '@playwright/test';

async function main() {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8080/lifting/announcer?fop=A', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);

  // Deselect first, then select Gruppe 2 (to force a fresh selection regardless of prior state)
  await p.getByRole('menuitem', { name: /Gruppe/ }).first().click();
  await p.waitForTimeout(800);
  try {
    await p.locator('vaadin-menu-bar-overlay vaadin-menu-bar-item').filter({ hasText: 'Ingen gruppe' }).first().click({ timeout: 3000 });
    await p.waitForTimeout(3000);
  } catch { await p.keyboard.press('Escape'); }

  await p.getByRole('menuitem', { name: /Gruppe/ }).first().click();
  await p.waitForTimeout(800);
  await p.locator('vaadin-menu-bar-overlay vaadin-menu-bar-item').filter({ hasText: 'Gruppe 2' }).first().click();
  await p.waitForTimeout(6000);
  const h3 = await p.locator('h3').first().textContent().catch(() => null);
  console.log('H3 after select:', h3);

  // Inspect the lifting-order grid
  // Wait longer & inspect all cell-content with non-empty text
  await p.waitForTimeout(3000);
  const allCells = await p.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('vaadin-grid-cell-content'));
    return cells.map((el, i) => ({
      i,
      text: (el.textContent || '').trim().slice(0, 50),
      slot: (el as HTMLElement).getAttribute('slot') || '',
    })).filter(c => c.text.length > 0);
  });
  console.log('NON-EMPTY CELLS:', JSON.stringify(allCells, null, 2));

  const heading = await p.locator('h3').first().textContent().catch(() => null);
  console.log('H3 heading:', heading);

  // Use top-level selector (cell-content is slotted OUTSIDE vaadin-grid)
  const cells = p.locator('vaadin-grid-cell-content');
  const total = await cells.count();
  console.log('\ntop-level cell-content count:', total);
  for (let i = 0; i < Math.min(total, 24); i++) {
    const txt = await cells.nth(i).textContent().catch(() => '?');
    console.log(`  [${i}] "${(txt || '').trim().slice(0, 40)}"`);
  }

  // Find first cell with non-empty text that isn't a header (skip first 8)
  let targetIdx = -1;
  for (let i = 8; i < total; i++) {
    const t = (await cells.nth(i).textContent().catch(() => '')) || '';
    if (t.trim().length > 0) { targetIdx = i; break; }
  }
  console.log('\nfirst non-empty data cell idx:', targetIdx);
  console.log(`\n== clicking cell [${targetIdx}] ==`);
  try {
    await cells.nth(targetIdx).click({ timeout: 3000 });
    await p.waitForTimeout(2000);
    const overlays = await p.locator('vaadin-dialog-overlay').count();
    console.log('dialog overlays after click:', overlays);
    if (overlays > 0) {
      const fields = await p.evaluate(() => {
        const overlay = document.querySelector('vaadin-dialog-overlay');
        if (!overlay) return null;
        const inputs = Array.from(overlay.querySelectorAll('vaadin-text-field, vaadin-number-field, vaadin-integer-field, input'));
        return inputs.map(el => ({
          tag: el.tagName,
          id: (el as HTMLElement).id,
          label: el.getAttribute('label'),
          name: el.getAttribute('name'),
          value: (el as HTMLInputElement).value,
        }));
      });
      console.log('DIALOG FIELDS:', JSON.stringify(fields, null, 2));

      // Structured probe: find form items with labels
      const formItems = await p.evaluate(() => {
        const overlay = document.querySelector('vaadin-dialog-overlay');
        if (!overlay) return null;
        // find all vaadin-form-item, vaadin-horizontal-layout containers with label text
        const items = Array.from(overlay.querySelectorAll('vaadin-form-item, vaadin-form-layout > *'));
        return items.slice(0, 30).map(el => {
          const label = el.querySelector('[slot="label"], label')?.textContent?.trim();
          const field = el.querySelector('vaadin-text-field, vaadin-number-field, vaadin-integer-field');
          return {
            tag: el.tagName,
            label,
            fieldTag: field?.tagName,
            fieldId: (field as HTMLElement | null)?.id,
          };
        });
      });
      console.log('FORM ITEMS:', JSON.stringify(formItems, null, 2));

      // Also inspect the dialog title / all text
      const title = await p.evaluate(() => {
        const overlay = document.querySelector('vaadin-dialog-overlay');
        return overlay?.querySelector('h2, h3, h4, [slot="title"]')?.textContent?.trim();
      });
      console.log('DIALOG TITLE:', title);

      // Full field map: all vaadin-text-field + context
      const fieldMap = await p.evaluate(() => {
        const overlay = document.querySelector('vaadin-dialog-overlay');
        if (!overlay) return null;
        const fields = Array.from(overlay.querySelectorAll('vaadin-text-field, vaadin-number-field, vaadin-integer-field'));
        return fields.map((f, i) => {
          // Walk up to find a cell label/header
          let ctx = '';
          let parent: Element | null = f.parentElement;
          for (let d = 0; d < 6 && parent; d++) {
            const prev = parent.previousElementSibling;
            if (prev && prev.textContent) { ctx = prev.textContent.trim().slice(0, 30); break; }
            parent = parent.parentElement;
          }
          const rect = (f as HTMLElement).getBoundingClientRect();
          return {
            i, tag: f.tagName, id: (f as HTMLElement).id,
            value: (f as any).value,
            visible: rect.width > 0 && rect.height > 0,
            x: Math.round(rect.x), y: Math.round(rect.y),
            ctx,
          };
        }).filter(f => f.visible);
      });
      console.log('VISIBLE FIELDS:', JSON.stringify(fieldMap, null, 2));

      // Set cj1 declaration (2_4) to 150 and click Opdatér
      console.log('\n== setting 2_4 to 150 ==');
      const cj1 = p.locator('vaadin-text-field#\\32_4').first();
      await cj1.click();
      await cj1.locator('input').first().fill('150');
      await p.waitForTimeout(500);
      await p.getByRole('button', { name: /^Opdatér$/ }).first().click({ timeout: 5000 });
      await p.waitForTimeout(3000);
      const overlaysAfter = await p.locator('vaadin-dialog-overlay').count();
      console.log('overlays after update:', overlaysAfter);
      const buttons = await p.evaluate(() => {
        const overlay = document.querySelector('vaadin-dialog-overlay');
        if (!overlay) return null;
        return Array.from(overlay.querySelectorAll('vaadin-button, button')).map(el => ({
          text: (el.textContent || '').trim().slice(0, 40),
          theme: el.getAttribute('theme'),
        }));
      });
      console.log('DIALOG BUTTONS:', JSON.stringify(buttons, null, 2));
    }
  } catch (e: any) {
    console.log('click failed:', e.message);
  }

  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
