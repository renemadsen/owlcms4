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
