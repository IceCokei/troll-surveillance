import crypto from 'node:crypto';
import type { Category, Item, Profile, RawItem, Tool } from './types';
import { TOOLS, SOC_PATTERNS } from './knowledge';
import { localDate } from './date';

export function itemId(raw: RawItem): string {
  // 词条 / 签名状态是「状态型」条目：同一 source 只保留一条，同步时原地更新
  if (raw.kind === 'wiki' || raw.kind === 'ipsw') {
    return crypto.createHash('sha1').update('state|' + raw.source).digest('hex').slice(0, 16);
  }
  const key = [raw.source, (raw.title || '').replace(/\s+/g, ' ').slice(0, 160)].join('|');
  return crypto.createHash('sha1').update(key).digest('hex').slice(0, 16);
}

function cmpVersion(a: string, b: string): number {
  const norm = (v: string) => v.replace(/[^0-9.]/g, '').split('.').filter(Boolean).map((n) => parseInt(n, 10) || 0);
  const pa = norm(a);
  const pb = norm(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

function socShort(profile: Profile): string {
  return profile.soc.split(' ')[0];
}

export function toolSupports(t: Tool, profile: Profile): boolean {
  if (!t.public) return false;
  if (t.ranges?.length) {
    const soc = socShort(profile);
    return t.ranges.some(
      (r) =>
        (!r.socs || r.socs.includes(soc)) &&
        cmpVersion(profile.version, r.min) >= 0 &&
        cmpVersion(profile.version, r.max) <= 0
    );
  }
  const ceil = (t.maxVersionBySoc && t.maxVersionBySoc[socShort(profile)]) || t.maxVersion;
  if (ceil && cmpVersion(profile.version, ceil) > 0) return false;
  if (t.minVersion && cmpVersion(profile.version, t.minVersion) < 0) return false;
  if (t.socs.length && !t.socs.includes(socShort(profile))) return false;
  return true;
}

function toolFor(raw: RawItem): Tool | undefined {
  const hay = (raw.source + ' ' + raw.title).toLowerCase();
  return TOOLS.find((t) => {
    if (t.repo && hay.includes(t.repo.toLowerCase())) return true;
    if (t.kind === 'sideload') return false; // 侧载工具不参与越狱判定
    return hay.includes(t.name.toLowerCase());
  });
}

const RULES: { re: RegExp; weight: number; tag: string; category?: Category }[] = [
  { re: /untether|untethered|完美越狱|重启.*(保留|维持|不掉)|persistent jailbreak/i, weight: 45, tag: 'untether', category: 'exploit' },
  { re: /0day|zero[- ]day|零日|在野利用|in the wild/i, weight: 35, tag: '0day', category: 'exploit' },
  { re: /CVE-\d{4}-\d{4,}/i, weight: 25, tag: 'CVE', category: 'exploit' },
  { re: /sandbox escape|沙盒逃逸|kernel exploit|内核漏洞|提权|LPE/i, weight: 24, tag: 'kernel', category: 'exploit' },
  { re: /MIE|EMTE|Memory Integrity|PAC|SPTM|KTRR|bootROM|checkm8|\bkfd\b/i, weight: 20, tag: 'mitigation', category: 'exploit' },
  { re: /exploit chain|利用链|漏洞链|full chain|we popped|pwned/i, weight: 22, tag: 'chain', category: 'exploit' },
  { re: /jailbreak|越狱|탈옥|جيلبريك/i, weight: 12, tag: 'jailbreak' },
  { re: /TrollStore|Sileo|Zebra|ElleKit|bootstrap|rootless|rootful|tweak/i, weight: 10, tag: 'tool' },

  { re: /sign(ed|ing)|停签名|OTA|shsh|blob|downgrad|降级/i, weight: 12, tag: 'signing', category: 'signing' },
  { re: /scam|fake|骗|假站|phishing|click fraud/i, weight: 16, tag: 'scam', category: 'scam' },
  { re: /iPhone\s*(1[678]|Duo)|iOS 27|A19|A20/i, weight: 18, tag: 'new-device' },
  { re: /Hexacon|PoC|proof of concept|演示|demo/i, weight: 10, tag: 'research' },
  { re: /patched|fixed|修复/i, weight: 8, tag: 'patch' },
];

function extractVersions(text: string): string[] {
  const out = new Set<string>();
  const re = /\b(iOS\s*)?(1[5-9]|2\d)\.(\d{1,2})(?:\.(\d{1,2}))?\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out.add(m[2] + '.' + m[3] + (m[4] ? '.' + m[4] : ''));
  }
  return [...out].slice(0, 12);
}

export function socOf(text: string): string | null {
  for (const { re, soc } of SOC_PATTERNS) if (re.test(text)) return soc;
  return null;
}

export function stripMarkup(s: string): string {
  return String(s || '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, ' ')
    .replace(/<[^>]{1,120}>/g, ' ')
    .replace(/\{\{[^{}]{0,200}\}\}/g, ' ')
    .replace(/\[\[([^\]|]+)\|?[^\]]*\]\]/g, '$1')
    .replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, '$1')
    .replace(/\]\s*\((?:https?:)?\/\/[^)]*\)/g, ' ')
    .replace(/^[)\]\s:|-]+/, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function analyze(raw: RawItem, profile: Profile): Item {
  raw = { ...raw, title: stripMarkup(raw.title), text: stripMarkup(raw.text || '') };
  const text = [raw.title, raw.text, raw.author, raw.source].filter(Boolean).join(' \n ');
  let score = 8;
  const tags = new Set<string>();
  const evidence: string[] = [];
  let category: Category = 'news';

  const head = raw.title.toLowerCase();
  const scamSignal = /scam|fake jailbreak|fake site|phishing|click fraud|骗|假站|描述文件/.test(head);

  for (const r of RULES) {
    if (r.category === 'scam' && !scamSignal) continue;
    if (r.re.test(text)) {
      score += r.weight;
      tags.add(r.tag);
      evidence.push(r.tag + '(+' + r.weight + ')');
      if (r.category === 'exploit' && category !== 'exploit') category = 'exploit';
      else if (r.category === 'scam') category = 'scam';
      else if (r.category === 'signing' && category === 'news') category = 'signing';
    }
  }

  // TrollStore 相关内容按标题判定，避免正文一句提及就误标
  if (/trollstore|trollfools|trollspeed|purekfd|nugget|coretrust|permasign|永久签名|ldid/i.test(raw.title)) {
    tags.add('trollstore');
    score += 12;
    evidence.push('trollstore(+12)');
  }

  const versions = extractVersions(text);
  const mentionedSoc = socOf(text);

  let relevance: Item['deviceRelevance'] = 'unknown';
  if (versions.length) {
    const minV = versions.reduce((a, b) => (cmpVersion(a, b) < 0 ? a : b));
    if (versions.includes(profile.version)) relevance = 'direct';
    else if (cmpVersion(minV, profile.version) > 0) relevance = 'future';
    else relevance = 'obsolete';
    if (relevance === 'direct') { score += 15; evidence.push('版本命中 ' + profile.version + '(+15)'); }
    if (relevance === 'obsolete') { score -= 10; evidence.push('版本低于本机(-10)'); }
    if (relevance === 'future') { evidence.push('需要更高版本'); }
  }

  if (mentionedSoc) {
    tags.add('soc:' + mentionedSoc);
    if (socShort(profile).startsWith(mentionedSoc)) { score += 10; evidence.push('SoC 命中 ' + mentionedSoc + '(+10)'); }
    else { score -= 10; evidence.push('SoC 不匹配（提及 ' + mentionedSoc + '）(-10)'); }
  }

  const tool = toolFor(raw);
  const supported = tool ? toolSupports(tool, profile) : false;

  // 类别与发版识别
  if (raw.kind === 'github' && !raw.source.endsWith(':commits')) {
    category = 'tool-release';
    score += 15;
    evidence.push('GitHub release(+15)');
  } else if (raw.kind === 'github' && raw.source.endsWith(':commits')) {
    score += 4;
    evidence.push('GitHub commit(+4)');
  }
  if (raw.source === 'apple:releases') {
    // 官方平台推送：不进 exploit/signing 判定，单独一类
    if (category === 'news') category = 'os-release';
    score += 10;
    evidence.push('Apple 平台推送(+10)');
  }
  if (raw.kind === 'ipsw') category = 'signing';
  if (raw.kind === 'wiki' || raw.kind === 'ipsw') tags.add('state');

  let actionable = false;
  let actionNote = '仅情报价值：记录，不构成动作';

  if (category === 'tool-release') {
    if (tool && supported) {
      actionable = true;
      actionNote = '可用：' + tool.name + ' 支持你的 iOS ' + profile.version + ' / ' + socShort(profile) + '，按官方 release 说明升级';
    } else if (tool) {
      score -= 25;
      actionNote = '不适用：' + tool.name + ' 仅支持 ' + (tool.devices || (tool.minVersion ? tool.minVersion + '–' : '≤') + (tool.maxVersion || '?') + ' / ' + (tool.socs.join('/') || '任意')) + '，覆盖不到你的设备';
    } else {
      actionNote = '第三方发版，需人工确认是否覆盖 ' + profile.identifier + ' / iOS ' + profile.version;
    }
  } else if (category === 'exploit') {
    const isPrivateChain = /due time|未发布|private|private chain|not released|will be released/i.test(text) || /Chollima/i.test(text);
    if (relevance === 'direct' && isPrivateChain) {
      actionNote = '命中的是你的版本，但这是私有/未发布链——只能记录，等披露';
      score += 10;
    } else if (relevance === 'direct') {
      actionNote = '与你的版本相关，需确认是否有公开实现（当前工具矩阵无对应项）';
    } else if (relevance === 'future') {
      actionNote = '针对更高版本，你的设备不适用';
    } else if (relevance === 'obsolete') {
      actionNote = '旧版本漏洞，你的系统已修复且无法降级';
    } else {
      actionNote = '未提及具体版本，需人工确认是否覆盖 ' + profile.identifier;
    }
  } else if (category === 'signing') {
    if (/stop|停止|unsigned|已停|no longer/i.test(text)) {
      actionNote = '签名窗口变化：核对是否还能还原到你当前版本';
      actionable = relevance !== 'obsolete';
    } else if (relevance === 'direct') {
      actionNote = '你当前版本仍在签名窗口，出问题可 DFU 还原';
    }
  } else if (category === 'os-release') {
    const isDeviceOs = /^(iOS|iPadOS)\s/.test(raw.title);
    if (!isDeviceOs) {
      actionNote = '其他平台版本推送：仅记录，与你的设备无关';
    } else if (relevance === 'direct') {
      actionNote = '与你当前系统同一版本线：要更新直接 OTA，不要用第三方描述文件';
    } else if (relevance === 'future') {
      actionNote = '比你当前系统更高：升级会改动越狱 / TrollStore 态势，先看工具矩阵再决定';
    } else if (relevance === 'obsolete') {
      actionNote = '低于你当前版本：只对需要降级且签名仍开的人有意义';
    } else {
      actionNote = '平台版本推送：仅记录，按需在设备上 OTA';
    }
  } else if (category === 'scam') {
    actionNote = '骗局模式：不要安装描述文件 / 不要输入 Apple ID';
  }

  if (relevance === 'obsolete' && category !== 'scam') actionable = false;

  // 时效性：老帖不进"今日高价值"，但仍保留在检索里
  const ageDays = (Date.now() - new Date(raw.publishedAt || Date.now()).getTime()) / 86400000;
  if (ageDays > 30) { score -= 18; evidence.push('发布已 ' + Math.round(ageDays) + ' 天(-18)'); }
  if (ageDays > 180) { score -= 22; tags.add('stale'); evidence.push('半年以上旧帖(-22)'); }
  if (ageDays > 730) { score -= 15; evidence.push('两年以上旧帖(-15)'); }

  // 发版类即使不适用也保留可见度，避免被时效/SoC 惩罚压成 0
  if (category === 'tool-release') score = Math.max(score, 30);

  score = Math.max(0, Math.min(100, score));

  return {
    ...raw,
    id: itemId(raw),
    fetchedAt: new Date().toISOString(),
    publishedAt: raw.publishedAt || new Date().toISOString(),
    category,
    score,
    tags: [...tags],
    evidence,
    versionsMentioned: versions,
    deviceRelevance: relevance,
    actionable,
    actionNote,
  };
}

export function dayOf(iso: string): string {
  return localDate(iso);
}