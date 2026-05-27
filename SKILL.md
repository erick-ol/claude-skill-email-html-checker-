---
name: email-html-checker
description: >
  Checks email HTML compatibility with email clients (Gmail, Outlook, Apple Mail, Yahoo Mail, and others).
  Use this skill WHENEVER the user asks to verify, analyze, check, or audit email HTML —
  including phrases like "check my email HTML", "does this work in Outlook?",
  "verifica meu HTML de e-mail", "audit this email template", "email compatibility",
  "email compatibility check", or any variation. Also use when the user shares an HTML block
  and mentions email, newsletter, campaign, email template, or email clients. Automatically
  detects the user's language (EN or PT-BR) and responds in the same language.
---

# Email HTML Compatibility Checker

This skill checks email HTML against the caniemail.com database and produces:
1. A **compatibility report** classified by severity
2. A **corrected HTML** (when possible) with incompatibilities resolved

## Priority clients
- **Outlook Windows** (2007–2021) — uses Word rendering engine, the most restrictive
- **Gmail** (webmail + iOS/Android app)
- **Apple Mail** (macOS + iOS)
- **Yahoo Mail** (webmail + app)

---

## Analysis process

### 1. Detect the user's language
Always respond in the language the user wrote in. Default to English in this context.

### 2. Check external CSS / `<link>`
If the HTML contains `<link rel="stylesheet">` or `@import` inside a `<style>`:

> ⚠️ **Warning:** `<link>` and `@import` are not supported in most email clients (Gmail, Yahoo, AOL ignore them completely). **Strongly recommend using inline CSS** and `<style>` in `<head>` for properties that can't be inlined (like media queries and pseudo-classes).

### 3. Extract elements to check

Parse the HTML and identify:

**HTML tags:** `<video>`, `<audio>`, `<picture>`, `<svg>` (embedded), `<form>`, `<input>`, `<select>`, `<textarea>`, `<button>`, `<dialog>`, `<details>`, `<summary>`, HTML5 semantic elements (`<article>`, `<section>`, etc.), `<marquee>`, `<meter>`, `<progress>`, `<object>`

**HTML attributes:** `srcset`, `loading`, `hidden`, `dir`, `lang`

**CSS properties (inline and in `<style>`):**
- Layout: `display:flex`, `display:grid`, `position:fixed`, `position:sticky`, `gap`, `flex-direction`, `flex-wrap`
- Visual: `animation`, `@keyframes`, `transform`, `filter`, `backdrop-filter`, `clip-path`, `mix-blend-mode`, `opacity`
- Text: `font-size` with `rem`, `text-shadow`, `text-overflow`
- Background: `background-image` with `url()`, `linear-gradient`, `radial-gradient`, `conic-gradient`
- Other: `CSS variables (--custom)`, `calc()`, `min()`, `max()`, `clamp()`, `@font-face`, `@media` (variants), `@supports`

**CSS selectors (in `<style>`):**
- Pseudo-classes: `:hover`, `:checked`, `:nth-child`, `:not`, `:has()`
- Pseudo-elements: `::before`, `::after`
- CSS Nesting

**Images:** `<img src="*.svg">` (SVG as src), Base64 in src, `<img src="*.webp">`, `<img src="*.avif">`

### 4. Check compatibility

**Compatibility data — always filter before reading:**

1. Save the HTML to a temp file if needed (chat): write content to `/tmp/email_check.html`
2. Run: `node scripts/filter.js <file>` → generates `caniemail-context.json` with only the features present in the HTML
3. Read `caniemail-context.json` (typically 10–30 entries instead of 307)

Do NOT read `caniemail-slim.json` or `caniemail-data.json` directly — they are much larger than necessary.

If the user asks about a non-priority client (e.g. Thunderbird, ProtonMail, Samsung Email): run `node scripts/build.js <client-slug>` first to add that client to the data, then run `filter.js` against the resulting `caniemail-slim.json`.

Available non-priority client slugs: `thunderbird`, `samsung-email`, `sfr`, `orange`, `protonmail`, `hey`, `mail-ru`, `fastmail`, `laposte`, `t-online-de`, `free-fr`, `gmx`, `web-de`, `ionos-1and1`, `rainloop`, `wp-pl`, `aol`, `microsoft`.

For each identified element, evaluate support across the 4 priority clients using the filtered data:

**Support legend:**
- `y` = supported
- `a` = partially supported / buggy
- `n` = not supported
- `u` = unknown

**Severity criteria:**

| Severity | Criteria |
|----------|----------|
| 🔴 Critical | Not supported (`n`) in Outlook Windows OR Gmail desktop |
| 🟡 Warning | Partial support (`a`) in 2+ priority clients, OR not supported in 1 priority client |
| 🟢 Notice | Partial support in only 1 client, or works but with important caveats |

### 5. Generate the report

Report format — compact table:

```
## 📧 Email Compatibility

| # | Element / Property | Severity | Affected clients | Action |
|---|-------------------|----------|-----------------|--------|
| 1 | `background-clip:text` | 🔴 Critical | Outlook, Gmail, Yahoo | ✅ Fixed: `color:#ff0d2f` |
| 2 | `border-radius` on `<td>` | 🟡 Warning | Outlook | ⚠️ Flagged |
| 3 | `position:absolute` on bullets | 🟡 Warning | Outlook, Gmail | ⚠️ Flagged |

**X fixed · X flagged**
```

Action column legend:
- ✅ Fixed: [what was done]
- ⚠️ Flagged: [reason summarized in 1 line]

If no issues are found, state that in one line and praise the structure.

### 6. Generate the corrected HTML

**What can be fixed automatically:**
- Remove `<link rel="stylesheet">` and explain it must be inline
- Replace `display:flex` with `<table>` alternative when applicable
- Remove `@import` and comment the reason
- Add VML fallback for gradients in Outlook (if simple enough)
- Remove `position:fixed` and `position:sticky` (not supported in Outlook)
- Remove `transform` and `filter` (not supported in Gmail/Outlook)
- Convert `rem` to `px` for font-size
- Add `<!--[if mso]>...<![endif]-->` comments for Outlook where relevant

**What NOT to fix automatically (flag only):**
- `<video>` — depends on the developer's fallback strategy
- `<audio>` — same
- `<form>` / inputs — structure is very use-case specific
- Embedded `<svg>` — may or may not have a desired `<img>` fallback
- CSS variables — depends on the theming strategy
- Complex animations — developer needs to decide the fallback
- `@font-face` — design decision

**Corrected HTML output:**

- If used in **chat**: show the corrected HTML in a code block
- If used in **Claude Code**: edit the file directly with applied corrections, adding `// FIXED: [reason]` comments where relevant

### 7. Final note

Always mention at the end:
- How many issues were fixed automatically vs. only flagged
- Reference link: `https://www.caniemail.com` for additional manual lookups

---

## Common issues and their fixes

### `display:flex` in Outlook Windows
- **Problem:** Outlook 2007-2019 uses the Word engine and does not support flexbox
- **Fix:** Replace with `<table>` structure using `width` attributes

### `position:fixed` / `position:sticky`
- **Problem:** Not supported in Outlook Windows, Gmail
- **Fix:** Remove the property (element will fall back to normal flow)

### `background-image: url()` in Outlook Windows
- **Problem:** Not natively supported; requires VML
- **Fix:** Add VML block for Outlook + keep CSS for other clients

### `@font-face` in Gmail
- **Problem:** Gmail does not support external web fonts
- **Action:** Flag — ensure the fallback font-stack is adequate

### CSS Variables (`--color: #fff`)
- **Problem:** Outlook and Gmail do not support CSS variables
- **Action:** Flag — replace with fixed values where necessary

### `<video>` in Gmail/Outlook
- **Problem:** Not supported — tags are stripped
- **Action:** Flag — recommend fallback with `<img>` poster

### Gradients (`linear-gradient`, `radial-gradient`) in Outlook
- **Problem:** Not supported via CSS
- **Action:** For simple gradients, add VML equivalent

---

## Behavior in Claude Code

When running in Claude Code and the user mentions a file:
1. Read the `.html` file
2. Apply fixes directly to the file
3. Create a `.backup.html` backup copy before editing
4. Report what was changed

---

## Implementation notes

- Always preserve the original visual intent of the HTML
- Do not remove elements without explaining the reason
- When multiple solutions exist, prefer the most compatible one
- Compatibility priority: Outlook Windows > Gmail > Apple Mail > Yahoo
- Treat `mso-*` properties (Microsoft Office specific) as valid — they are intentional
- Respect conditional comments `<!--[if mso]>...<![endif]-->` — they are intentional
