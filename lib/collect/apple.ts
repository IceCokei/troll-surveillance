import { fetchText } from './http';
import type { RawItem } from '../types';
import { APPLE_RELEASES_URL, getOsVersions, latestPerPlatform, latestPush } from '../osversions';

/** Apple 安全更新页：抓取 iOS/iPadOS 相关条目 */
export async function collectAppleSecurity(): Promise<RawItem[]> {
  const html = await fetchText('https://support.apple.com/en-us/100100', { timeoutMs: 25000 });
  const items: RawItem[] = [];
  const anchorRe = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(html))) {
    const href = m[1].startsWith('http') ? m[1] : 'https://support.apple.com' + m[1];
    const title = m[2].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    if (!/ios|ipados/i.test(title)) continue;
    if (!/support\.apple\.com/.test(href)) continue;
    if (seen.has(href + title)) continue;
    seen.add(href + title);
    items.push({
      kind: 'apple',
      source: 'apple:security',
      author: 'Apple',
      title: title.slice(0, 200),
      text: 'Apple security update: ' + title,
      url: href,
      publishedAt: new Date().toISOString(),
    });
    if (items.length >= 12) break;
  }
  return items;
}
/**
 * Apple 平台版本推送（官方 releases RSS）
 * 只把「最近一次多平台推送」写成情报，避免每轮把 40 多条历史版本倒进时间线。
 */
export async function collectAppleReleases(): Promise<RawItem[]> {
  const snap = await getOsVersions({ maxAgeMs: 60_000 });
  const push = latestPush(snap.releases);
  const list = push && push.items.length > 1 ? push.items : latestPerPlatform(snap.releases);
  return list.map((r) => ({
    kind: 'apple' as const,
    source: 'apple:releases',
    author: 'Apple',
    title: r.platform + ' ' + r.version + (r.label ? ' ' + r.label : '') + ' (' + r.build + ')',
    text: 'Apple push: ' + r.platform + ' ' + r.version + ' build ' + r.build + ' (' + r.channel + ')',
    url: r.url || APPLE_RELEASES_URL,
    publishedAt: r.publishedAt,
  }));
}
