#!/usr/bin/env bash
set -euo pipefail

BASE="https://raw.githubusercontent.com/erick-ol/claude-skill-email-html-checker-/main"
PROJECT=false

for arg in "$@"; do
  case "$arg" in
    --project) PROJECT=true ;;
  esac
done

if $PROJECT; then
  DEST="$(pwd)/.claude/skills/email-html-checker"
  SCOPE="project"
else
  DEST="$HOME/.claude/skills/email-html-checker"
  SCOPE="global"
fi

echo "Installing email-html-checker ($SCOPE)..."

if [ -d "$DEST" ]; then
  echo "Removing previous installation..."
  rm -rf "$DEST"
fi

mkdir -p "$DEST/scripts"

curl -fsSL "$BASE/SKILL.md"             -o "$DEST/SKILL.md"
curl -fsSL "$BASE/caniemail-data.json"  -o "$DEST/caniemail-data.json"
curl -fsSL "$BASE/caniemail-slim.json"  -o "$DEST/caniemail-slim.json"
curl -fsSL "$BASE/scripts/build.js"     -o "$DEST/scripts/build.js"
curl -fsSL "$BASE/scripts/filter.js"    -o "$DEST/scripts/filter.js"

echo ""
echo "Installed to $DEST"

if $PROJECT; then
  echo "Tip: commit .claude/skills/email-html-checker/ to share this skill with your team."
else
  echo "Restart Claude Code to activate the skill."
fi
