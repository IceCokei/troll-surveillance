import { XMLParser } from 'fast-xml-parser';
import { fetchText } from './http';
import type { RawItem } from '../types';

const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });

function asArray<T>(v: T | T[] | undefined): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function stripHtml(s: string): string {
  return String(s || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function collectFeed(url: string, name: string): Promise<RawItem[]> {
  const xml = await fetchText(url, { timeoutMs: 25000 });
  const doc: any = parser.parse(xml);
  const items: RawItem[] = [];

  const rssItems = asArray(doc?.rss?.channel?.item);
  for (const it of rssItems.slice(0, 15)) {
    const title = stripHtml(it.title);
    const link = typeof it.link === 'string' ? it.link : it.link?.['#text'] || '';
    const desc = stripHtml(it['content:encoded'] || it.description || '');
    items.push({
      kind: 'rss',
      source: 'rss:' + name,
      author: name,
      title: title.slice(0, 200),
      text: desc.slice(0, 1500),
      url: link || url,
      publishedAt: new Date(it.pubDate || it.date || Date.now()).toISOString(),
    });
  }

  const atomEntries = asArray(doc?.feed?.entry);
  for (const e of atomEntries.slice(0, 20)) {
    const link = Array.isArray(e.link) ? e.link.find((l: any) => l['@_rel'] === 'alternate')?.['@_href'] || e.link[0]?.['@_href'] : e.link?.['@_href'] || '';
    const title = stripHtml(e.title?.['#text'] || e.title);
    const content = stripHtml(e.content?.['#text'] || e.content || e.summary?.['#text'] || e.summary || '');
    items.push({
      kind: 'rss',
      source: 'rss:' + name,
      author: stripHtml(e.author?.name) || name,
      title: title.slice(0, 200),
      text: content.slice(0, 1500),
      url: link || url,
      publishedAt: new Date(e.updated || e.published || Date.now()).toISOString(),
    });
  }

  return items.filter((i) => i.title);
}
