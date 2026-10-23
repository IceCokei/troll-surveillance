import { analyze, itemId } from '../lib/analyze';
import { buildDigest } from '../lib/digest';
import { getItems, getMeta, getProfile, saveDigest, saveItems, today } from '../lib/store';
import type { RawItem } from '../lib/types';

const profile = getProfile();
const old = getItems();
let changed = 0;

function cleanWiki(s: string): string {
  return s
    .replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, '$1')
    .replace(/\[(https?:\/\/\S+)\]/g, '$1')
    .replace(/\[\[([^\]|]+)\|?[^\]]*\]\]/g, '$1')
    .replace(/\[[^\]]*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const next = old.map((it) => {
  const raw: RawItem = {
    source: it.source,
    kind: it.kind,
    author: it.author,
    title: it.title,
    url: it.url,
    text: it.text,
    publishedAt: it.publishedAt,
  };
  if (it.kind === 'wiki') {
    const cleaned = cleanWiki(it.text || '');
    const head = cleanWiki(it.title || '');
    raw.text = cleaned;
    raw.title = head;
  }
  const fresh = analyze(raw, profile);
  fresh.fetchedAt = it.fetchedAt; // 保留原入库时间，避免打乱当日分组
  if (fresh.actionable !== it.actionable || fresh.category !== it.category || fresh.score !== it.score) changed += 1;
  return fresh;
});

// 清洗后可能撞 id，去重后再入库
const dedup = new Map<string, typeof next[number]>();
for (const it of next) {
  const key = itemId(it);
  if (!dedup.has(key)) dedup.set(key, { ...it, id: key });
}
const finalItems = [...dedup.values()].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
saveItems(finalItems);
const meta = getMeta();
const md = buildDigest(today(), finalItems, profile, meta);
saveDigest(today(), md);

const actionable = finalItems.filter((i) => i.actionable);
console.log('reanalyzed=' + finalItems.length + ' changed=' + changed + ' actionable=' + actionable.length);
for (const a of actionable.slice(0, 10)) console.log('  ', a.score, a.source, '|', a.title.slice(0, 80), '|', a.actionNote.slice(0, 90));
