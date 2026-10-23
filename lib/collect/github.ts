import { fetchJson } from './http';
import type { RawItem } from '../types';

function headers(): Record<string, string> {
  const h: Record<string, string> = { accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) h.authorization = 'Bearer ' + process.env.GITHUB_TOKEN;
  return h;
}

export async function collectGithubReleases(repo: string): Promise<RawItem[]> {
  const data = await fetchJson<any[]>(
    'https://api.github.com/repos/' + repo + '/releases?per_page=5',
    { headers: headers(), timeoutMs: 20000 }
  );
  return (data || []).map((r) => ({
    kind: 'github' as const,
    source: 'gh:' + repo,
    author: repo,
    title: repo + ' ' + (r.tag_name || r.name || 'release'),
    text: String(r.body || '').slice(0, 2000),
    url: r.html_url || 'https://github.com/' + repo + '/releases',
    publishedAt: r.published_at || r.created_at || new Date().toISOString(),
  }));
}

export async function collectGithubCommits(repo: string): Promise<RawItem[]> {
  const data = await fetchJson<any[]>(
    'https://api.github.com/repos/' + repo + '/commits?per_page=5',
    { headers: headers(), timeoutMs: 20000 }
  );
  return (data || []).map((c) => ({
    kind: 'github' as const,
    source: 'gh:' + repo + ':commits',
    author: repo,
    title: 'commit ' + String(c.sha || '').slice(0, 7) + ' ' + String(c.commit?.message || '').split('\n')[0].slice(0, 120),
    text: String(c.commit?.message || '').slice(0, 500),
    url: c.html_url || 'https://github.com/' + repo,
    publishedAt: c.commit?.author?.date || new Date().toISOString(),
  }));
}
