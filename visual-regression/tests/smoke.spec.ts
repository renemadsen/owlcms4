import { test, expect } from '@playwright/test';
import * as path from 'path';
import { OwlcmsDriver } from '../src/owlcms-driver';

const repoRoot = path.resolve(__dirname, '..', '..');
const owlcms = new OwlcmsDriver({ repoRoot });

test.beforeAll(async () => {
  await owlcms.start();
});

test.afterAll(async () => {
  await owlcms.stop();
});

test('owlcms homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/OWLCMS/);
});
