import path from 'node:path';

export const ROOT = process.cwd();
export const DATA_DIR = path.join(ROOT, 'data');
export const ITEMS_FILE = path.join(DATA_DIR, 'items.json');
export const META_FILE = path.join(DATA_DIR, 'meta.json');
export const PROFILE_FILE = path.join(DATA_DIR, 'profile.json');
export const DIGEST_DIR = path.join(DATA_DIR, 'digests');
