/**
 * 用当前（已去重的）items 重新生成全部每日简报，中英各一份。
 *
 * 同步只重写「今天」那一份，历史日期里的重复条目会一直留在文件里。
 * 数据清理完跑一次这个，历史简报才会跟着更新。
 *
 * 用法：npx tsx scripts/rebuild-digests.ts
 */
import { getItems, getMeta, getProfile, listDigests, saveDigest, saveDigestEn } from '../lib/store';
import { buildDigest } from '../lib/digest';
import { buildDigestEn } from '../lib/digest-en';
import { localDate } from '../lib/date';

const items = getItems();
const meta = getMeta();
const profile = getProfile();

const dates = new Set<string>(listDigests());
for (const i of items) dates.add(localDate(i.fetchedAt));

const ordered = [...dates].sort().reverse();
for (const d of ordered) {
  const dayCount = items.filter((i) => localDate(i.fetchedAt) === d).length;
  saveDigest(d, buildDigest(d, items, profile, meta));
  saveDigestEn(d, buildDigestEn(d, items, profile, meta));
  console.log('rebuilt', d, '| items', dayCount);
}
console.log('done', ordered.length, 'dates');
