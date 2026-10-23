import { fetchText } from './http';
import type { RawItem } from '../types';

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
      text: 'Apple 安全更新公告：' + title,
      url: href,
      publishedAt: new Date().toISOString(),
    });
    if (items.length >= 12) break;
  }
  return items;
}
