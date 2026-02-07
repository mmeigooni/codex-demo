#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "Not inside a git repository." >&2
  exit 1
fi

cd "$repo_root"

if [[ ! -f ".githooks/post-commit" ]]; then
  echo "Missing hook file: .githooks/post-commit" >&2
  exit 1
fi

if [[ ! -f ".githooks/pre-commit" ]]; then
  echo "Missing hook file: .githooks/pre-commit" >&2
  exit 1
fi

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
chmod +x .githooks/post-commit

echo "Configured core.hooksPath=$(git config --get core.hooksPath)"
ls -l .githooks/pre-commit
ls -l .githooks/post-commit
