# DVF Visual Regression + Upstream Merge Workflow — Design

**Date:** 2026-04-10
**Author:** Brainstormed with Claude
**Status:** Approved, awaiting implementation plan

## Goal

Enable fast, confident merges from upstream `jflamy/owlcms4` into the DVF fork by catching any unintentional visual regression across all 11 DVF-customized display views through automated golden-image comparison. Run locally during development and in GitHub Actions on every pull request.

## Context

The DVF fork customizes 11 display views with dark blue #00004B / yellow #FFD200 branding, a DVF header bar, Eleiko sponsor logo, and restructured CSS. Upstream (`dev66`+) merges frequently touch the same JS components and CSS files, and each merge carries risk of silent visual breakage. Today the only verification is manual: build, start owlcms, click through each display URL, eyeball the result. That does not scale as upstream moves faster.

Existing infrastructure to leverage or preserve:
- Maven-based `playwright/` module exists but only runs a Java load test (`RunResults.java`). Keep untouched.
- Two GitHub Actions workflows (`master.yml`, `docker.yml`) already build and test. Add a third.
- `CLAUDE.md` documents the manual upstream merge flow. It will be updated to reference the new visual-test script.

## Non-Goals

- Replacing the existing Java `playwright/` load-test module.
- Multi-FOP (platform B, C) coverage on day one.
- Jury view, break/ceremony visuals, and record-attempt badge states on day one.
- Visual diffing on mobile viewports.
- A persistent baseline dashboard (reg-suit, Percy, etc.).

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Test framework | Playwright Test (TypeScript), new top-level `visual-regression/` module | Native `toHaveScreenshot()`, masking, tolerance, `--update-snapshots`, built-in HTML report |
| Diff tool | Playwright `toHaveScreenshot()` | Zero extra deps; matches test runner |
| Fixture | Committed `.zip` registration file, imported once per suite into a fresh H2; FOP state reset between tests | Reviewable, reproducible, matches real owlcms import flow, avoids slow per-test re-imports |
| State transitions | Second browser context drives the owlcms announcer UI (`/lifting?fop=A`) | No REST API for the admin flows; Vaadin UI is the supported surface |
| Dynamic content (timers) | Freeze the clock: start lifting, poll timer text until it hits a known value (`0:50`), then click Pause | Byte-identical captures without masking |
| Local/CI consistency | Every run happens inside the same Docker image (`mcr.microsoft.com/playwright:v1.50.0-noble` + Java 17) | Eliminates font anti-aliasing drift between dev machine and Actions runner |
| Baseline storage | Committed PNGs under `visual-regression/tests/__screenshots__/` | Git-reviewable diffs; no external storage |
| Baseline update | `./scripts/visual-test.sh update` regenerates, human commits | Explicit, auditable, same as CSS changes |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ Docker: mcr.microsoft.com/playwright:v1.50.0-noble      │
│         + openjdk-17-jre-headless                       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ owlcms subprocess (fresh H2 + golden fixture zip)   │ │
│ │ http://localhost:8080                               │ │
│ └─────────────────────────────────────────────────────┘ │
│                        ▲                                │
│                        │                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Playwright Test                                      │ │
│ │  ┌─────────────────┐     ┌─────────────────────┐    │ │
│ │  │ admin context   │     │ display context     │    │ │
│ │  │ /lifting?fop=A  │     │ /displays/...       │    │ │
│ │  │ (fop-driver)    │     │ (screenshot target) │    │ │
│ │  └─────────────────┘     └─────────────────────┘    │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
        ▲                                    │
        │ npm ci && npx playwright test      │ playwright-report/
        │                                    ▼
┌──────────────────────┐            ┌───────────────────┐
│ scripts/visual-test.sh│            │ HTML report:      │
│  (local)              │            │ baseline|cur|diff │
│ .github/workflows/   │            └───────────────────┘
│  visual-regression.yml│
└──────────────────────┘
```

### Two-context pattern

For each test:
- **Admin context** opens `/lifting?fop=A`, drives state via the announcer UI (select group, start, pause, declare decisions).
- **Display context** opens the display URL under test and is the screenshot target.

Both contexts share server state via cookies/session within the same test, so driving the admin context transitions the FOP that the display context observes.

## Directory Layout

```
visual-regression/
├── package.json                    # @playwright/test, typescript
├── playwright.config.ts
├── tsconfig.json
├── Dockerfile.visual-regression    # derives from playwright:v1.50.0-noble + JRE
├── fixtures/
│   └── golden-competition.zip      # frozen owlcms registration zip
├── src/
│   ├── owlcms-driver.ts            # spawns owlcms subprocess, waits for :8080
│   ├── fop-driver.ts               # drives announcer UI to set FOP states
│   ├── display-matrix.ts           # (display × state) test matrix
│   └── selectors.ts                # admin-UI element selectors
├── tests/
│   ├── displays.spec.ts            # parameterized test per (display, state)
│   └── __screenshots__/            # golden PNGs (committed)
└── README.md

scripts/
└── visual-test.sh                  # docker wrapper (run | update | report)

.github/workflows/
└── visual-regression.yml           # runs on PRs + pushes to dvf-stable
```

## Fixture: `golden-competition.zip`

Hand-built once, committed, imported into a fresh H2 database once per test suite run (`beforeAll`). FOP state is reset between individual tests via the announcer UI, not via re-importing the zip — a full re-import takes ~3–5s and 30 tests would add ~2 min of pure fixture overhead.

### Lifecycle

1. `beforeAll` (per suite): delete any existing `database/owlcms-h2v2.*`, start owlcms subprocess, wait for `:8080`, use the admin context to import `fixtures/golden-competition.zip` via `Importér fra andet owlcms-system`, wait for import completion.
2. `beforeEach` (per test): call `fop-driver.resetFopState()` which selects no group on FOP A (returns it to INACTIVE/WAIT), then the test drives into its target state.
3. `afterAll` (per suite): stop the owlcms subprocess.

Contents:
- 1 championship named `Golden`
- 2 groups: `G1` and `G2`
- ~8 athletes, split M/F, assigned to teams so that `topteams` and `topteamsinclair` have at least 3 teams per gender with ranked results
- 1 record in `Records` for the `Golden` championship so record-bar rendering is exercised on `publicScoreboard`

Origin process (one-time, manual): start a fresh owlcms, create the competition in the admin UI, verify it produces non-empty displays, `Eksporter` → save `.zip` → commit.

Regenerated whenever:
- A new display feature requires fixture data it currently lacks.
- An upstream schema migration invalidates the zip (rare; import handles most migrations).

## The State-Transition Driver (`fop-driver.ts`)

Exposed primitives:

```ts
class FopDriver {
  constructor(adminPage: Page) {}

  /** Reset FOP A to INACTIVE/WAIT (no group selected). Does NOT re-import the fixture. */
  async resetFopState(): Promise<void>;

  /** Suite-level: import golden-competition.zip into a clean H2 via the admin UI. Called once in beforeAll. */
  async importGoldenFixture(): Promise<void>;

  /** Announcer page: pick a group from the dropdown. */
  async selectGroup(name: string): Promise<void>;

  /** Click "Start Lifting". */
  async startLifting(): Promise<void>;

  /** Start the athlete clock, poll until timer text matches `targetText`
   *  (default "0:50"), then click Pause. Throws after 2s if the text never appears. */
  async pauseAtTime(targetText?: string): Promise<void>;

  /** Trigger a decision from the jury decision endpoint; leaves the decision
   *  visible on the display for screenshot. */
  async announceDecision(good: boolean): Promise<void>;

  /** Mark all remaining lifts as done so the session transitions to SESSION_DONE. */
  async advanceToSessionDone(): Promise<void>;
}
```

### `pauseAtTime` — the deterministic clock freeze

The clock is server-driven and ticks in ~100ms increments rendered by a Lit component. Strategy:

1. Click "Start Lifting" on the announcer page — clock begins at 60.0.
2. On the display context, poll `locator('.athleteTimer').textContent()` in a tight loop.
3. As soon as the text matches `"0:50"` (chosen to be safely past the starting frame but far from zero), click Pause on the announcer page.
4. Await DOM stability on the display (timer text stops changing for ≥150ms), then return.
5. Timeout of 2s with a clear error message if the target text is never seen.

This yields a frozen display showing exactly `0:50` every run, byte-identical.

### What day-one does NOT drive

- Multi-FOP. All tests target FOP A.
- Break / intro countdown / ceremony modes. Deferred.
- Record-attempt badge. Deferred.
- Jury view. Deferred.

Day-one coverage focuses on the hot path: waiting state, live lifting state, decisions, and session-done.

## State Matrix (day one, ~30 screenshots)

| Display | States |
|---|---|
| publicScoreboard | WAIT, CURRENT_ATHLETE_paused, SESSION_DONE |
| currentathlete (lower-third) | WAIT, CURRENT_ATHLETE_paused, decision-visible-good |
| topsinclair | WAIT, populated |
| topteams | WAIT, populated |
| topteamsinclair | WAIT, populated |
| attemptBoard | WAIT, CURRENT_ATHLETE_paused, decision-good, decision-fail |
| athleteFacingDecision | WAIT, decision-good, decision-fail |
| publicStartList | WAIT, populated |
| resultsMedals | WAIT, populated |
| resultsLeadersRanks (Multi) | WAIT, populated |
| resultsLeaders (Rankings) | WAIT, populated |

Total: 31 screenshots.

## Docker Wrapper — `scripts/visual-test.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

IMAGE="dvfdocker/visual-regression-runner:latest"
MODE="${1:-run}"   # run | update | report

# Build owlcms.jar if missing
if [[ ! -f owlcms/target/owlcms/owlcms.jar ]]; then
  mvn -pl owlcms -am package -P production -Dmaven.test.skip=true -q
fi

case "$MODE" in
  run)
    docker run --rm --network host -v "$PWD":/work -w /work/visual-regression \
      "$IMAGE" bash -c "npm ci && npx playwright test"
    ;;
  update)
    docker run --rm --network host -v "$PWD":/work -w /work/visual-regression \
      "$IMAGE" bash -c "npm ci && npx playwright test --update-snapshots"
    ;;
  report)
    docker run --rm --network host -v "$PWD":/work -w /work/visual-regression \
      -p 9323:9323 "$IMAGE" bash -c "npx playwright show-report --host 0.0.0.0"
    ;;
esac
```

`--network host` lets the containerized Playwright reach the owlcms subprocess (also spawned inside the container) on `localhost:8080`.

### Pre-baked image `dvfdocker/visual-regression-runner:latest`

Derived from `mcr.microsoft.com/playwright:v1.50.0-noble`:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.50.0-noble
RUN apt-get update && \
    apt-get install -y --no-install-recommends openjdk-17-jre-headless && \
    rm -rf /var/lib/apt/lists/*
```

Pushed to DockerHub on first setup, rebuilt whenever the Playwright version bumps.

## GitHub Actions — `.github/workflows/visual-regression.yml`

```yaml
name: Visual Regression
on:
  pull_request:
    paths:
      - 'owlcms/**'
      - 'shared/src/main/resources/css/**'
      - 'visual-regression/**'
  push:
    branches: [dvf-stable]
jobs:
  visual:
    runs-on: ubuntu-latest
    container: dvfdocker/visual-regression-runner:latest
    steps:
      - uses: actions/checkout@v4
      - name: Build owlcms
        run: mvn -pl owlcms -am package -P production -Dmaven.test.skip=true -q
      - name: Install deps
        run: cd visual-regression && npm ci
      - name: Run visual tests
        run: cd visual-regression && npx playwright test
      - name: Upload report on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-regression-report
          path: visual-regression/playwright-report/
          retention-days: 14
```

Running the job inside the pre-baked container guarantees byte-identical rendering with the local Docker runs.

## Upstream Merge Workflow (the payoff)

```
git fetch upstream
git checkout -b merge/dev67 dvf-stable
git merge upstream/dev67
# resolve conflicts in CSS, JS, Java
./scripts/visual-test.sh                 # ~2 min; fails loudly on any diff

# inspect failures:
./scripts/visual-test.sh report          # opens HTML report, review each diff

# Case 1: regression in DVF code caused by merge
#   fix the DVF source
#   ./scripts/visual-test.sh             # re-run until green

# Case 2: legitimate upstream change that should be absorbed
#   ./scripts/visual-test.sh update      # regenerate affected baselines
#   git add visual-regression/tests/__screenshots__
#   git commit -m "visual: absorb dev67 baseline changes"

git push -u origin merge/dev67
# open PR → CI re-runs visual job in the same image → must be green to merge
```

`CLAUDE.md` will be updated to reference this workflow alongside the existing git-merge steps.

## Baseline Review Discipline

- Every PR that modifies `visual-regression/tests/__screenshots__/` MUST be visually inspected by a human before merge. GitHub renders PNG diffs side-by-side in the PR files view.
- Baselines are never updated in the same commit as unrelated code changes. Dedicated commit messages: `visual: accept new baselines from <reason>`.
- On an upstream merge PR, the baseline-update commit is separate from the merge commit so the diff review is focused.

## Implementation Order (for the plan)

1. **Create golden fixture zip** — hand-build in running owlcms, export, commit.
2. **Scaffold `visual-regression/` module** — `npm init`, deps, tsconfig, playwright.config.
3. **`owlcms-driver.ts`** — subprocess launcher + health-check poll + teardown.
4. **`fop-driver.ts`** — `resetToFreshFixture`, `selectGroup`, `startLifting`, `pauseAtTime`.
5. **First test: `publicScoreboard` WAIT + CURRENT_ATHLETE_paused** — pipeline proof.
6. **Expand to all 11 displays in "populated" state** (data-driven test).
7. **Add remaining states** (decision variants, SESSION_DONE).
8. **`Dockerfile.visual-regression` + push to DockerHub + `scripts/visual-test.sh`**.
9. **`.github/workflows/visual-regression.yml`** + end-to-end CI verification.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Fixture import too slow if done per-test | Imported once per suite in `beforeAll`, not per test. Per-test reset is FOP-state only. |
| Upstream changes break the announcer UI selectors the driver depends on | Keep selectors isolated in `src/selectors.ts`; failures surface as driver errors, not diff noise. |
| Baseline PNGs bloat the repo | 31 PNGs × ~50KB ≈ 1.5MB. Tolerable. If it grows past ~20MB, migrate to Git LFS. |
| Java version drift between local and CI | Both use Java 17 from the pre-baked image. Drift impossible. |
| `pauseAtTime` flakes on slow CI runners | 2s timeout is generous; text poll is robust. If it still flakes, extend timeout and add retry at the test level. |
| Someone captures baselines outside Docker | `scripts/visual-test.sh` is the only supported path; README calls this out. `--update-snapshots` run outside Docker will produce baselines CI rejects, caught immediately. |
