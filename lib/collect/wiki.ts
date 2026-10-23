import crypto from 'node:crypto';
import { fetchJson } from './http';
import type { RawItem } from '../types';

export async function fetchWikiPage(page: string): Promise<{ hash: string; text: string; title: string }> {
  // wikitext 用于变更检测（更敏感）
  const raw = await fetchJson<any>(
    'https://theapplewiki.com/api.php?action=parse&prop=wikitext&format=json&page=' + encodeURIComponent(page),
    { timeoutMs: 25000 }
  );
  const wikitext = String(raw?.parse?.wikitext?.['*'] || '');

  // extract 用于展示（干净的开头段落，不含 infobox）
  let extract = '';
  try {
    const ex = await fetchJson<any>(
      'https://theapplewiki.com/api.php?action=query&prop=extracts&explaintext=1&exintro=1&format=json&titles=' +
        encodeURIComponent(page),
      { timeoutMs: 25000 }
    );
    const pages = ex?.query?.pages || {};
    const first: any = Object.values(pages)[0];
    extract = String(first?.extract || '');
  } catch {
    /* 拿不到 extract 就退回 wikitext 摘要 */
  }

  const plain =
    extract ||
    wikitext
      .replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, '$1')
      .replace(/\[\[([^\]|]+)\|?[^\]]*\]\]/g, '$1')
      .replace(/[{}|=]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  return {
    hash: crypto.createHash('sha1').update(wikitext).digest('hex').slice(0, 12),
    text: plain,
    title: String(raw?.parse?.title || page),
  };
}

export function wikiItem(page: string, text: string, changed: boolean): RawItem {
  return {
    kind: 'wiki',
    source: 'wiki:' + page,
    author: 'The Apple Wiki',
    title: (changed ? '[词条更新] ' : '[词条快照] ') + page,
    text: text.slice(0, 1600),
    url: 'https://theapplewiki.com/wiki/' + encodeURIComponent(page.replace(/ /g, '_')),
    publishedAt: new Date().toISOString(),
  };
}
