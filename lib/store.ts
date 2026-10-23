import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, ITEMS_FILE, META_FILE, PROFILE_FILE, DIGEST_DIR } from './paths';
import type { Item, Meta, Profile } from './types';
import { DEFAULT_PROFILE } from './knowledge';
import { localDate } from './date';

function ensure() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(DIGEST_DIR, { recursive: true });
}

export function getProfile(): Profile {
  ensure();
  if (!fs.existsSync(PROFILE_FILE)) {
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(DEFAULT_PROFILE, null, 2));
    return DEFAULT_PROFILE;
  }
  try {
    return { ...DEFAULT_PROFILE, ...JSON.parse(fs.readFileSync(PROFILE_FILE, 'utf8')) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(p: Partial<Profile>) {
  ensure();
  const next = { ...getProfile(), ...p };
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(next, null, 2));
  return next;
}

export function getItems(): Item[] {
  ensure();
  if (!fs.existsSync(ITEMS_FILE)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf8'));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

const MAX_ITEMS = 5000;

export function saveItems(items: Item[]) {
  ensure();
  const sorted = [...items].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)).slice(0, MAX_ITEMS);
  fs.writeFileSync(ITEMS_FILE, JSON.stringify(sorted, null, 1));
  return sorted.length;
}

export function getMeta(): Meta {
  ensure();
  const base: Meta = { wikiHashes: {}, xCache: {}, sourceStatus: {} };
  if (!fs.existsSync(META_FILE)) return base;
  try {
    const raw = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
    return { ...base, ...raw, wikiHashes: raw.wikiHashes || {}, xCache: raw.xCache || {}, sourceStatus: raw.sourceStatus || {} };
  } catch {
    return base;
  }
}

export function saveMeta(meta: Meta) {
  ensure();
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));
}

export function getDeviceSnapshot(): import('./types').DeviceSnapshot | null {
  const p = path.join(DATA_DIR, 'device.json');
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

export function saveDeviceSnapshot(snap: import('./types').DeviceSnapshot) {
  ensure();
  fs.writeFileSync(path.join(DATA_DIR, 'device.json'), JSON.stringify(snap, null, 2));
}

export function saveDigest(date: string, markdown: string) {
  ensure();
  fs.writeFileSync(path.join(DIGEST_DIR, date + '.md'), markdown);
}

export function getDigest(date: string): string | null {
  const p = path.join(DIGEST_DIR, date + '.md');
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

export function listDigests(): string[] {
  ensure();
  return fs
    .readdirSync(DIGEST_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
    .sort()
    .reverse();
}

export function today(): string {
  return localDate();
}
