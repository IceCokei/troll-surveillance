import { getItems } from './store';
import type { Item } from './types';
import { byStateThenTime, withinYears } from './fresh';

/**
 * 系统更新类（Apple 安全公告 / 平台推送）如果版本比你的机器还低，
 * 对「我现在能不能用」这个问题永远是 0 信息，直接不进展示层。
 * 其它类别的 old build 情报仍然保留（有历史价值）。
 */
export function isUselessSystemUpdate(i: Item): boolean {
  const systemUpdate = i.source === 'apple:security' || i.source === 'apple:releases';
  return systemUpdate && i.deviceRelevance === 'obsolete';
}

/** 展示用：过滤 5 年以上的旧消息，按时间倒序 */
export function getVisibleItems(): Item[] {
  return getItems()
    .filter((i) => withinYears(i.publishedAt))
    .filter((i) => !isUselessSystemUpdate(i))
    .sort(byStateThenTime);
}

export function getVisibleItemsByScore(): Item[] {
  return getVisibleItems().sort((a, b) => b.score - a.score || byStateThenTime(a, b));
}