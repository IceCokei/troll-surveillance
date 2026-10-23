import { analyze } from '../lib/analyze';
import { buildDigest } from '../lib/digest';
import { buildDigestEn } from '../lib/digest-en';
import { cleanPostText } from '../lib/collect/xposts';
import { getItems, getMeta, getProfile, saveDigest, saveDigestEn, saveItems, today } from '../lib/store';
import type { RawItem } from '../lib/types';

const profile = getProfile();
const old = getItems();
const byId = new Map<string, ReturnType<typeof analyze>>();

for (const it of old) {
  const raw: RawItem = {
    source: it.source,
    kind: it.kind,
    author: it.author,
    title: it.kind === 'x' ? cleanPostText(it.title) : it.title,
    url: it.url,
    text: it.kind === 'x' ? cleanPostText(it.text || '') : it.text,
    publishedAt: it.publishedAt,
  };
  const fresh = analyze(raw, profile);
  fresh.fetchedAt = it.fetchedAt;
  const prev = byId.get(fresh.id);
  // 同 id 时保留更完整/更新的那条
  if (!prev || (prev.text || '').length < (fresh.text || '').length) byId.set(fresh.id, fresh);
}

const items = [...byId.values()].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
saveItems(items);
const meta = getMeta();
saveDigest(today(), buildDigest(today(), items, profile, meta));

const dup = old.length - items.length;
console.log('before=' + old.length + ' after=' + items.length + ' removed=' + dup + ' actionable=' + items.filter((i) => i.actionable).length);
const byKind: Record<string, number> = {};
for (const i of items) byKind[i.kind] = (byKind[i.kind] || 0) + 1;
console.log('by kind', byKind);
