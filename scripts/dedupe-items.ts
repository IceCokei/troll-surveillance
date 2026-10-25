/**
 * 历史数据修复：用当前的身份键重算 id，合并同一贴文的多次抓取。
 *
 * 背景：早先 itemId 直接对标题做哈希，而 X 正文里带着 "17h"、"[ 2 52"
 * 这类每轮都会变的相对时间与互动计数，于是同一条推文每抓一次就多一条。
 * 现在有 /status/<id> 的条目按 id 认同，其余按 stableTitle 归一。
 *
 * 用法：npx tsx scripts/dedupe-items.ts [--dry]
 */
import { itemId, stableTitle, contentKey } from '../lib/analyze';
import { cleanXText, isIosRelevant } from '../lib/xfilter';
import { isUselessSystemUpdate } from '../lib/items';
import { getItems, saveItems } from '../lib/store';
import type { Item } from '../lib/types';

const dry = process.argv.includes('--dry');

function cleanliness(it: Item): number {
  // 越干净（等于归一化结果）越优先；其次标题更短、抓取更早
  const clean = stableTitle(it.title) === it.title ? 0 : 1;
  return clean * 1000 + it.title.length;
}

const items = getItems();
const byId = new Map<string, Item>();

/** X 条目的历史标题里还留着 "17h"、"[ 2 52"，按现在的清洗规则重洗一遍 */
function retitle(it: Item): Item {
  if (!it.source.startsWith('x:')) return it;
  const cleaned = cleanXText(it.title);
  return cleaned.length >= 8 ? { ...it, title: cleaned } : it;
}

for (const raw of items) {
  const it = retitle(raw);
  const id = itemId(it);
  const prev = byId.get(id);
  if (!prev) {
    byId.set(id, { ...it, id });
    continue;
  }
  const keep = cleanliness(it) < cleanliness(prev) ? it : prev;
  const other = keep === it ? prev : it;
  byId.set(id, {
    ...keep,
    id,
    fetchedAt: other.fetchedAt < keep.fetchedAt ? other.fetchedAt : keep.fetchedAt,
    publishedAt: other.publishedAt < keep.publishedAt ? other.publishedAt : keep.publishedAt,
  });
}

// 第二轮：内容级合并（同一推文换了 URL、同一篇被两个 sub 转发）
const byContent = new Map<string, Item>();
let crossSource = 0;
for (const it of byId.values()) {
  const k = contentKey(it);
  if (!k) {
    byContent.set('id:' + it.id, it);
    continue;
  }
  const prev = byContent.get(k);
  if (!prev) {
    byContent.set(k, it);
    continue;
  }
  // 保留发布更早的那条（原始出处），其余字段取较早值
  const keep = it.publishedAt < prev.publishedAt ? it : prev;
  byContent.set(k, { ...keep, fetchedAt: prev.fetchedAt < it.fetchedAt ? prev.fetchedAt : it.fetchedAt });
  crossSource += 1;
}

// 第三轮：比本机还旧的系统更新公告（Apple 安全公告 / 平台推送）没有任何决策价值
let obsolete = 0;
for (const [k, it] of [...byContent.entries()]) {
  if (!isUselessSystemUpdate(it)) continue;
  byContent.delete(k);
  obsolete += 1;
}

// 第四轮（可选）：清掉综合型 subreddit 里混进来的水帖
let purged = 0;
if (process.argv.includes('--purge-offtopic')) {
  for (const [k, it] of [...byContent.entries()]) {
    if (!it.source.startsWith('rss:r/')) continue;
    if (isIosRelevant(it.title + ' ' + (it.text || ''))) continue;
    byContent.delete(k);
    purged += 1;
  }
}

const merged = [...byContent.values()].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
console.log('before', items.length, 'after', merged.length, 'merged', items.length - merged.length, '(cross-source', crossSource + ', obsolete', obsolete + ', purged', purged + ')');

const sample = [...byId.values()].filter((i) => i.source === 'x:@Lakr233').slice(0, 4);
for (const s of sample) console.log('  keep', s.id, '|', s.title.slice(0, 70));

if (!dry) {
  saveItems(merged);
  console.log('written');
}