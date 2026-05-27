#!/usr/bin/env node
// Filters caniemail-slim.json to only features present in the given HTML.
// Output: caniemail-context.json in the skill root.
// Usage (from skill root):
//   node scripts/filter.js email.html
//   cat email.html | node scripts/filter.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SLIM = path.join(ROOT, 'caniemail-slim.json');
const OUT = path.join(ROOT, 'caniemail-context.json');

// Read HTML from file arg or stdin
const filePath = process.argv[2];
const html = filePath
  ? fs.readFileSync(filePath, 'utf8').toLowerCase()
  : fs.readFileSync('/dev/stdin', 'utf8').toLowerCase();

const slim = JSON.parse(fs.readFileSync(SLIM, 'utf8'));

// Entries where any one keyword match is enough (OR)
// Entries with colon-separated title like "display:flex" use AND (both parts must appear)
const OVERRIDES = {
  'amp':                               { any: ['amp4email', '<html amp'] },
  'bimi':                              { any: [] }, // server-side only
  'css-at-media-device-pixel-ratio':   { any: ['device-pixel-ratio'] },
  'css-at-media-hover':                { any: ['(hover)', '(any-hover)'] },
  'css-at-media-orientation':          { any: ['(orientation)'] },
  'css-at-media-prefers-color-scheme': { any: ['prefers-color-scheme'] },
  'css-at-media-prefers-reduced-motion':{ any: ['prefers-reduced-motion'] },
  'css-block-inline-size':             { any: ['block-size', 'inline-size'] },
  'css-border-inline-block':           { any: ['border-inline', 'border-block'] },
  'css-border-inline-block-individual':{ any: ['border-inline', 'border-block'] },
  'css-border-inline-block-longhand':  { any: ['border-inline', 'border-block'] },
  'css-border-radius-logical':         { any: ['border-start-start', 'border-start-end', 'border-end-start', 'border-end-end'] },
  'css-column-layout-properties':      { any: ['column-count', 'column-gap', 'column-width', 'column-rule'] },
  'css-function-clamp':                { any: ['clamp('] },
  'css-function-light-dark':           { any: ['light-dark('] },
  'css-function-max':                  { any: ['max('] },
  'css-function-min':                  { any: ['min('] },
  'css-gap':                           { any: ['gap:', 'gap ;', 'column-gap', 'row-gap'] },
  'css-grid-template':                 { any: ['grid-template'] },
  'css-inert-attribute':               { any: ['inert'] },
  'css-intrinsic-size':                { any: ['fit-content', 'min-content', 'max-content'] },
  'css-margin-block-start-end':        { any: ['margin-block-start', 'margin-block-end'] },
  'css-margin-inline-block':           { any: ['margin-inline', 'margin-block'] },
  'css-margin-inline-start-end':       { any: ['margin-inline-start', 'margin-inline-end'] },
  'css-modern-color':                  { any: ['lch(', 'oklch(', 'lab(', 'oklab('] },
  'css-nesting':                       { any: ['& '] },
  'css-padding-block-start-end':       { any: ['padding-block-start', 'padding-block-end'] },
  'css-padding-inline-block':          { any: ['padding-inline', 'padding-block'] },
  'css-padding-inline-start-end':      { any: ['padding-inline-start', 'padding-inline-end'] },
  'css-selector-adjacent-sibling':     { any: [' + '] },
  'css-selector-attribute':            { any: ['['] },
  'css-selector-chaining':             { any: [] }, // always skip
  'css-selector-child':                { any: [' > '] },
  'css-selector-class':                { any: ['class='] },
  'css-selector-descendant':           { any: ['<style'] }, // present if CSS exists
  'css-selector-general-sibling':      { any: [' ~ '] },
  'css-selector-grouping':             { any: ['<style'] },
  'css-selector-id':                   { any: ['id='] },
  'css-selector-type':                 { any: ['<style'] },
  'css-selector-universal':            { any: ['* {', '*{', '*,'] },
  'css-sytem-ui':                      { any: ['system-ui', 'ui-serif', 'ui-sans-serif', 'ui-rounded', 'ui-monospace'] },
  'css-unit-calc':                     { any: ['calc('] },
  'css-variables':                     { any: ['var(', 'var (', '  --', ' --', '\n--'] },
  'html-anchor-links':                 { any: ['href="#', "href='#"] },
  'html-image-maps':                   { any: ['<map', 'usemap='] },
  'html-lists':                        { any: ['<ul', '<ol', '<dl'] },
  'html-mailto-links':                 { any: ['mailto:'] },
  'html-meta-color-scheme':            { any: ['color-scheme'] },
  'image-apng':                        { any: ['.apng'] },
  'image-avif':                        { any: ['.avif', 'image/avif'] },
  'image-base64':                      { any: ['data:image'] },
  'image-bmp':                         { any: ['.bmp', 'image/bmp'] },
  'image-gif':                         { any: ['.gif', 'image/gif'] },
  'image-hdr':                         { any: ['.hdr'] },
  'image-heif':                        { any: ['.heif', '.heic', 'image/heif'] },
  'image-ico':                         { any: ['.ico', 'image/x-icon'] },
  'image-jpg':                         { any: ['.jpg', '.jpeg', 'image/jpeg'] },
  'image-mp4':                         { any: ['.mp4'] },
  'image-png':                         { any: ['.png', 'image/png'] },
  'image-svg':                         { any: ['.svg', 'image/svg'] },
  'image-tiff':                        { any: ['.tif', '.tiff', 'image/tiff'] },
  'image-webp':                        { any: ['.webp', 'image/webp'] },
};

function getKeywords(entry) {
  if (entry.slug in OVERRIDES) return OVERRIDES[entry.slug];

  const t = entry.title.toLowerCase();

  // HTML: "<tag> element"
  const elemMatch = t.match(/^<([^>]+)>\s*/);
  if (elemMatch) return { any: [`<${elemMatch[1]}`] };

  // HTML: "<input type="X"> element"
  const inputMatch = t.match(/<input type="([^"]+)">/);
  if (inputMatch) return { any: [`type="${inputMatch[1]}"`, `type='${inputMatch[1]}'`] };

  // HTML: "X attribute"
  const attrMatch = t.match(/^([\w-]+)\s+attribute$/);
  if (attrMatch) return { any: [`${attrMatch[1]}=`] };

  // CSS at-rules: title starts with "@"
  if (t.startsWith('@')) {
    const rule = t.split(/[\s(,]/)[0];
    return { any: [rule] };
  }

  // CSS property with value: "display:flex" → AND both parts
  if (t.includes(':') && !t.startsWith(':') && !t.startsWith('::')) {
    const [prop, val] = t.split(':');
    return { all: [prop.trim(), val.trim()] };
  }

  // CSS pseudo-class: ":hover", ":nth-child"
  if (t.startsWith(':') && !t.startsWith('::')) {
    return { any: [t.split('(')[0]] };
  }

  // CSS pseudo-element: "::after"
  if (t.startsWith('::')) {
    return { any: [t] };
  }

  // CSS unit: "rem unit" — match only when preceded by a digit
  const unitMatch = t.match(/^([\w%]+)\s+unit$/);
  if (unitMatch) return { unit: unitMatch[1] };

  // CSS function ending in ()
  if (t.endsWith('()')) {
    return { any: [t.replace('()', '(')] };
  }

  // Plain CSS property or keyword
  return { any: [t.split(/[\s,(&]/)[0]] };
}

function matches(entry, h) {
  const kw = getKeywords(entry);
  if (!kw) return false;
  if (kw.all) return kw.all.every(k => h.includes(k));
  // Unit entries: require the unit to be preceded by a digit (e.g. "16px", "1.5rem")
  if (kw.unit) return new RegExp('[0-9]' + kw.unit + '[^a-z0-9]').test(h);
  if (kw.any) return kw.any.some(k => h.includes(k));
  return false;
}

const matched = slim.data.filter(e => matches(e, html));

const context = {
  generated: new Date().toISOString().slice(0, 10),
  source_version: slim.source_version,
  clients: slim.clients,
  filtered_from: slim.data.length,
  data: matched,
};

fs.writeFileSync(OUT, JSON.stringify(context, null, 2));
console.log(`${matched.length}/${slim.data.length} features matched → ${OUT}`);
