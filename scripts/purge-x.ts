import { getItems, saveItems, getMeta, getProfile, saveDigest, today } from '../lib/store';
import { analyze } from '../lib/analyze';
import { buildDigest } from '../lib/digest';
import { cleanXText, isIosRelevant } from '../lib/xfilter';
import type { RawItem } from '../lib/types';

const profile = getProfile();
const all = getItems();
const keep: typeof all = [];
let dropped = 0;
let cleaned = 0;

for (const it of all) {
  if (it.kind !== 'x') { keep.push(it); continue; }
  const text = cleanXText(it.text || it.title || '');
  if (!isIosRelevant(text)) { dropped += 1; continue; }
  if (text !== it.text) cleaned += 1;
  const raw: RawItem = {
    source: it.source, kind: it.kind, author: it.author,
    title: cleanXText(it.title || ''), url: it.url, text, publishedAt: it.publishedAt,
  };
  const fresh = analyze(raw, profile);
  fresh.fetchedAt = it.fetchedAt;
  keep.push(fresh);
}

// 清洗后同一贴文可能出现两份（旧 id + 新 id），按 source+正文去重
const dedup = new Map<string, (typeof keep)[number]>();
for (const it of keep) {
  const key = it.kind === 'x' ? 'x|' + it.source + '|' + (it.text || '').slice(0, 120) : it.id;
  const prev = dedup.get(key);
  if (!prev || (it.text || '').length > (prev.text || '').length) dedup.set(key, it);
}
const final = [...dedup.values()];
console.log('去重后条目：', final.length);

saveItems(final);
saveDigest(today(), buildDigest(today(), final, profile, getMeta()));
console.log('x 条目清理：保留', keep.filter(i => i.kind === 'x').length, '｜删除不相关', dropped, '｜文本清洗', cleaned);
