export type SourceKind = 'x' | 'github' | 'rss' | 'wiki' | 'ipsw' | 'apple' | 'security';

export type Category =
  | 'exploit'        // 漏洞/利用链
  | 'tool-release'   // 工具发版
  | 'os-release'     // 系统/固件更新
  | 'signing'        // 签名状态变化
  | 'wiki'           // 资料库更新
  | 'news'           // 新闻
  | 'scam';          // 骗局/假站

export interface RawItem {
  source: string;
  kind: SourceKind;
  author?: string;
  title: string;
  url: string;
  publishedAt?: string;
  text?: string;
}

export interface Item extends RawItem {
  id: string;
  fetchedAt: string;
  publishedAt: string;
  category: Category;
  score: number;
  tags: string[];
  evidence: string[];
  versionsMentioned: string[];
  deviceRelevance: 'direct' | 'future' | 'obsolete' | 'unknown';
  actionable: boolean;
  actionNote: string;
}

export interface Tool {
  name: string;
  kind: 'jailbreak' | 'tweak-runner' | 'sideload' | 'signing';
  public: boolean;
  minVersion?: string;
  maxVersion?: string;
  maxVersionBySoc?: Record<string, string>;
  ranges?: { socs?: string[]; min: string; max: string }[];
  socs: string[];
  devices?: string;
  note: string;
  repo?: string;
  url?: string;
}

export interface Profile {
  name: string;
  identifier: string;
  version: string;
  build: string;
  soc: string;
}

export interface SigningInfo {
  checkedAt: string;
  device: string;
  signed: { version: string; build: string }[];
  latest: { version: string; build: string } | null;
}

export interface DeviceSnapshot {
  checkedAt: string;
  udidTail: string;
  identifier: string;
  name: string;
  soc: string;
  version: string;
  build: string;
  arch?: string;
  region?: string;
  modelNumber?: string;
  hardwareModel?: string;
  signed: string[];
  latest?: string;
}

export interface Meta {
  lastSyncAt?: string;
  wikiHashes: Record<string, string>;
  xCache: Record<string, { at: string; digest: string }>;
  signing?: SigningInfo;
  ghCooldown?: Record<string, number>;
  feedCooldown?: Record<string, number>;
  sourceStatus: Record<string, { ok: boolean; at: string; message?: string; count?: number }>;
}
