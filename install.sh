#!/usr/bin/env bash
set -euo pipefail

REPO="https://github.com/erick-ol/claude-skill-email-html-checker-"
DEST="$HOME/.claude/skills/email-html-checker"

echo "Installing email-html-checker Claude Code skill..."

if ! command -v git &>/dev/null; then
  echo "Error: git is required but not found. Install git and try again." >&2
  exit 1
fi

if [ -d "$DEST" ]; then
  echo "Removing previous installation..."
  rm -rf "$DEST"
fi

mkdir -p "$HOME/.claude/skills"

git clone --depth 1 "$REPO" "$DEST"
rm -rf "$DEST/.git"

echo ""
echo "Installed to $DEST"
echo "Restart Claude Code to activate the skill."
