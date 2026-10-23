import { analyze } from './analyze';
import { collectAppleReleases, collectAppleSecurity } from './collect/apple';
import { collectGithubCommits, collectGithubReleases } from './collect/github';
import { collectGithubAtom } from './collect/ghatom';
import { collectRelaxin } from './collect/relaxin';
import { TS_TOOLS } from './trollstore';
import { fetchSigning } from './collect/ipsw';
import { collectFeed } from './collect/rss';
import { fetchWikiPage, wikiItem } from './collect/wiki';
import { collectX } from './collect/x';
import { GITHUB_REPOS, RSS_FEEDS, WIKI_PAGES, X_HANDLES } from './knowledge';
import { getItems, getMeta, getProfile, saveDigest, saveDigestEn, saveItems, saveMeta, today } from './store';
import { buildDigest } from './digest';
import { buildDigestEn } from './digest-en';
import type { Item, Meta, RawItem } from './types';

export interface SyncResult {
  startedAt: string;
  finishedAt: string;
  fetched: number;
  added: number;
  skipped: number;
  errors: { source: string; message: string }[];
  digestPath: string | null;
  actionable: number;
}

const X_COOLDOWN_MS = 10 * 60 * 1000; // 与 600 秒监控同频
const X_PER_RUN = 3; // 每轮最多抓 3 个账号，按最久未更新的轮换

export async function runSync(opts: { force?: boolean } = {}): Promise<SyncResult> {
  const startedAt = new Date().toISOString();
  const profile = getProfile();
  const meta: Meta = getMeta();
  const raw: RawItem[] = [];
  const errors: { source: string; message: string }[] = [];

  const mark = (src: string, ok: boolean, count: number, message?: string) => {
    meta.sourceStatus[src] = { ok, at: new Date().toISOString(), count, message };
  };

  // ---- X（经 jina 代理）：600 秒节奏 + 每轮限量轮换
  const xCandidates = X_HANDLES
    .map((h) => ({ h, at: new Date(meta.xCache['x:' + h]?.at || 0).getTime() }))
    .filter(({ at }) => opts.force || Date.now() - at >= X_COOLDOWN_MS)
    .sort((a, b) => a.at - b.at);
  const xBatch = opts.force ? xCandidates.map((c) => c.h) : xCandidates.slice(0, X_PER_RUN).map((c) => c.h);

  for (const handle of X_HANDLES) {
    if (!xBatch.includes(handle)) {
      mark('x:@' + handle, true, 0, 'queued (rotating)');
      continue;
    }
    try {
      const items = await collectX(handle);
      raw.push(...items);
      meta.xCache['x:' + handle] = { at: new Date().toISOString(), digest: items.map((i) => i.title).join('|').slice(0, 500) };
      mark('x:@' + handle, true, items.length);
    } catch (e: any) {
      errors.push({ source: 'x:@' + handle, message: String(e?.message || e) });
      mark('x:@' + handle, false, 0, String(e?.message || e));
    }
  }

  // ---- GitHub releases + commits
  for (const repo of GITHUB_REPOS) {
    const until = meta.ghCooldown?.[repo] || 0;
    if (until > Date.now()) {
      mark('gh:' + repo, true, 0, 'rate-limit cooldown');
      continue;
    }
    try {
      const rel = await collectGithubReleases(repo);
      raw.push(...rel);
      mark('gh:' + repo, true, rel.length);
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes('403')) {
        meta.ghCooldown = { ...(meta.ghCooldown || {}), [repo]: Date.now() + 60 * 60 * 1000 };
      }
      errors.push({ source: 'gh:' + repo, message: msg });
      mark('gh:' + repo, false, 0, msg);
    }
    try {
      const commits = await collectGithubCommits(repo);
      raw.push(...commits);
      mark('gh:' + repo + ':commits', true, commits.length);
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes('403')) {
        meta.ghCooldown = { ...(meta.ghCooldown || {}), [repo]: Date.now() + 60 * 60 * 1000 };
      }
      errors.push({ source: 'gh:' + repo + ':commits', message: msg });
      mark('gh:' + repo + ':commits', false, 0, msg);
    }
  }

  // ---- TrollStore 生态仓库（atom，不受 API 限额影响）
  for (const tool of TS_TOOLS) {
    if (tool.repo === 'opa334/TrollStore') continue; // 已经在上面用 API 抓过
    try {
      const items = await collectGithubAtom(tool.repo, 'commits');
      raw.push(...items);
      mark('atom:' + tool.repo, true, items.length);
    } catch (e: any) {
      const msg = String(e?.message || e);
      errors.push({ source: 'atom:' + tool.repo, message: msg });
      mark('atom:' + tool.repo, false, 0, msg);
    }
  }

  // ---- RSS
  for (const feed of RSS_FEEDS) {
    const until = meta.feedCooldown?.[feed.name] || 0;
    if (until > Date.now()) {
      mark('rss:' + feed.name, true, 0, 'cooldown (429)');
      continue;
    }
    try {
      const items = await collectFeed(feed.url, feed.name);
      raw.push(...items);
      mark('rss:' + feed.name, true, items.length);
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes('429') || msg.includes('403')) {
        meta.feedCooldown = { ...(meta.feedCooldown || {}), [feed.name]: Date.now() + 30 * 60 * 1000 };
      }
      errors.push({ source: 'rss:' + feed.name, message: msg });
      mark('rss:' + feed.name, false, 0, msg);
    }
  }

  // ---- Wiki 词条
  for (const page of WIKI_PAGES) {
    try {
      const { hash, text } = await fetchWikiPage(page);
      const prev = meta.wikiHashes[page];
      const changed = Boolean(prev && prev !== hash);
      meta.wikiHashes[page] = hash;
      const it = wikiItem(page, text, changed);
      raw.push(it);
      mark('wiki:' + page, true, 1);
    } catch (e: any) {
      errors.push({ source: 'wiki:' + page, message: String(e?.message || e) });
      mark('wiki:' + page, false, 0, String(e?.message || e));
    }
  }

  // ---- 签名状态
  try {
    const { info, items } = await fetchSigning(profile.identifier);
    meta.signing = info;
    raw.push(...items);
    mark('ipsw:' + profile.identifier, true, items.length);
  } catch (e: any) {
    errors.push({ source: 'ipsw:' + profile.identifier, message: String(e?.message || e) });
    mark('ipsw:' + profile.identifier, false, 0, String(e?.message || e));
  }

  // ---- Relaxin（官网 bundle，无公开仓库）
  try {
    const items = await collectRelaxin();
    raw.push(...items);
    mark('site:relaxin', true, items.length);
  } catch (e: any) {
    const msg = String(e?.message || e);
    errors.push({ source: 'site:relaxin', message: msg });
    mark('site:relaxin', false, 0, msg);
  }

  // ---- Apple 安全公告
  try {
    const items = await collectAppleSecurity();
    raw.push(...items);
    mark('apple:security', true, items.length);
  } catch (e: any) {
    errors.push({ source: 'apple:security', message: String(e?.message || e) });
    mark('apple:security', false, 0, String(e?.message || e));
  }

  // ---- Apple 平台版本推送（developer.apple.com releases RSS）
  try {
    const items = await collectAppleReleases();
    raw.push(...items);
    mark('apple:releases', true, items.length);
  } catch (e: any) {
    errors.push({ source: 'apple:releases', message: String(e?.message || e) });
    mark('apple:releases', false, 0, String(e?.message || e));
  }

  // ---- 分析与入库
  const existing = getItems();
  const byId = new Map(existing.map((i) => [i.id, i] as const));
  const added: Item[] = [];
  const updated: Item[] = [];
  for (const r of raw) {
    const it = analyze(r, profile);
    const prev = byId.get(it.id);
    if (prev) {
      // 状态型条目（wiki / ipsw）或内容有变化时覆盖，保留首次入库时间用于当日分组
      const contentChanged = prev.title !== it.title || prev.text !== it.text;
      if (contentChanged) {
        // 内容真的变了才更新时间，否则状态型条目每轮都会顶到时间线最上面
        byId.set(it.id, { ...it, fetchedAt: prev.fetchedAt });
        updated.push(it);
      }
      continue;
    }
    byId.set(it.id, it);
    added.push(it);
  }
  saveItems([...byId.values()]);

  meta.lastSyncAt = new Date().toISOString();
  saveMeta(meta);

  // ---- 生成当日简报
  const all = getItems();
  const d = today();
  const markdown = buildDigest(d, all, profile, meta);
  saveDigest(d, markdown);
  saveDigestEn(d, buildDigestEn(d, all, profile, meta));

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    fetched: raw.length,
    added: added.length,
    skipped: raw.length - added.length,
    errors,
    digestPath: 'data/digests/' + d + '.md',
    actionable: added.filter((i) => i.actionable).length,
  };
}
