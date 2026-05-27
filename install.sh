#!/usr/bin/env bash
set -euo pipefail

REPO="https://github.com/erick-ol/claude-skill-email-html-checker-"
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

if ! command -v git &>/dev/null; then
  echo "Error: git is required but not found. Install git and try again." >&2
  exit 1
fi

if [ -d "$DEST" ]; then
  echo "Removing previous installation..."
  rm -rf "$DEST"
fi

mkdir -p "$(dirname "$DEST")"

git clone --depth 1 "$REPO" "$DEST"
rm -rf "$DEST/.git"

echo ""
echo "Installed to $DEST"

if $PROJECT; then
  echo "Tip: commit .claude/skills/email-html-checker/ to share this skill with your team."
else
  echo "Restart Claude Code to activate the skill."
fi
