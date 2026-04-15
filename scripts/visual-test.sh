#!/usr/bin/env bash
# Run DVF visual regression tests inside the pinned Docker image.
#
# Usage:
#   ./scripts/visual-test.sh              # run, fail on diff
#   ./scripts/visual-test.sh update       # regenerate baselines
#   ./scripts/visual-test.sh report       # open HTML report from last run
set -euo pipefail

IMAGE="${VISUAL_REGRESSION_IMAGE:-dvfdocker/owlcms4-visual-regression:latest}"
MODE="${1:-run}"

cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"

# Ensure owlcms.jar is built — the container will launch it as a subprocess.
if [[ ! -f owlcms/target/owlcms/owlcms.jar ]]; then
  echo "[visual-test] owlcms.jar missing, building..."
  if ! command -v mvn >/dev/null 2>&1; then
    echo "[visual-test] ERROR: mvn not on PATH. Add it (e.g. the IntelliJ-bundled maven at" >&2
    echo "  \$HOME/.local/share/JetBrains/Toolbox/apps/intellij-idea-community-edition/plugins/maven/lib/maven3/bin" >&2
    echo ") or run the build yourself:" >&2
    echo "  mvn -pl owlcms -am package -P production -Dmaven.test.skip=true -q" >&2
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
  -h|--help|help)
    sed -n '2,7p' "$0"
    ;;
  *)
    echo "Usage: $0 [run|update|report]" >&2
    exit 2
    ;;
esac
