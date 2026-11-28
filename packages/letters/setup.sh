#!/bin/sh
# A Python venv with numpy, and the PenGPT handwriting weights (6 MB, Apache-2.0).
set -e
cd "$(dirname "$0")"
[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q numpy
mkdir -p .cache
[ -f .cache/hand.npz ] || curl -fL -o .cache/hand.npz https://github.com/greydanus/pengpt/releases/download/models-2026-11-16/hand.npz
echo "ready: pnpm --filter @imbustai/letters voss"
