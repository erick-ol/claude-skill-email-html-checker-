#!/usr/bin/env bash
set -euo pipefail

SKILL_NAME="email-html-checker"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMP_DIR="$(mktemp -d)"
OUT="$SCRIPT_DIR/$SKILL_NAME.zip"

mkdir -p "$TEMP_DIR/$SKILL_NAME/scripts"

cp "$SCRIPT_DIR/SKILL.md"             "$TEMP_DIR/$SKILL_NAME/"
cp "$SCRIPT_DIR/caniemail-slim.json"  "$TEMP_DIR/$SKILL_NAME/"
cp "$SCRIPT_DIR/install.sh"           "$TEMP_DIR/$SKILL_NAME/"
cp "$SCRIPT_DIR/scripts/build.js"     "$TEMP_DIR/$SKILL_NAME/scripts/"
cp "$SCRIPT_DIR/scripts/filter.js"    "$TEMP_DIR/$SKILL_NAME/scripts/"

cd "$TEMP_DIR"
zip -r "$OUT" "$SKILL_NAME/"
rm -rf "$TEMP_DIR"

echo "Created: $OUT"
