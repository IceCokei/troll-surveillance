import { fetchText } from './http';

export interface XPost {
  handle: string;
  id?: string;
  url: string;
  date?: string;
  text: string;
  video: boolean;
  images: number;
}

const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

function parseDate(s: string): string | undefined {
  const m = s.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(?:,\s*(\d{4}))?/);
  if (!m) return undefined;
  const mon = MONTHS[m[1]];
  const day = Number(m[2]);
  const year = m[3] ? Number(m[3]) : new Date().getFullYear();
  let iso = new Date(Date.UTC(year, mon - 1, day, 12)).toISOString().slice(0, 10);
  if (!m[3] && new Date(iso).getTime() > Date.now() + 86400000) {
    iso = new Date(Date.UTC(year - 1, mon - 1, day, 12)).toISOString().slice(0, 10);
  }
  return iso;
}

export function cleanPostText(raw: string): string {
  let t = String(raw || '');
  t = t.replace(/##\s*Log in or sign up for X[\s\S]*$/i, ' ');
  t = t.replace(/\b(?:Video|GIF)\s*\d*\b/gi, ' ');
  t = t.replace(/\b[\w .]{1,24}@[A-Za-z0-9_]{2,}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}(?:,\s*\d{4})?/g, ' ');
  t = t.replace(/^\s*(?:[\w.\-]+@[A-Za-z0-9_.@\-]+\s*)+/, ' ');
  t = t.replace(/^\s*@[A-Za-z0-9_]+\s*/, ' ');
  t = t.replace(/^\s*(?:Pinned|Replying to\s+@\w+)\s*/i, ' ');
  t = t.replace(/^\s*[\w.\-]+@\s*/, ' ');
  t = t.replace(/^\s*[,;]\s*\d{4}\s+/, ' ');
  t = t.replace(/^\s*[,;:]\s*/, ' ');
  t = t.replace(/\s\d+(?:\.\d+)?[KM]?(?:\s+\d+(?:\.\d+)?[KM]?){1,4}\s*$/g, ' ');
  t = t.replace(/\s\d[\d.,]*\s*[KM]?\s*Followers?[\s\S]*$/i, ' ');
  t = t.replace(/[\[\]]/g, ' ');
  t = t.replace(/\s+([,.;:!?])/g, '$1');
  return t.replace(/\s+/g, ' ').trim();
}

function clean(raw: string): string {
  return raw
    .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[Video \d+\]\(blob:[^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\]\s*\((?:https?:)?\/\/[^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 通过 r.jina.ai 读取 X 主页，解析出可引用的单条贴文（含 status id） */
export async function fetchProfilePosts(handle: string, opts: { limit?: number } = {}): Promise<XPost[]> {
  const md = await fetchText('https://r.jina.ai/https://x.com/' + handle, { timeoutMs: 45000 });
  const body = md.split('Markdown Content:')[1] || md;
  const blocks = body.split(/\n\*\s{2,}\[/g).slice(1);
  const posts: XPost[] = [];
  const seen = new Set<string>();

  for (const block of blocks.slice(0, opts.limit ?? 20)) {
    const statuses = [...block.matchAll(/https:\/\/x\.com\/([A-Za-z0-9_]+)\/status\/(\d+)/g)];
    const self = statuses.find((m) => m[1].toLowerCase() === handle.toLowerCase());
    const id = self?.[2] || statuses[0]?.[2];
    const url = id ? 'https://x.com/' + handle + '/status/' + id : 'https://x.com/' + handle;

    let text = clean(block);
    const d = text.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}(?:,\s*\d{4})?\b/);
    if (d?.index !== undefined && d.index < 100) {
      text = text.slice(d.index + d[0].length).trim();
    }
    text = text.replace(/^[)\]\s:|-]+/, '').trim();
    if (text.length < 12) continue;

    const key = id ? 'id:' + id : 't:' + text.slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);

    posts.push({
      handle,
      id,
      url,
      date: parseDate(block),
      text: text.slice(0, 1200),
      video: /\[Video \d+\]|amplify_video|video\.twimg/i.test(block),
      images: (block.match(/pbs\.twimg\.com\/(?:media|amplify)/g) || []).length,
    });
  }
  return posts;
}
