# DVF Visual Regression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a visual-regression pipeline that captures golden screenshots of all 11 DVF-customized displays, diffs them on every PR inside a pinned Docker image, and makes upstream merges fast and safe.

**Architecture:** A new top-level `visual-regression/` TypeScript Playwright Test module. A two-browser-context pattern: an admin context drives the owlcms announcer UI to put FOP A into deterministic states (WAIT, CURRENT_ATHLETE with clock frozen by text-poll + pause, decision-visible, SESSION_DONE); a display context takes the screenshots. Owlcms is spawned as a subprocess from the test runner after importing a committed `fixtures/golden-competition.zip` into a fresh H2. All runs (local + CI) happen inside `dvfdocker/visual-regression-runner:latest` (derived from `mcr.microsoft.com/playwright:v1.50.0-noble` + JRE 17) so rendering is byte-identical.

**Tech Stack:** Node.js 20, TypeScript 5, `@playwright/test` 1.50.0, Docker, GitHub Actions, existing owlcms build (Maven, Java 17).

**Spec reference:** `docs/superpowers/specs/2026-04-10-visual-regression-design.md`

---

## File Structure

```
visual-regression/
├── package.json
├── package-lock.json
├── tsconfig.json
├── playwright.config.ts
├── Dockerfile.visual-regression
├── .gitignore
├── README.md
├── fixtures/
│   └── golden-competition.zip            # committed binary (Task 3)
├── src/
│   ├── owlcms-driver.ts                  # subprocess spawner (Task 4)
│   ├── fop-driver.ts                     # admin-UI state driver (Tasks 6,7,9)
│   ├── display-matrix.ts                 # (display × state) test data (Task 10)
│   └── selectors.ts                      # admin-UI selectors (Task 6)
└── tests/
    ├── smoke.spec.ts                     # pipeline proof (Task 5)
    ├── displays.spec.ts                  # full matrix (Task 10)
    └── __screenshots__/                  # golden PNGs, committed

scripts/
└── visual-test.sh                        # docker wrapper (Task 11)

.github/workflows/
└── visual-regression.yml                 # CI job (Task 12)

CLAUDE.md                                  # append workflow docs (Task 13)
```

---

## Task 1: Scaffold visual-regression module

**Files:**
- Create: `visual-regression/package.json`
- Create: `visual-regression/tsconfig.json`
- Create: `visual-regression/playwright.config.ts`
- Create: `visual-regression/.gitignore`
- Create: `visual-regression/README.md`
- Create: `visual-regression/fixtures/.gitkeep`
- Create: `visual-regression/src/.gitkeep`
- Create: `visual-regression/tests/.gitkeep`

- [ ] **Step 1: Create directory skeleton**

```bash
mkdir -p visual-regression/{fixtures,src,tests}
touch visual-regression/fixtures/.gitkeep visual-regression/src/.gitkeep visual-regression/tests/.gitkeep
```

- [ ] **Step 2: Write `visual-regression/package.json`**

```json
{
  "name": "owlcms-visual-regression",
  "version": "0.1.0",
  "private": true,
  "description": "Visual regression tests for DVF owlcms4 displays",
  "scripts": {
    "test": "playwright test",
    "test:update": "playwright test --update-snapshots",
    "report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "1.50.0",
    "@types/node": "20.11.0",
    "typescript": "5.3.3"
  }
}
```

- [ ] **Step 3: Write `visual-regression/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["node"]
  },
  "include": ["src/**/*", "tests/**/*", "playwright.config.ts"]
}
```

- [ ] **Step 4: Write `visual-regression/playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // tests share one owlcms instance
  workers: 1,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixels: 0,
      threshold: 0,
      animations: 'disabled',
    },
  },
  use: {
    baseURL: 'http://localhost:8080',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

- [ ] **Step 5: Write `visual-regression/.gitignore`**

```
node_modules/
playwright-report/
test-results/
```

- [ ] **Step 6: Write `visual-regression/README.md`**

```markdown
# DVF owlcms4 Visual Regression

Golden-image tests for the 11 DVF-customized display views. All runs happen inside a pinned Docker image so rendering is byte-identical between local and CI.

## Prerequisites

- Docker
- Built owlcms.jar (`mvn -pl owlcms -am package -P production -Dmaven.test.skip=true -q` from repo root)

## Run tests

From the repo root:

```bash
./scripts/visual-test.sh            # run, fail on any diff
./scripts/visual-test.sh update     # regenerate baselines
./scripts/visual-test.sh report     # open HTML report from last run
```

## Update baselines

Only after visually inspecting every diff and confirming it is an intentional change. Always commit baseline updates in a dedicated commit:

```bash
./scripts/visual-test.sh update
git add visual-regression/tests/__screenshots__
git commit -m "visual: accept new baselines from <reason>"
```

## Fixture

`fixtures/golden-competition.zip` is a hand-built owlcms competition exported via the admin UI. To regenerate it, see `docs/superpowers/specs/2026-04-10-visual-regression-design.md`.
```

- [ ] **Step 7: Verify file structure**

Run:
```bash
ls -la visual-regression/
```

Expected: `package.json`, `tsconfig.json`, `playwright.config.ts`, `.gitignore`, `README.md`, `fixtures/`, `src/`, `tests/`.

- [ ] **Step 8: Commit**

```bash
git add visual-regression/
git commit -m "visual-regression: scaffold TypeScript Playwright Test module"
```

---

## Task 2: Dockerfile for the pinned runner

**Files:**
- Create: `visual-regression/Dockerfile.visual-regression`

This image is what every test run (local and CI) executes inside. It's published to DockerHub as `dvfdocker/visual-regression-runner:latest`.

- [ ] **Step 1: Write `visual-regression/Dockerfile.visual-regression`**

```dockerfile
FROM mcr.microsoft.com/playwright:v1.50.0-noble

RUN apt-get update \
 && apt-get install -y --no-install-recommends openjdk-17-jre-headless \
 && rm -rf /var/lib/apt/lists/*

# Sanity check: Java and Node versions baked in
RUN java -version && node --version && npx --version
```

- [ ] **Step 2: Build the image locally**

Run:
```bash
docker build -f visual-regression/Dockerfile.visual-regression -t dvfdocker/visual-regression-runner:latest visual-regression/
```

Expected: image builds successfully. Final layer prints Java 17 and Node v20.x.

- [ ] **Step 3: Verify the image can run Playwright and Java**

Run:
```bash
docker run --rm dvfdocker/visual-regression-runner:latest bash -c "java -version && node --version && npx playwright --version"
```

Expected: openjdk version "17", node v20.x, Version 1.50.0.

- [ ] **Step 4: Push the image to DockerHub** (requires `docker login` as dvfdocker)

Run:
```bash
docker push dvfdocker/visual-regression-runner:latest
```

If push fails because you're not logged in, run `docker login` first. If the DockerHub repository doesn't exist yet, create it at https://hub.docker.com/repositories/dvfdocker before pushing.

Expected: successful push, digest printed.

- [ ] **Step 5: Commit**

```bash
git add visual-regression/Dockerfile.visual-regression
git commit -m "visual-regression: pinned Docker runner image (Playwright 1.50 + JRE 17)"
```

---

## Task 3: Create golden fixture zip (manual UI step)

**Files:**
- Create: `visual-regression/fixtures/golden-competition.zip` (binary, committed)

This is a manual one-time step because there is no programmatic owlcms competition builder — the supported path is the admin UI export.

- [ ] **Step 1: Start a clean owlcms instance**

Run:
```bash
cd owlcms/target/owlcms
rm -f database/owlcms-h2v2.*
OWLCMS_ENABLEEMBEDDEDMQTT=false java -jar owlcms.jar &
```

Wait until `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/` prints `200`.

- [ ] **Step 2: Build the Golden competition in the UI**

Navigate in a browser to `http://localhost:8080/preparation`. Create:

1. **Competition** (Forbered konkurrence → Konkurrence opsætning): Name "Golden", set championship to "Open".
2. **Age Groups**: Use default Open M / Open F categories.
3. **Athletes** (Deltagere → Tilføj): create 8 athletes:
   - 4 women: Alice Andersen (AK Viking, 55kg, entry total 150), Berit Berg (AK Thor, 59kg, 145), Clara Clausen (AK Viking, 64kg, 155), Dina Dam (AK Thor, 71kg, 140).
   - 4 men: Erik Eriksen (AK Viking, 73kg, 250), Frode Frandsen (AK Thor, 81kg, 245), Gustav Gade (AK Viking, 89kg, 255), Henrik Holm (AK Thor, 96kg, 240).
4. **Groups** (Grupper): create `G1` containing the 4 women, `G2` containing the 4 men.
5. **Records** (Rekorder): add one record, e.g. Snatch 100 Open F 55kg held by "Test Athlete" from year 2020.

- [ ] **Step 3: Verify the competition is non-empty on the displays**

Open each of the 11 display URLs and visually confirm each shows either a "waiting for next group" state or populated data:

```
http://localhost:8080/displays/publicScoreboard?fop=A
http://localhost:8080/displays/currentathlete?fop=A
http://localhost:8080/displays/topsinclair?ad=Open
http://localhost:8080/displays/topteams?ad=Open
http://localhost:8080/displays/topteamsinclair?ad=Open
http://localhost:8080/displays/attemptBoard?fop=A
http://localhost:8080/displays/athleteFacingDecision?fop=A
http://localhost:8080/displays/publicStartList?fop=A
http://localhost:8080/displays/resultsMedals?fop=A
http://localhost:8080/displays/resultsLeadersRanks?fop=A
http://localhost:8080/displays/resultsLeaders?fop=A
```

Expected: all 11 loads without Vaadin errors in the browser console.

- [ ] **Step 4: Export the competition to a zip**

In the owlcms admin UI: Forbered konkurrence → "Eksporter konkurrence" (or equivalent "Download owlcms-system ZIP" option). Save the resulting file.

- [ ] **Step 5: Move the exported zip into the fixtures directory**

Run:
```bash
mv ~/Downloads/*.zip visual-regression/fixtures/golden-competition.zip
ls -la visual-regression/fixtures/golden-competition.zip
```

Expected: file exists and is nonzero (typically 10–200 KB).

- [ ] **Step 6: Shut down the owlcms instance used to create the fixture**

Run:
```bash
pkill -f 'owlcms.jar'
```

- [ ] **Step 7: Commit the fixture**

```bash
git add visual-regression/fixtures/golden-competition.zip
git commit -m "visual-regression: add golden-competition.zip fixture"
```

---

## Task 4: owlcms-driver — subprocess lifecycle

**Files:**
- Create: `visual-regression/src/owlcms-driver.ts`

Responsibility: start a fresh owlcms subprocess with a clean H2 database, wait for it to listen on :8080, and stop it cleanly. No UI automation — that lives in `fop-driver.ts`.

- [ ] **Step 1: Write `visual-regression/src/owlcms-driver.ts`**

```ts
import { spawn, ChildProcess } from 'child_process';
import { rmSync, existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import * as http from 'http';

export interface OwlcmsDriverOptions {
  /** Absolute path to the repo root. */
  repoRoot: string;
  /** How long to wait for :8080 to respond, in ms. */
  startupTimeoutMs?: number;
}

export class OwlcmsDriver {
  private proc: ChildProcess | null = null;
  private readonly repoRoot: string;
  private readonly startupTimeoutMs: number;
  private readonly workDir: string;

  constructor(opts: OwlcmsDriverOptions) {
    this.repoRoot = opts.repoRoot;
    this.startupTimeoutMs = opts.startupTimeoutMs ?? 60_000;
    this.workDir = path.join(this.repoRoot, 'owlcms', 'target', 'owlcms');
  }

  async start(): Promise<void> {
    if (this.proc) {
      throw new Error('owlcms already started');
    }

    const jar = path.join(this.workDir, 'owlcms.jar');
    if (!existsSync(jar)) {
      throw new Error(`owlcms.jar not found at ${jar}. Run: mvn -pl owlcms -am package -P production -Dmaven.test.skip=true -q`);
    }

    // Wipe H2 database so every suite starts clean.
    const dbDir = path.join(this.workDir, 'database');
    if (existsSync(dbDir)) {
      rmSync(dbDir, { recursive: true, force: true });
    }
    mkdirSync(dbDir, { recursive: true });

    this.proc = spawn(
      'java',
      ['-jar', 'owlcms.jar'],
      {
        cwd: this.workDir,
        env: { ...process.env, OWLCMS_ENABLEEMBEDDEDMQTT: 'false' },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    this.proc.stdout?.on('data', (chunk) => {
      process.stdout.write(`[owlcms] ${chunk}`);
    });
    this.proc.stderr?.on('data', (chunk) => {
      process.stderr.write(`[owlcms] ${chunk}`);
    });

    this.proc.on('exit', (code, signal) => {
      console.log(`[owlcms-driver] subprocess exited code=${code} signal=${signal}`);
      this.proc = null;
    });

    await this.waitForPort();
  }

  async stop(): Promise<void> {
    if (!this.proc) return;
    const p = this.proc;
    this.proc = null;
    p.kill('SIGTERM');
    await new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        p.kill('SIGKILL');
        resolve();
      }, 5_000);
      p.once('exit', () => {
        clearTimeout(t);
        resolve();
      });
    });
  }

  private async waitForPort(): Promise<void> {
    const deadline = Date.now() + this.startupTimeoutMs;
    while (Date.now() < deadline) {
      if (await this.isUp()) return;
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`owlcms did not respond on :8080 within ${this.startupTimeoutMs}ms`);
  }

  private isUp(): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get('http://localhost:8080/', (res) => {
        res.resume();
        resolve((res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 500);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(1000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }
}
```

- [ ] **Step 2: Sanity-typecheck the file**

Run (from repo root):
```bash
cd visual-regression && npx tsc --noEmit && cd ..
```

Expected: no output (clean typecheck). If `npx tsc` is unavailable because `npm install` hasn't run yet, run `cd visual-regression && npm install && cd ..` first.

- [ ] **Step 3: Commit**

```bash
git add visual-regression/src/owlcms-driver.ts visual-regression/package-lock.json
git commit -m "visual-regression: owlcms-driver subprocess launcher"
```

---

## Task 5: Smoke test — prove owlcms-driver works end-to-end

**Files:**
- Create: `visual-regression/tests/smoke.spec.ts`

This test is disposable scaffolding that proves the subprocess lifecycle. It boots owlcms, takes a single screenshot of the homepage, and shuts down. It does NOT use the fixture and does NOT drive the UI. If this works, Task 6 can add UI automation on top.

- [ ] **Step 1: Write `visual-regression/tests/smoke.spec.ts`**

```ts
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
```

- [ ] **Step 2: Install node dependencies**

Run:
```bash
cd visual-regression && npm install && cd ..
```

Expected: `node_modules/` populated, `package-lock.json` written. No install errors.

- [ ] **Step 3: Ensure owlcms.jar exists**

Run:
```bash
ls -la owlcms/target/owlcms/owlcms.jar
```

If missing, run:
```bash
export PATH="$HOME/.local/share/JetBrains/Toolbox/apps/intellij-idea-community-edition/plugins/maven/lib/maven3/bin:$PATH"
mvn -pl owlcms -am package -P production -Dmaven.test.skip=true -q
```

- [ ] **Step 4: Run the smoke test OUTSIDE Docker for fast iteration**

Run:
```bash
cd visual-regression && npx playwright test tests/smoke.spec.ts && cd ..
```

Expected: `1 passed`. Output will include `[owlcms]` log lines during startup.

If it fails because Chromium isn't installed locally, install once:
```bash
cd visual-regression && npx playwright install chromium && cd ..
```

- [ ] **Step 5: Commit**

```bash
git add visual-regression/tests/smoke.spec.ts visual-regression/package-lock.json
git commit -m "visual-regression: smoke test verifies owlcms-driver lifecycle"
```

---

## Task 6: Selectors + fop-driver — fixture import and FOP reset

**Files:**
- Create: `visual-regression/src/selectors.ts`
- Create: `visual-regression/src/fop-driver.ts`
- Modify: `visual-regression/tests/smoke.spec.ts` (extend to cover import + reset)

Responsibility of `fop-driver.ts`: encapsulate all admin-UI flows. Only `importGoldenFixture()` and `resetFopState()` in this task; timer/decision primitives come in later tasks.

**Important:** The admin-UI selectors in `selectors.ts` are best-effort starting points based on the known DVF admin flow (Vaadin + Danish labels). If a selector fails at runtime, update `selectors.ts` — that's the single source of truth to keep the driver stable.

- [ ] **Step 1: Write `visual-regression/src/selectors.ts`**

```ts
/**
 * Selectors for the owlcms admin UI. Grouped by the admin page they belong to.
 * Update this file when upstream changes the UI — it is the only place driver
 * code references DOM structure.
 */
export const SELECTORS = {
  // Home / preparation landing
  preparationLink: 'a[href="preparation"]',

  // Import zip flow (Forbered konkurrence → Importér fra andet owlcms-system)
  importMenuButton: 'vaadin-button:has-text("Importér fra andet owlcms-system")',
  importFileInput: 'input[type="file"]',
  importConfirmButton: 'vaadin-button:has-text("Importér")',
  importSuccessToast: 'vaadin-notification-card:has-text("Import")',

  // Announcer / lifting page (/lifting?fop=A)
  announcerGroupCombo: 'vaadin-combo-box[placeholder="Gruppe"]',
  announcerStartLiftingButton: 'vaadin-button:has-text("Start")',
  announcerPauseButton: 'vaadin-button:has-text("Pause")',
  announcerStopLiftingButton: 'vaadin-button:has-text("Stop")',

  // Display-side (inside shadow DOM of various -template elements)
  athleteTimerInResults: 'results-template >>> .athleteTimer',
} as const;
```

- [ ] **Step 2: Write `visual-regression/src/fop-driver.ts`**

```ts
import { BrowserContext, Page } from '@playwright/test';
import * as path from 'path';
import { SELECTORS } from './selectors';

export interface FopDriverOptions {
  /** Absolute path to the fixture zip. */
  fixtureZipPath: string;
  /** Context used for admin-UI automation. */
  adminContext: BrowserContext;
}

export class FopDriver {
  private readonly fixtureZipPath: string;
  private readonly adminContext: BrowserContext;
  private adminPage: Page | null = null;

  constructor(opts: FopDriverOptions) {
    this.fixtureZipPath = opts.fixtureZipPath;
    this.adminContext = opts.adminContext;
  }

  private async getAdminPage(): Promise<Page> {
    if (!this.adminPage) {
      this.adminPage = await this.adminContext.newPage();
    }
    return this.adminPage;
  }

  /**
   * Suite-level: import golden-competition.zip via the admin UI.
   * Must be called once in beforeAll after owlcms has started.
   */
  async importGoldenFixture(): Promise<void> {
    const page = await this.getAdminPage();
    await page.goto('/preparation');
    await page.locator(SELECTORS.importMenuButton).click();

    const fileInput = page.locator(SELECTORS.importFileInput);
    await fileInput.setInputFiles(this.fixtureZipPath);

    await page.locator(SELECTORS.importConfirmButton).click();
    await page.locator(SELECTORS.importSuccessToast).waitFor({ state: 'visible', timeout: 30_000 });
  }

  /**
   * Per-test: return FOP A to INACTIVE (no group selected) so the next test
   * starts from a known baseline. Does NOT re-import the fixture.
   */
  async resetFopState(): Promise<void> {
    const page = await this.getAdminPage();
    await page.goto('/lifting?fop=A');
    // Clicking "Stop" when no group is running is a no-op;
    // when a group is running it returns FOP to INACTIVE.
    const stopBtn = page.locator(SELECTORS.announcerStopLiftingButton);
    if (await stopBtn.isVisible().catch(() => false)) {
      await stopBtn.click();
    }
    const combo = page.locator(SELECTORS.announcerGroupCombo);
    if (await combo.isVisible().catch(() => false)) {
      await combo.evaluate((el: any) => { el.value = ''; });
    }
  }
}

export function defaultFixturePath(repoRoot: string): string {
  return path.join(repoRoot, 'visual-regression', 'fixtures', 'golden-competition.zip');
}
```

- [ ] **Step 3: Extend `visual-regression/tests/smoke.spec.ts` to import the fixture**

Replace the file contents with:

```ts
import { test, expect, chromium, BrowserContext } from '@playwright/test';
import * as path from 'path';
import { OwlcmsDriver } from '../src/owlcms-driver';
import { FopDriver, defaultFixturePath } from '../src/fop-driver';

const repoRoot = path.resolve(__dirname, '..', '..');
const owlcms = new OwlcmsDriver({ repoRoot });

let adminContext: BrowserContext;
let fop: FopDriver;

test.beforeAll(async ({ browser }) => {
  await owlcms.start();
  adminContext = await browser.newContext();
  fop = new FopDriver({
    fixtureZipPath: defaultFixturePath(repoRoot),
    adminContext,
  });
  await fop.importGoldenFixture();
});

test.afterAll(async () => {
  await adminContext?.close();
  await owlcms.stop();
});

test.beforeEach(async () => {
  await fop.resetFopState();
});

test('owlcms homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/OWLCMS/);
});

test('fixture contains groups after import', async ({ page }) => {
  await page.goto('/preparation');
  // At least one group should exist from the Golden fixture.
  await expect(page.getByText(/G1|G2/).first()).toBeVisible({ timeout: 10_000 });
});
```

- [ ] **Step 4: Run the updated smoke test locally**

Run:
```bash
cd visual-regression && npx playwright test tests/smoke.spec.ts && cd ..
```

Expected: `2 passed`. If the import step fails with "selector not found" errors, open the Playwright trace viewer:
```bash
cd visual-regression && npx playwright show-trace test-results/*/trace.zip && cd ..
```
Then update `src/selectors.ts` to match the real DOM.

- [ ] **Step 5: Commit**

```bash
git add visual-regression/src/selectors.ts visual-regression/src/fop-driver.ts visual-regression/tests/smoke.spec.ts
git commit -m "visual-regression: fixture import + FOP reset via admin UI"
```

---

## Task 7: First real screenshot test — publicScoreboard WAIT

**Files:**
- Create: `visual-regression/tests/displays.spec.ts`

This is the pipeline proof for real screenshot diffing. One test, one display, one state. If `toHaveScreenshot()` produces a committed baseline and diffs clean on the second run, everything downstream is just data expansion.

- [ ] **Step 1: Write `visual-regression/tests/displays.spec.ts`**

```ts
import { test, expect, BrowserContext } from '@playwright/test';
import * as path from 'path';
import { OwlcmsDriver } from '../src/owlcms-driver';
import { FopDriver, defaultFixturePath } from '../src/fop-driver';

const repoRoot = path.resolve(__dirname, '..', '..');
const owlcms = new OwlcmsDriver({ repoRoot });

let adminContext: BrowserContext;
let fop: FopDriver;

test.beforeAll(async ({ browser }) => {
  await owlcms.start();
  adminContext = await browser.newContext();
  fop = new FopDriver({
    fixtureZipPath: defaultFixturePath(repoRoot),
    adminContext,
  });
  await fop.importGoldenFixture();
});

test.afterAll(async () => {
  await adminContext?.close();
  await owlcms.stop();
});

test.beforeEach(async () => {
  await fop.resetFopState();
});

test('publicScoreboard WAIT', async ({ page }) => {
  await page.goto('/displays/publicScoreboard?fop=A');
  // Give the web component a moment to render "Waiting for next group".
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await expect(page).toHaveScreenshot('publicScoreboard-wait.png', {
    fullPage: false,
  });
});
```

- [ ] **Step 2: Run it once to generate the baseline**

Run:
```bash
cd visual-regression && npx playwright test tests/displays.spec.ts --update-snapshots && cd ..
```

Expected: `1 passed`. A new file appears: `visual-regression/tests/__screenshots__/displays.spec.ts/publicScoreboard-wait-chromium.png`.

- [ ] **Step 3: Run it again with no changes and confirm it diffs clean**

Run:
```bash
cd visual-regression && npx playwright test tests/displays.spec.ts && cd ..
```

Expected: `1 passed`, no diff.

- [ ] **Step 4: Commit**

```bash
git add visual-regression/tests/displays.spec.ts visual-regression/tests/__screenshots__
git commit -m "visual-regression: first golden image (publicScoreboard WAIT)"
```

---

## Task 8: fop-driver — startLifting + pauseAtTime

**Files:**
- Modify: `visual-regression/src/fop-driver.ts`
- Modify: `visual-regression/tests/displays.spec.ts` (add CURRENT_ATHLETE test)

Adds the deterministic clock-freeze primitive so we can screenshot a frozen lifting state.

- [ ] **Step 1: Add `selectGroup`, `startLifting`, and `pauseAtTime` to `fop-driver.ts`**

Replace the class body in `visual-regression/src/fop-driver.ts` with:

```ts
import { BrowserContext, Page } from '@playwright/test';
import * as path from 'path';
import { SELECTORS } from './selectors';

export interface FopDriverOptions {
  fixtureZipPath: string;
  adminContext: BrowserContext;
  /** Page used for polling display-side state (e.g. timer text). */
  displayPage: Page;
}

export class FopDriver {
  private readonly fixtureZipPath: string;
  private readonly adminContext: BrowserContext;
  private readonly displayPage: Page;
  private adminPage: Page | null = null;

  constructor(opts: FopDriverOptions) {
    this.fixtureZipPath = opts.fixtureZipPath;
    this.adminContext = opts.adminContext;
    this.displayPage = opts.displayPage;
  }

  private async getAdminPage(): Promise<Page> {
    if (!this.adminPage) {
      this.adminPage = await this.adminContext.newPage();
    }
    return this.adminPage;
  }

  async importGoldenFixture(): Promise<void> {
    const page = await this.getAdminPage();
    await page.goto('/preparation');
    await page.locator(SELECTORS.importMenuButton).click();
    await page.locator(SELECTORS.importFileInput).setInputFiles(this.fixtureZipPath);
    await page.locator(SELECTORS.importConfirmButton).click();
    await page.locator(SELECTORS.importSuccessToast).waitFor({ state: 'visible', timeout: 30_000 });
  }

  async resetFopState(): Promise<void> {
    const page = await this.getAdminPage();
    await page.goto('/lifting?fop=A');
    const stopBtn = page.locator(SELECTORS.announcerStopLiftingButton);
    if (await stopBtn.isVisible().catch(() => false)) {
      await stopBtn.click();
    }
    const combo = page.locator(SELECTORS.announcerGroupCombo);
    if (await combo.isVisible().catch(() => false)) {
      await combo.evaluate((el: any) => { el.value = ''; });
    }
  }

  async selectGroup(name: string): Promise<void> {
    const page = await this.getAdminPage();
    await page.goto('/lifting?fop=A');
    await page.locator(SELECTORS.announcerGroupCombo).evaluate(
      (el: any, val: string) => { el.value = val; el.dispatchEvent(new Event('change', { bubbles: true })); },
      name,
    );
  }

  async startLifting(): Promise<void> {
    const page = await this.getAdminPage();
    await page.locator(SELECTORS.announcerStartLiftingButton).click();
  }

  /**
   * Start the clock, poll the display-side timer text until it matches
   * `targetText`, then click Pause on the admin page. Produces a frozen
   * CURRENT_ATHLETE screenshot target at a known time.
   */
  async pauseAtTime(targetText = '0:50'): Promise<void> {
    const admin = await this.getAdminPage();
    // displayPage must already be navigated to a scoreboard-style display.
    const timer = this.displayPage.locator(SELECTORS.athleteTimerInResults);

    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      const text = (await timer.textContent().catch(() => null))?.trim();
      if (text === targetText) {
        await admin.locator(SELECTORS.announcerPauseButton).click();
        // Wait for the DOM to stop changing.
        await this.displayPage.waitForTimeout(250);
        const after = (await timer.textContent().catch(() => null))?.trim();
        if (after !== targetText) {
          throw new Error(`timer drifted after pause: expected ${targetText}, got ${after}`);
        }
        return;
      }
      await this.displayPage.waitForTimeout(50);
    }
    throw new Error(`pauseAtTime: timer never reached ${targetText} within 15s`);
  }
}

export function defaultFixturePath(repoRoot: string): string {
  return path.join(repoRoot, 'visual-regression', 'fixtures', 'golden-competition.zip');
}
```

- [ ] **Step 2: Extend `tests/displays.spec.ts` with a CURRENT_ATHLETE test**

Replace the file contents with:

```ts
import { test, expect, BrowserContext, Page } from '@playwright/test';
import * as path from 'path';
import { OwlcmsDriver } from '../src/owlcms-driver';
import { FopDriver, defaultFixturePath } from '../src/fop-driver';

const repoRoot = path.resolve(__dirname, '..', '..');
const owlcms = new OwlcmsDriver({ repoRoot });

let adminContext: BrowserContext;
let displayPage: Page;
let fop: FopDriver;

test.beforeAll(async ({ browser }) => {
  await owlcms.start();
  adminContext = await browser.newContext();
  const displayContext = await browser.newContext();
  displayPage = await displayContext.newPage();
  fop = new FopDriver({
    fixtureZipPath: defaultFixturePath(repoRoot),
    adminContext,
    displayPage,
  });
  await fop.importGoldenFixture();
});

test.afterAll(async () => {
  await adminContext?.close();
  await displayPage?.context().close();
  await owlcms.stop();
});

test.beforeEach(async () => {
  await fop.resetFopState();
});

test('publicScoreboard WAIT', async () => {
  await displayPage.goto('/displays/publicScoreboard?fop=A');
  await displayPage.waitForLoadState('networkidle');
  await displayPage.waitForTimeout(500);
  await expect(displayPage).toHaveScreenshot('publicScoreboard-wait.png');
});

test('publicScoreboard CURRENT_ATHLETE frozen at 0:50', async () => {
  await displayPage.goto('/displays/publicScoreboard?fop=A');
  await fop.selectGroup('G1');
  await fop.startLifting();
  await fop.pauseAtTime('0:50');
  await expect(displayPage).toHaveScreenshot('publicScoreboard-current-paused.png');
});
```

- [ ] **Step 3: Run both tests and generate the new baseline**

Run:
```bash
cd visual-regression && npx playwright test tests/displays.spec.ts --update-snapshots && cd ..
```

Expected: `2 passed`. New baseline: `publicScoreboard-current-paused-chromium.png`.

- [ ] **Step 4: Run again and confirm clean diff**

Run:
```bash
cd visual-regression && npx playwright test tests/displays.spec.ts && cd ..
```

Expected: `2 passed`. If `pauseAtTime` is flaky (timer didn't freeze exactly on `0:50`), relax it to a range in Task 9 — for now, if it's consistently passing, continue.

- [ ] **Step 5: Commit**

```bash
git add visual-regression/src/fop-driver.ts visual-regression/tests/displays.spec.ts visual-regression/tests/__screenshots__
git commit -m "visual-regression: CURRENT_ATHLETE frozen-clock screenshot"
```

---

## Task 9: fop-driver — announceDecision + advanceToSessionDone

**Files:**
- Modify: `visual-regression/src/selectors.ts`
- Modify: `visual-regression/src/fop-driver.ts`
- Modify: `visual-regression/tests/displays.spec.ts` (add decision + session-done tests)

- [ ] **Step 1: Add decision + session-done selectors to `selectors.ts`**

Append to the `SELECTORS` object in `visual-regression/src/selectors.ts`:

```ts
  // Jury / decision page (/jury?fop=A)
  juryGoodDecisionButton: 'vaadin-button:has-text("Godkendt"):visible',
  juryFailDecisionButton: 'vaadin-button:has-text("Forkastet"):visible',

  // Session-done: declare all remaining lifts as failed in the announcer
  announcerDeclareFailButton: 'vaadin-button:has-text("Ugyldig"):visible',
```

- [ ] **Step 2: Add `announceDecision` and `advanceToSessionDone` to `fop-driver.ts`**

Append the following methods to the `FopDriver` class (before the closing `}`):

```ts
  /**
   * Trigger a jury decision. Leaves the decision visible on the display.
   * Must be called after startLifting() while the athlete clock is running
   * (or paused).
   */
  async announceDecision(good: boolean): Promise<void> {
    const page = await this.getAdminPage();
    await page.goto('/jury?fop=A');
    const sel = good ? SELECTORS.juryGoodDecisionButton : SELECTORS.juryFailDecisionButton;
    await page.locator(sel).first().click();
    // Decision display animation runs ~3s. Wait for it to settle.
    await this.displayPage.waitForTimeout(3_500);
  }

  /**
   * Declare every remaining lift in the current group as a failed attempt
   * so the FOP transitions to SESSION_DONE.
   */
  async advanceToSessionDone(): Promise<void> {
    const page = await this.getAdminPage();
    await page.goto('/lifting?fop=A');
    // Click "Ugyldig" (fail) until it disappears (no more lifts to declare).
    for (let i = 0; i < 50; i++) {
      const btn = page.locator(SELECTORS.announcerDeclareFailButton).first();
      if (!(await btn.isVisible().catch(() => false))) break;
      await btn.click();
      await page.waitForTimeout(200);
    }
  }
```

- [ ] **Step 3: Add three new tests to `tests/displays.spec.ts`**

Append after the existing `publicScoreboard CURRENT_ATHLETE frozen at 0:50` test:

```ts
test('publicScoreboard SESSION_DONE', async () => {
  await displayPage.goto('/displays/publicScoreboard?fop=A');
  await fop.selectGroup('G1');
  await fop.startLifting();
  await fop.advanceToSessionDone();
  await displayPage.waitForTimeout(500);
  await expect(displayPage).toHaveScreenshot('publicScoreboard-session-done.png');
});

test('athleteFacingDecision good', async () => {
  await displayPage.goto('/displays/athleteFacingDecision?fop=A');
  await fop.selectGroup('G1');
  await fop.startLifting();
  await fop.pauseAtTime('0:50');
  await fop.announceDecision(true);
  await expect(displayPage).toHaveScreenshot('athleteFacingDecision-good.png');
});

test('athleteFacingDecision fail', async () => {
  await displayPage.goto('/displays/athleteFacingDecision?fop=A');
  await fop.selectGroup('G1');
  await fop.startLifting();
  await fop.pauseAtTime('0:50');
  await fop.announceDecision(false);
  await expect(displayPage).toHaveScreenshot('athleteFacingDecision-fail.png');
});
```

- [ ] **Step 4: Generate baselines and verify**

Run:
```bash
cd visual-regression && npx playwright test tests/displays.spec.ts --update-snapshots && cd ..
```

Expected: `5 passed`. Three new baseline PNGs appear.

Run again without `--update-snapshots`:
```bash
cd visual-regression && npx playwright test tests/displays.spec.ts && cd ..
```

Expected: `5 passed`.

- [ ] **Step 5: Commit**

```bash
git add visual-regression/src/selectors.ts visual-regression/src/fop-driver.ts visual-regression/tests/displays.spec.ts visual-regression/tests/__screenshots__
git commit -m "visual-regression: decision + session-done state drivers"
```

---

## Task 10: Expand to the full display × state matrix

**Files:**
- Create: `visual-regression/src/display-matrix.ts`
- Modify: `visual-regression/tests/displays.spec.ts` (drive from matrix)

- [ ] **Step 1: Write `visual-regression/src/display-matrix.ts`**

```ts
/**
 * The full (display × state) matrix for day one. Each entry declares:
 * - the display URL to screenshot
 * - a `setup` function that leaves FOP A in the target state
 * - a stable `name` used as the baseline filename (no extension)
 *
 * All 31 screenshots listed in the design spec are declared here.
 */
import { FopDriver } from './fop-driver';

export type SetupFn = (fop: FopDriver) => Promise<void>;

export interface DisplayCase {
  name: string;          // baseline filename without extension
  url: string;           // relative to baseURL
  setup: SetupFn;        // drives FOP into the target state
  settleMs?: number;     // extra wait before screenshot
}

const waitOnly: SetupFn = async () => { /* resetFopState runs in beforeEach */ };

const livePaused: SetupFn = async (fop) => {
  await fop.selectGroup('G1');
  await fop.startLifting();
  await fop.pauseAtTime('0:50');
};

const liveDecisionGood: SetupFn = async (fop) => {
  await livePaused(fop);
  await fop.announceDecision(true);
};

const liveDecisionFail: SetupFn = async (fop) => {
  await livePaused(fop);
  await fop.announceDecision(false);
};

const sessionDone: SetupFn = async (fop) => {
  await fop.selectGroup('G1');
  await fop.startLifting();
  await fop.advanceToSessionDone();
};

export const DISPLAY_CASES: DisplayCase[] = [
  // publicScoreboard
  { name: 'publicScoreboard-wait', url: '/displays/publicScoreboard?fop=A', setup: waitOnly },
  { name: 'publicScoreboard-current-paused', url: '/displays/publicScoreboard?fop=A', setup: livePaused },
  { name: 'publicScoreboard-session-done', url: '/displays/publicScoreboard?fop=A', setup: sessionDone },

  // currentathlete (lower-third)
  { name: 'currentathlete-wait', url: '/displays/currentathlete?fop=A', setup: waitOnly },
  { name: 'currentathlete-current-paused', url: '/displays/currentathlete?fop=A', setup: livePaused },
  { name: 'currentathlete-decision-good', url: '/displays/currentathlete?fop=A', setup: liveDecisionGood },

  // topsinclair
  { name: 'topsinclair-wait', url: '/displays/topsinclair?ad=Open', setup: waitOnly },
  { name: 'topsinclair-populated', url: '/displays/topsinclair?ad=Open', setup: livePaused },

  // topteams
  { name: 'topteams-wait', url: '/displays/topteams?ad=Open', setup: waitOnly },
  { name: 'topteams-populated', url: '/displays/topteams?ad=Open', setup: livePaused },

  // topteamsinclair
  { name: 'topteamsinclair-wait', url: '/displays/topteamsinclair?ad=Open', setup: waitOnly },
  { name: 'topteamsinclair-populated', url: '/displays/topteamsinclair?ad=Open', setup: livePaused },

  // attemptBoard
  { name: 'attemptBoard-wait', url: '/displays/attemptBoard?fop=A', setup: waitOnly },
  { name: 'attemptBoard-current-paused', url: '/displays/attemptBoard?fop=A', setup: livePaused },
  { name: 'attemptBoard-decision-good', url: '/displays/attemptBoard?fop=A', setup: liveDecisionGood },
  { name: 'attemptBoard-decision-fail', url: '/displays/attemptBoard?fop=A', setup: liveDecisionFail },

  // athleteFacingDecision
  { name: 'athleteFacingDecision-wait', url: '/displays/athleteFacingDecision?fop=A', setup: waitOnly },
  { name: 'athleteFacingDecision-good', url: '/displays/athleteFacingDecision?fop=A', setup: liveDecisionGood },
  { name: 'athleteFacingDecision-fail', url: '/displays/athleteFacingDecision?fop=A', setup: liveDecisionFail },

  // publicStartList
  { name: 'publicStartList-wait', url: '/displays/publicStartList?fop=A', setup: waitOnly },
  { name: 'publicStartList-populated', url: '/displays/publicStartList?fop=A', setup: livePaused },

  // resultsMedals
  { name: 'resultsMedals-wait', url: '/displays/resultsMedals?fop=A', setup: waitOnly },
  { name: 'resultsMedals-populated', url: '/displays/resultsMedals?fop=A', setup: sessionDone },

  // resultsLeadersRanks (Multi)
  { name: 'resultsLeadersRanks-wait', url: '/displays/resultsLeadersRanks?fop=A', setup: waitOnly },
  { name: 'resultsLeadersRanks-populated', url: '/displays/resultsLeadersRanks?fop=A', setup: livePaused },

  // resultsLeaders (Rankings)
  { name: 'resultsLeaders-wait', url: '/displays/resultsLeaders?fop=A', setup: waitOnly },
  { name: 'resultsLeaders-populated', url: '/displays/resultsLeaders?fop=A', setup: livePaused },
];
```

- [ ] **Step 2: Rewrite `tests/displays.spec.ts` to drive from the matrix**

Replace the file contents with:

```ts
import { test, expect, BrowserContext, Page } from '@playwright/test';
import * as path from 'path';
import { OwlcmsDriver } from '../src/owlcms-driver';
import { FopDriver, defaultFixturePath } from '../src/fop-driver';
import { DISPLAY_CASES } from '../src/display-matrix';

const repoRoot = path.resolve(__dirname, '..', '..');
const owlcms = new OwlcmsDriver({ repoRoot });

let adminContext: BrowserContext;
let displayPage: Page;
let fop: FopDriver;

test.beforeAll(async ({ browser }) => {
  await owlcms.start();
  adminContext = await browser.newContext();
  const displayContext = await browser.newContext();
  displayPage = await displayContext.newPage();
  fop = new FopDriver({
    fixtureZipPath: defaultFixturePath(repoRoot),
    adminContext,
    displayPage,
  });
  await fop.importGoldenFixture();
});

test.afterAll(async () => {
  await adminContext?.close();
  await displayPage?.context().close();
  await owlcms.stop();
});

test.beforeEach(async () => {
  await fop.resetFopState();
});

for (const c of DISPLAY_CASES) {
  test(c.name, async () => {
    await displayPage.goto(c.url);
    await displayPage.waitForLoadState('networkidle');
    await c.setup(fop);
    await displayPage.waitForTimeout(c.settleMs ?? 500);
    await expect(displayPage).toHaveScreenshot(`${c.name}.png`);
  });
}
```

- [ ] **Step 3: Generate baselines for the full matrix**

Run:
```bash
cd visual-regression && npx playwright test --update-snapshots && cd ..
```

Expected: 27 tests pass (all entries in `DISPLAY_CASES`). Test runtime: ~3–5 min.

If a specific test fails with a driver error (e.g. "group dropdown not found"), fix the selector in `src/selectors.ts` and re-run only that test with `--update-snapshots`:
```bash
cd visual-regression && npx playwright test -g "topteams-populated" --update-snapshots && cd ..
```

- [ ] **Step 4: Sanity-check the baseline PNGs visually**

Open a few in an image viewer and confirm they look right (not blank, not error pages, content matches what each display should show). Candidates to spot-check:
- `publicScoreboard-current-paused.png` — frozen timer at `0:50`
- `topteams-populated.png` — three tables (women/men/mixed) with club rows
- `attemptBoard-decision-good.png` — white decision box visible

Open in an image viewer:
```bash
xdg-open visual-regression/tests/__screenshots__/displays.spec.ts/publicScoreboard-current-paused-chromium.png
```

- [ ] **Step 5: Second run to confirm clean diff**

Run:
```bash
cd visual-regression && npx playwright test && cd ..
```

Expected: all tests pass with zero diffs.

- [ ] **Step 6: Commit**

```bash
git add visual-regression/src/display-matrix.ts visual-regression/tests/displays.spec.ts visual-regression/tests/__screenshots__
git commit -m "visual-regression: full 27-case display matrix with baselines"
```

---

## Task 11: `scripts/visual-test.sh` — docker wrapper

**Files:**
- Create: `scripts/visual-test.sh`

Only path anyone should use to run visual tests — guarantees baselines are captured inside the pinned image.

- [ ] **Step 1: Check that `scripts/` exists**

Run:
```bash
ls -la scripts/
```

Expected: directory exists (it already holds `check-translation-diff.sh`, `mainRelease.sh`).

- [ ] **Step 2: Write `scripts/visual-test.sh`**

```bash
#!/usr/bin/env bash
# Run DVF visual regression tests inside the pinned Docker image.
#
# Usage:
#   ./scripts/visual-test.sh              # run, fail on diff
#   ./scripts/visual-test.sh update       # regenerate baselines
#   ./scripts/visual-test.sh report       # open HTML report from last run
set -euo pipefail

IMAGE="${VISUAL_REGRESSION_IMAGE:-dvfdocker/visual-regression-runner:latest}"
MODE="${1:-run}"

cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"

# Ensure owlcms.jar is built — the container will launch it as a subprocess.
if [[ ! -f owlcms/target/owlcms/owlcms.jar ]]; then
  echo "[visual-test] owlcms.jar missing, building..."
  if ! command -v mvn >/dev/null 2>&1; then
    echo "[visual-test] ERROR: mvn not on PATH. Add it or run the build yourself:"
    echo "  mvn -pl owlcms -am package -P production -Dmaven.test.skip=true -q"
    exit 1
  fi
  mvn -pl owlcms -am package -P production -Dmaven.test.skip=true -q
fi

DOCKER_RUN=(
  docker run --rm
  --network host
  -v "${REPO_ROOT}:/work"
  -w /work/visual-regression
  "${IMAGE}"
)

case "${MODE}" in
  run)
    "${DOCKER_RUN[@]}" bash -c "npm ci && npx playwright test"
    ;;
  update)
    "${DOCKER_RUN[@]}" bash -c "npm ci && npx playwright test --update-snapshots"
    ;;
  report)
    "${DOCKER_RUN[@]}" bash -c "npx playwright show-report --host 0.0.0.0"
    ;;
  *)
    echo "Usage: $0 [run|update|report]" >&2
    exit 2
    ;;
esac
```

- [ ] **Step 3: Make it executable**

Run:
```bash
chmod +x scripts/visual-test.sh
```

- [ ] **Step 4: Run the full suite inside Docker (the real test)**

Run:
```bash
./scripts/visual-test.sh
```

Expected: all tests pass. If you see diffs between the baselines captured in Task 10 (outside Docker) and this Docker run, regenerate inside Docker:

```bash
./scripts/visual-test.sh update
```

Then re-run to confirm clean:
```bash
./scripts/visual-test.sh
```

- [ ] **Step 5: If baselines were regenerated in Docker, commit them**

```bash
git add visual-regression/tests/__screenshots__
git commit -m "visual-regression: regenerate baselines inside pinned Docker image"
```

- [ ] **Step 6: Commit the script**

```bash
git add scripts/visual-test.sh
git commit -m "visual-regression: scripts/visual-test.sh docker wrapper"
```

---

## Task 12: GitHub Actions workflow

**Files:**
- Create: `.github/workflows/visual-regression.yml`

- [ ] **Step 1: Write `.github/workflows/visual-regression.yml`**

```yaml
name: Visual Regression

on:
  pull_request:
    paths:
      - 'owlcms/**'
      - 'shared/src/main/resources/css/**'
      - 'visual-regression/**'
  push:
    branches:
      - dvf-stable

jobs:
  visual:
    runs-on: ubuntu-latest
    container:
      image: dvfdocker/visual-regression-runner:latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Maven cache
        uses: actions/cache@v4
        with:
          path: ~/.m2/repository
          key: ${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}
          restore-keys: |
            ${{ runner.os }}-maven-

      - name: Install Maven
        run: |
          apt-get update
          apt-get install -y --no-install-recommends maven
          rm -rf /var/lib/apt/lists/*

      - name: Build owlcms.jar
        run: mvn -pl owlcms -am package -P production -Dmaven.test.skip=true -q

      - name: Install Node deps
        working-directory: visual-regression
        run: npm ci

      - name: Run visual regression
        working-directory: visual-regression
        run: npx playwright test

      - name: Upload HTML report on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-regression-report
          path: visual-regression/playwright-report/
          retention-days: 14

      - name: Upload test-results on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-regression-traces
          path: visual-regression/test-results/
          retention-days: 14
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/visual-regression.yml
git commit -m "visual-regression: GitHub Actions CI workflow"
```

- [ ] **Step 3: Push to a scratch branch and verify CI**

Run:
```bash
git push origin dvf-stable:refs/heads/visual-regression-ci-smoke
```

Open the Actions tab on GitHub, watch the `Visual Regression` job run on the `visual-regression-ci-smoke` branch. Expected: green build. If it fails, download the `visual-regression-report` artifact and inspect `index.html`.

If baselines diff between local Docker and CI (they should not — same image), regenerate locally via `./scripts/visual-test.sh update`, commit, push, and re-verify.

- [ ] **Step 4: Delete the scratch branch**

Run:
```bash
git push origin --delete visual-regression-ci-smoke
```

---

## Task 13: Document the workflow in CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Append a new "Visual Regression" section to `CLAUDE.md`**

Append after the existing "## Syncing with Upstream" section:

```markdown
## Visual Regression

Golden-image tests for all 11 DVF-customized displays. See `docs/superpowers/specs/2026-04-10-visual-regression-design.md` for the full design.

### Run locally

```bash
./scripts/visual-test.sh              # fail on any diff
./scripts/visual-test.sh update       # regenerate baselines (inspect first!)
./scripts/visual-test.sh report       # open HTML report from last run
```

All runs execute inside `dvfdocker/visual-regression-runner:latest` (pinned Playwright + JRE 17) so rendering is byte-identical to CI.

### Updating baselines on an upstream merge

```bash
git fetch upstream
git checkout -b merge/devNN dvf-stable
git merge upstream/devNN                  # resolve conflicts
./scripts/visual-test.sh                  # check for visual regressions

# If failures are legitimate upstream changes we want to keep:
./scripts/visual-test.sh update
git add visual-regression/tests/__screenshots__
git commit -m "visual: absorb devNN baseline changes"

# If failures are DVF bugs introduced by the merge: fix the code, re-run.

git push -u origin merge/devNN
# Open a PR; CI must be green before merging to dvf-stable.
```

Every PR that modifies `visual-regression/tests/__screenshots__/` must be visually inspected (GitHub renders PNG diffs side-by-side in the files view).

### Regenerating the fixture

The `visual-regression/fixtures/golden-competition.zip` is hand-built in the owlcms admin UI. To rebuild it, follow Task 3 of `docs/superpowers/plans/2026-04-10-visual-regression.md`.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md — document visual regression workflow"
```

---

## Done

At this point you have:

- 27 committed golden PNGs covering all 11 DVF displays across WAIT, live-paused, decision, and session-done states
- `./scripts/visual-test.sh` as the single entry point for local runs
- `.github/workflows/visual-regression.yml` enforcing baselines on every PR
- A pinned Docker image (`dvfdocker/visual-regression-runner:latest`) guaranteeing local/CI rendering parity
- Documented upstream-merge workflow in `CLAUDE.md`

Running `git log --oneline` should show roughly 13 commits corresponding to Tasks 1–13.
