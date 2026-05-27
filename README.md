# email-html-checker

A skill that audits email HTML against the [caniemail.com](https://www.caniemail.com) database and produces a compatibility report with automatic fixes where possible. Works in both **Claude Code** and **Claude.ai**.

## What it does

- Checks HTML against **4 priority clients**: Outlook Windows (2007–2021), Gmail, Apple Mail, Yahoo Mail
- Classifies issues by severity: Critical / Warning / Notice
- Auto-fixes what it can (replaces flexbox with tables, converts `rem` to `px`, adds VML fallbacks for gradients, etc.)
- Flags issues that require a human decision (video, forms, CSS variables, animations)
- Outputs a corrected HTML with `<!-- FIXED: ... -->` comments
- Responds in **English or Portuguese** based on your message

## Install

### Claude Code

**Requirements:** [Claude Code](https://claude.ai/code) (any tier) · [Node.js](https://nodejs.org) ≥ 18

**Global** — available in all your projects:
```bash
curl -fsSL https://raw.githubusercontent.com/erick-ol/claude-skill-email-html-checker-/main/install.sh | bash
```

**Project** — this project only (run from your project root, then commit `.claude/skills/`):
```bash
curl -fsSL https://raw.githubusercontent.com/erick-ol/claude-skill-email-html-checker-/main/install.sh | bash -s -- --project
```

To update, re-run the same command.

### Claude.ai

**Requirements:** Pro, Max, Team, or Enterprise plan · Code execution enabled

1. Download **[email-html-checker.zip](https://github.com/erick-ol/claude-skill-email-html-checker-/releases/latest)** from Releases
2. Go to **Settings → Customize → Skills → +**
3. Upload the ZIP and start a new conversation

## Usage

Just describe what you want in natural language — the skill activates automatically:

```
Check my email HTML for compatibility issues
```
```
Does this work in Outlook? [paste HTML]
```
```
Audit this email template and fix what you can
```
```
Verifica meu HTML de e-mail
```

### Using with a file

```
Check compatibility of email.html
```

Claude Code will read the file, apply fixes in-place, and create a `email.backup.html` before making changes.

### Non-priority clients

Ask about Thunderbird, ProtonMail, Samsung Email, Fastmail, and others:

```
Check this HTML for Thunderbird and ProtonMail too
```

Available: `thunderbird`, `samsung-email`, `protonmail`, `hey`, `fastmail`, `mail-ru`, `laposte`, `sfr`, `orange`, `free-fr`, `gmx`, `web-de`, `ionos-1and1`, `aol`, `microsoft`, `rainloop`, `wp-pl`, `t-online-de`

## How the data works

| File | Purpose |
|------|---------|
| `caniemail-data.json` | Full caniemail.com dataset (source of truth) |
| `caniemail-slim.json` | Pre-built extract for 4 priority clients |
| `scripts/filter.js` | Filters slim data to only features present in your HTML |
| `scripts/build.js` | Rebuilds slim/extended data (run after updating `caniemail-data.json`) |

Claude only reads the filtered subset (`caniemail-context.json`, generated on the fly) — not the full 933 KB dataset.

## Updating the caniemail data

Download the latest data from [caniemail.com/api/data.json](https://www.caniemail.com/api/data.json), replace `caniemail-data.json`, then rebuild:

```bash
node scripts/build.js
```

## Reference

- [caniemail.com](https://www.caniemail.com) — full compatibility tables
- [Can I Email?](https://www.caniemail.com/search/) — feature search
