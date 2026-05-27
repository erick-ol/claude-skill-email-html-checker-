#!/usr/bin/env node
// Generates caniemail-slim.json (4 priority clients, latest version only).
// With extra client slugs as args, also generates caniemail-extended.json.
// Usage (from skill root):
//   node scripts/build.js
//   node scripts/build.js thunderbird protonmail samsung-email

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'caniemail-data.json');
const SLIM_OUT = path.join(ROOT, 'caniemail-slim.json');
const EXT_OUT = path.join(ROOT, 'caniemail-extended.json');

const PRIORITY = {
  'outlook': 'windows',
  'gmail': 'desktop-webmail',
  'apple-mail': 'macos',
  'yahoo': 'desktop-webmail',
};

const extraClients = process.argv.slice(2);

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));

function latestSupport(platformObj) {
  if (!platformObj) return 'u';
  const keys = Object.keys(platformObj);
  if (!keys.length) return 'u';
  const val = platformObj[keys[keys.length - 1]];
  return val ? val.replace(/\s+#\d+.*$/, '') : 'u';
}

function buildEntry(feature, clients) {
  const support = {};
  for (const [client, platform] of Object.entries(clients)) {
    const platforms = feature.stats?.[client];
    if (!platforms) { support[`${client}/${platform}`] = 'u'; continue; }
    if (platform === '*') {
      for (const [p, versions] of Object.entries(platforms)) {
        support[`${client}/${p}`] = latestSupport(versions);
      }
    } else {
      support[`${client}/${platform}`] = latestSupport(platforms[platform]);
    }
  }
  const entry = { slug: feature.slug, title: feature.title, category: feature.category, support };
  if (feature.notes_by_num && Object.keys(feature.notes_by_num).length) {
    entry.notes = feature.notes_by_num;
  }
  return entry;
}

// Slim: priority clients only
const slimData = raw.data.map(f => buildEntry(f, PRIORITY));
const slim = {
  generated: new Date().toISOString().slice(0, 10),
  source_version: raw.api_version,
  clients: Object.entries(PRIORITY).map(([c, p]) => `${c}/${p}`),
  data: slimData,
};
fs.writeFileSync(SLIM_OUT, JSON.stringify(slim, null, 2));
console.log(`Written ${SLIM_OUT} (${(fs.statSync(SLIM_OUT).size / 1024).toFixed(1)} KB, ${slimData.length} features)`);

// Extended: priority + requested extra clients (all their platforms)
if (extraClients.length) {
  const extClients = { ...PRIORITY };
  for (const c of extraClients) extClients[c] = '*';
  const extData = raw.data.map(f => buildEntry(f, extClients));
  const ext = {
    generated: new Date().toISOString().slice(0, 10),
    source_version: raw.api_version,
    clients: Object.entries(extClients).map(([c, p]) => p === '*' ? `${c}/*` : `${c}/${p}`),
    extra_clients: extraClients,
    data: extData,
  };
  fs.writeFileSync(EXT_OUT, JSON.stringify(ext, null, 2));
  console.log(`Written ${EXT_OUT} (${(fs.statSync(EXT_OUT).size / 1024).toFixed(1)} KB, extra: ${extraClients.join(', ')})`);
}
