import fs from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { fetchText } from './collect/http';
import { DATA_DIR } from './paths';

/**
 * Apple 平台版本推送：直读开发者发布源
 * 来源：https://developer.apple.com/news/releases/rss/releases.rss
 * —— 官方 RSS，零鉴权、零第三方中转。同一批次的 iOS/iPadOS/macOS/tvOS/visionOS/watchOS/Xcode
 *    会带同一个 pubDate，因此「本次推送」= 同时间戳的分组。
 */
export const APPLE_RELEASES_URL = 'https://developer.apple.com/news/releases/rss/releases.rss';

export const PLATFORM_ORDER = ['Xcode', 'iOS', 'iPadOS', 'macOS', 'tvOS', 'visionOS', 'watchOS', 'Safari'] as const;
export type Platform = (typeof PLATFORM_ORDER)[number];

export type Channel = 'rc' | 'beta' | 'release';

export interface OsRelease {
  platform: string;
  version: string;
  build: string;
  channel: Channel;
  /** 版本号后面的附注，如 "RC" / "beta 3" / 空 */
  label: string;
  title: string;
  url: string;
  publishedAt: string;
}

export interface OsPushRecord {
  at: string;
  count: number;
  builds: string[];
}

export interface OsVersions {
  fetchedAt: string;
  source: string;
  releases: OsRelease[];
  ok: boolean;
  error?: string;
  /** 已确认过的推送时刻 */
  seenPushAt?: string;
  /** 这次新推送被检测到的时间 */
  detectedAt?: string;
  /** 推送历史（新的在前，最多 20 条） */
  pushes?: OsPushRecord[];
}

/** 列表行：带「比上一版新在哪」的历史信息 */
export interface OsRow extends OsRelease {
  /** 是否属于最近一次推送批次 */
  inPush: boolean;
  /** 上一个不同版本（用于显示从哪升上来） */
  prevVersion?: string;
  prevLabel?: string;
  prevBuild?: string;
  prevPublishedAt?: string;
  /** 该平台一共抓到几个版本 */
  history: number;
}

export interface OsPush {
  at: string;
  items: OsRelease[];
}

const CACHE_FILE = path.join(DATA_DIR, 'os-versions.json');
const TTL_MS = 2 * 60 * 1000;
const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });

function asArray<T>(v: T | T[] | undefined): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

/** "iOS 27.2 RC (24B115)" → platform/version/label/build */
export function parseReleaseTitle(title: string): { platform: string; version: string; label: string; build: string } | null {
  const m = String(title || '')
    .trim()
    .match(/^(.+?)\s+(\d+(?:\.\d+){0,3})\s*([A-Za-z][A-Za-z0-9 .]*?)?\s*\(([0-9A-Za-z]+)\)$/);
  if (!m) return null;
  return { platform: m[1].trim(), version: m[2], label: (m[3] || '').trim(), build: m[4].trim() };
}

export function channelOf(label: string): Channel {
  if (/\brc\b|release candidate/i.test(label)) return 'rc';
  if (/beta|seed|alpha/i.test(label)) return 'beta';
  return 'release';
}

export function cmpVersion(a: string, b: string): number {
  const norm = (v: string) =>
    String(v || '')
      .replace(/[^0-9.]/g, '')
      .split('.')
      .filter(Boolean)
      .map((n) => parseInt(n, 10) || 0);
  const pa = norm(a);
  const pb = norm(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

export function parseReleases(xml: string): OsRelease[] {
  const doc: any = parser.parse(xml);
  const items = asArray(doc?.rss?.channel?.item);
  const out: OsRelease[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    const title = String(it?.title?.['#text'] || it?.title || '').trim();
    const parsed = parseReleaseTitle(title);
    if (!parsed) continue;
    if (!(PLATFORM_ORDER as readonly string[]).includes(parsed.platform)) continue;
    const link = typeof it?.link === 'string' ? it.link : it?.link?.['#text'] || APPLE_RELEASES_URL;
    const date = new Date(String(it?.pubDate || it?.date || ''));
    const publishedAt = Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    const key = parsed.platform + '|' + parsed.version + '|' + parsed.build;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      platform: parsed.platform,
      version: parsed.version,
      label: parsed.label,
      build: parsed.build,
      channel: channelOf(parsed.label),
      title,
      url: link,
      publishedAt,
    });
  }
  return out.sort((a, b) => {
    if (a.publishedAt !== b.publishedAt) return a.publishedAt < b.publishedAt ? 1 : -1;
    return PLATFORM_ORDER.indexOf(a.platform as Platform) - PLATFORM_ORDER.indexOf(b.platform as Platform);
  });
}

/** 每个平台的最新一条（releases 已按时间倒序） */
export function latestPerPlatform(releases: OsRelease[]): OsRelease[] {
  const map = new Map<string, OsRelease>();
  for (const r of releases) if (!map.has(r.platform)) map.set(r.platform, r);
  return PLATFORM_ORDER.filter((p) => map.has(p)).map((p) => map.get(p)!);
}

/**
 * 每平台最新一行 + 历史对比：
 * - inPush=true  → 这条是本次推送带出来的新版本
 * - inPush=false → 该平台这次没动，仍是旧版本
 */
export function latestRows(releases: OsRelease[], push: OsPush | null): OsRow[] {
  const byPlatform = new Map<string, OsRelease[]>();
  for (const r of releases) {
    if (!byPlatform.has(r.platform)) byPlatform.set(r.platform, []);
    byPlatform.get(r.platform)!.push(r);
  }
  const pushKeys = new Set((push?.items || []).map((i) => i.platform + '|' + i.build));
  const rows: OsRow[] = [];
  for (const platform of PLATFORM_ORDER) {
    const list = byPlatform.get(platform);
    if (!list || !list.length) continue;
    const latest = list[0];
    // 优先取「版本号不同」的上一版（如 27.1、27.0.1），没有才退回同版本的旧 build（如 beta 3）
    const prev = list.find((r) => r.version !== latest.version) || list.find((r) => r.build !== latest.build);
    rows.push({
      ...latest,
      inPush: pushKeys.has(latest.platform + '|' + latest.build),
      prevVersion: prev?.version,
      prevLabel: prev?.label,
      prevBuild: prev?.build,
      prevPublishedAt: prev?.publishedAt,
      history: list.length,
    });
  }
  return rows;
}

/** 最近一次「多平台同时推送」：同一时间戳、平台数 ≥ 3 */
export function latestPush(releases: OsRelease[], minPlatforms = 3): OsPush | null {
  if (!releases.length) return null;
  const groups = new Map<string, OsRelease[]>();
  for (const r of releases) {
    const key = r.publishedAt;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  const ordered = [...groups.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  const hit = ordered.find(([, list]) => new Set(list.map((r) => r.platform)).size >= minPlatforms);
  const [at, list] = hit || ordered[0];
  const items = [...list].sort(
    (a, b) => PLATFORM_ORDER.indexOf(a.platform as Platform) - PLATFORM_ORDER.indexOf(b.platform as Platform)
  );
  return { at, items };
}

function readCache(): OsVersions | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    const raw = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    if (!raw || !Array.isArray(raw.releases)) return null;
    return raw as OsVersions;
  } catch {
    return null;
  }
}

function writeCache(snap: OsVersions) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(snap, null, 1));
  } catch {
    /* 缓存写失败不影响线上渲染 */
  }
}

export async function getOsVersions(opts: { force?: boolean; maxAgeMs?: number } = {}): Promise<OsVersions> {
  const maxAge = opts.maxAgeMs ?? TTL_MS;
  const cached = readCache();
  const age = cached ? Date.now() - new Date(cached.fetchedAt).getTime() : Number.POSITIVE_INFINITY;
  if (!opts.force && cached && age < maxAge) return cached;
  try {
    const xml = await fetchText(APPLE_RELEASES_URL, { timeoutMs: 20000 });
    const releases = parseReleases(xml);
    if (!releases.length) throw new Error('feed parsed empty');
    const push = latestPush(releases);
    const isNew = Boolean(push && push.at !== cached?.seenPushAt);
    const record: OsPushRecord[] = [...(cached?.pushes || [])];
    if (push && isNew) {
      record.unshift({ at: push.at, count: push.items.length, builds: push.items.map((i) => i.platform + ' ' + i.build) });
    }
    const snap: OsVersions = {
      fetchedAt: new Date().toISOString(),
      source: APPLE_RELEASES_URL,
      releases,
      ok: true,
      seenPushAt: push?.at ?? cached?.seenPushAt,
      detectedAt: isNew ? new Date().toISOString() : cached?.detectedAt,
      pushes: record.slice(0, 20),
    };
    writeCache(snap);
    return snap;
  } catch (e: any) {
    const message = String(e?.message || e);
    if (cached) return { ...cached, ok: false, error: message };
    return { fetchedAt: new Date().toISOString(), source: APPLE_RELEASES_URL, releases: [], ok: false, error: message };
  }
}