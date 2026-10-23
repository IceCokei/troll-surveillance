import { fetchText } from './http';
import type { RawItem } from '../types';

function unescape(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseAtom(xml: string): { title: string; updated: string; link: string }[] {
  const out: { title: string; updated: string; link: string }[] = [];
  const entries = xml.split('<entry>').slice(1);
  for (const e of entries) {
    const title = unescape((e.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || '');
    const updated = (e.match(/<updated>([^<]+)<\/updated>/) || [])[1] || '';
    const link = (e.match(/<link[^>]*href="([^"]+)"/) || [])[1] || '';
    if (title) out.push({ title, updated, link });
  }
  return out;
}

/**
 * 通过 GitHub 的 commits.atom / releases.atom 读取仓库动态。
 * 不走 API，因此不受 60 次/小时的限额影响。
 */
export async function collectGithubAtom(repo: string, kind: 'commits' | 'releases' = 'commits'): Promise<RawItem[]> {
  const url = 'https://github.com/' + repo + '/' + (kind === 'commits' ? 'commits.atom' : 'releases.atom');
  const xml = await fetchText(url, { timeoutMs: 25000 });
  const name = repo.split('/')[1];
  return parseAtom(xml).slice(0, 8).map((e) => ({
    kind: 'github' as const,
    source: 'ghatom:' + repo + ':' + kind,
    author: repo,
    title: (kind === 'releases' ? name + ' release: ' : name + ': ') + e.title.slice(0, 150),
    text: e.title,
    url: e.link || 'https://github.com/' + repo,
    publishedAt: e.updated || new Date().toISOString(),
  }));
}
