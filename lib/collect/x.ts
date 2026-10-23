import { fetchText } from './http';
import type { RawItem } from '../types';
import { cleanXText, isIosRelevant } from '../xfilter';

const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

function parseInlineDate(s: string): string | null {
  const m = s.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(?:,\s*(\d{4}))?/);
  if (!m) return null;
  const mon = MONTHS[m[1]];
  const day = parseInt(m[2], 10);
  const year = m[3] ? parseInt(m[3], 10) : new Date().getFullYear();
  let d = new Date(Date.UTC(year, mon - 1, day, 12, 0, 0));
  if (!m[3] && d.getTime() > Date.now() + 86400000) d = new Date(Date.UTC(year - 1, mon - 1, day, 12, 0, 0));
  return d.toISOString();
}

function cleanText(raw: string): string {
  return raw
    .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[Video \d+\]\(blob:[^)]*\)/g, '[视频] ')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\]\s*\((?:https?:)?\/\/[^)]*\)/g, ' ')
    .replace(/\]\([^)]{0,120}\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 通过 r.jina.ai 读取 X 主页 markdown（无需 API key），解析最近若干条贴文。
 * 调用方需按 meta.xCache 做冷却，避免触发代理限流。
 */
export async function collectX(handle: string): Promise<RawItem[]> {
  const md = await fetchText('https://r.jina.ai/https://x.com/' + handle, { timeoutMs: 35000 });
  const body = md.split('Markdown Content:')[1] || md;
  const blocks = body.split(/\n\*\s{2,}\[/g).slice(1);

  const items: RawItem[] = [];
  for (const block of blocks.slice(0, 15)) {
    const statusMatch = block.match(/https:\/\/x\.com\/([A-Za-z0-9_]+)\/status\/(\d+)/);
    const url = statusMatch ? 'https://x.com/' + statusMatch[1] + '/status/' + statusMatch[2] : 'https://x.com/' + handle;

    let text = cleanXText(cleanText(block));
    // 去掉 "显示名@账号 日期" 前缀
    const dateMatch = text.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}(?:,\s*\d{4})?\b/);
    if (dateMatch && dateMatch.index !== undefined && dateMatch.index < 90) {
      text = text.slice(dateMatch.index + dateMatch[0].length).trim();
    }
    text = text.replace(/^[)\]\s:|-]+/, '').trim();
    if (text.length < 12) continue;
    if (!isIosRelevant(text)) continue;

    items.push({
      kind: 'x',
      source: 'x:@' + handle,
      author: '@' + handle,
      title: text.slice(0, 160),
      text: text.slice(0, 1500),
      url,
      publishedAt: parseInlineDate(block) || new Date().toISOString(),
    });
  }
  return items;
}
