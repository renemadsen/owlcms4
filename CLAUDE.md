# CLAUDE.md — owlcms4 DVF Fork

## Project Overview

This is the DVF (Dansk Vægtløftnings-Forbund) fork of owlcms4, a weightlifting competition management system. The fork customizes scoreboards and displays for DVF branding (dark blue #00004B, yellow #FFD200 palette, Eleiko sponsor integration).

- **Fork:** `renemadsen/owlcms4` (branch: `dvf-stable`)
- **Upstream:** `jflamy/owlcms4` (current target: `dev66`)
- **Main class:** `app.owlcms.Main`
- **Framework:** Vaadin 24 + Lit/LitElement frontend components

## Building and Running

### Prerequisites

- Java 17
- Maven (available via JetBrains IntelliJ bundled Maven at `~/.local/share/JetBrains/Toolbox/apps/intellij-idea-community-edition/plugins/maven/lib/maven3/bin/mvn`)

Add Maven to PATH:
```bash
export PATH="$HOME/.local/share/JetBrains/Toolbox/apps/intellij-idea-community-edition/plugins/maven/lib/maven3/bin:$PATH"
```

### Build production JAR

```bash
mvn -pl owlcms -am package -P production -Dmaven.test.skip=true -q
```

### Run the server

```bash
cd owlcms/target/owlcms
rm -f database/owlcms-h2v2.*          # optional: reset database
OWLCMS_ENABLEEMBEDDEDMQTT=false java -jar owlcms.jar
```

Server starts on http://localhost:8080. Key display URLs:
- `/displays/publicScoreboard` — results scoreboard
- `/displays/currentathlete` — lower-third video overlay (green screen)
- `/displays/topsinclair` — top individual Sinclair rankings
- `/displays/topteamsinclair` — team Sinclair rankings
- `/displays/attemptBoard?fop=A` — athlete-facing attempt board
- `/displays/athleteFacingDecision` — decision board

### IDE launch (VS Code / IntelliJ)

Launch configurations are in `.vscode/launch.json`. Use the "owlcms no reset" configuration for typical development.

## Project Structure

### Frontend components (Lit/LitElement)
- `owlcms/src/main/frontend/components/` — JS display components
  - `Results.js` — main scoreboard
  - `CurrentAthlete.js` — lower-third overlay
  - `TopSinclair.js` — individual Sinclair rankings
  - `TopTeamsSinclair.js` — team Sinclair rankings
  - `AttemptBoard.js` — attempt board
  - `DecisionBoard.js` — decision display

### CSS (3 variants, DVF uses `nogrid` as default + `transparent` for lower-third)
- `shared/src/main/resources/css/nogrid/` — default DVF styles
  - `colors.css` — DVF color palette
  - `results.css` — scoreboard table layout
  - `attemptboard.css` — attempt board grid layout
  - `decisionboard.css` — decision board
  - `topSinclair.css` — Sinclair card styles
- `shared/src/main/resources/css/transparent/` — lower-third overlay styles
  - `currentathlete.css` — green screen overlay layout

### Logos
- `shared/src/main/resources/logos/dvf-logo-white.png` — DVF logo
- `shared/src/main/resources/logos/eleiko-logo-white.svg` — Eleiko sponsor logo (white)

### Java backend (display components)
- `owlcms/src/main/java/app/owlcms/displays/scoreboard/` — Results, CurrentAthlete
- `owlcms/src/main/java/app/owlcms/displays/attemptboard/` — AttemptBoard, AbstractAttemptBoard
- `owlcms/src/main/java/app/owlcms/displays/top/` — TopSinclair, TopTeamsSinclair

## Syncing with Upstream

The upstream repository is `jflamy/owlcms4`. The current upstream target branch is `dev66`.

### Setup (already done)
```bash
git remote add upstream https://github.com/jflamy/owlcms4.git
```

### Updating from upstream
```bash
# Fetch latest upstream changes
git fetch upstream

# Merge upstream target branch into dvf-stable
git checkout dvf-stable
git merge upstream/dev66

# Resolve any conflicts, then:
git push origin dvf-stable
```

### Key areas likely to conflict on merge
- `shared/src/main/resources/css/` — DVF has custom color palette and layouts
- `owlcms/src/main/frontend/components/` — DVF has custom templates with branding
- `owlcms/src/main/java/app/owlcms/data/athlete/Athlete.java` — DVF adds `toTitleCase` for name display
- `owlcms/src/main/java/app/owlcms/displays/attemptboard/AbstractAttemptBoard.java` — DVF swaps name display order

## DVF Design Conventions

- **Colors:** dark blue `#00004B`, yellow `#FFD200`, white text, dark red `#8B0000` for fails
- **Names:** title case (via `toTitleCase` in `Athlete.computeRawFullName`), firstName before lastName
- **Sponsor:** "Powered by ELEIKO" badge in header bars (right side, opposite DVF logo)
- **Lower-third:** green screen `#00ff00` background, gradient bar `linear-gradient(to right, #00004B 70%, transparent)`
- **Don't** use `margin-left: auto` on multiple flex children in the same row (causes gaps)

## Visual regression

Golden-image tests for the 11 DVF-customized displays across 5 states (wait / active / record / paused / resumed). Baselines live in `visual-regression/tests/__screenshots__/`. Everything runs inside the pinned image `ghcr.io/renemadsen/owlcms4-visual-regression:latest` so rendering is byte-identical to CI.

### Run locally

```bash
./scripts/visual-test.sh          # fail on any diff
./scripts/visual-test.sh update   # regenerate baselines (inspect diffs first!)
./scripts/visual-test.sh report   # open HTML report from last run
```

The wrapper builds `owlcms.jar` if missing, then runs Playwright inside Docker.

### Golden database

The test suite launches owlcms against `visual-regression/fixtures/golden-state.mv.db` (H2 DB pre-seeded with Gruppe 2 athletes and records). `OwlcmsDriver` copies it to `owlcms/target/owlcms/database/owlcms-h2v2.mv.db` on startup. To refresh it: run owlcms manually, curate the state in the admin UI, then copy the resulting `owlcms-h2v2.mv.db` back into `visual-regression/fixtures/golden-state.mv.db` and commit.

### CI

`.github/workflows/visual-regression.yml` gates any PR that touches `owlcms/**`, `shared/src/main/resources/css/**`, or `visual-regression/**`. Failures upload the Playwright HTML report and traces as artifacts. When a merge from upstream legitimately changes renderings, regenerate baselines with `./scripts/visual-test.sh update` and visually inspect the PNG diffs in the PR before approving.
