import { getItems } from './store';
import type { Item } from './types';
import { byStateThenTime, withinYears } from './fresh';

/** 展示用：过滤 5 年以上的旧消息，按时间倒序 */
export function getVisibleItems(): Item[] {
  return getItems()
    .filter((i) => withinYears(i.publishedAt))
    .sort(byStateThenTime);
}

export function getVisibleItemsByScore(): Item[] {
  return getVisibleItems().sort((a, b) => b.score - a.score || byStateThenTime(a, b));
}
