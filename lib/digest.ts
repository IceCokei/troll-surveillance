import type { Item, Meta, Profile } from './types';
import { TOOLS } from './knowledge';
import { localDate, toCN } from './date';
import { byStateThenTime, byTimeDesc, withinYears } from './fresh';
import { dedupeByTool } from './dedupe';
import { toolSupports } from './analyze';

function cleanTitle(t: string): string {
  return String(t || '').replace(/^\[(?:词条快照|词条更新|Update|Meta)\]\s*/i, '').trim();
}

function plain(text: string, n = 240): string {
  const s = String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/(^|\s)#{1,6}\s*/g, ' ')
    .replace(/(^|\s)[-*+]\s+/g, ' · ')
    .replace(/(^|\s)>\s?/g, ' ')
    .replace(/`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return s.length > n ? s.slice(0, n).replace(/[\s·,;:]+$/, '') + '…' : s;
}

function clip(t: string, n = 64): string {
  const s = cleanTitle(t);
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const sp = cut.lastIndexOf(' ');
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s—,;:]+$/, '') + '…';
}

function fmt(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

const CAT_LABEL: Record<string, string> = {
  exploit: '漏洞/利用链',
  'tool-release': '工具发版',
  'os-release': '系统更新',
  signing: '签名状态',
  wiki: '资料更新',
  news: '新闻',
  scam: '骗局预警',
};

const RELEVANCE_LABEL: Record<string, string> = {
  direct: '版本命中',
  future: '更高版本(你不可用)',
  obsolete: '旧版本(已停签名)',
  unknown: '未提版本',
};

export function buildDigest(date: string, items: Item[], profile: Profile, meta: Meta): string {
  const dayItems = items.filter((i) => localDate(i.fetchedAt) === date && withinYears(i.publishedAt));
  // 一律按发布时间倒序：最新的在最上面
  const sorted = [...dayItems].sort(byStateThenTime);

  const actionable = sorted.filter((i) => i.actionable);
  const fresh = sorted.filter((i) => !i.tags.includes('stale') && withinYears(i.publishedAt));
  const exploits = fresh.filter((i) => i.category === 'exploit' && i.score >= 35);
  const releases = dedupeByTool(fresh.filter((i) => i.category === 'tool-release')).items;
  const scams = sorted.filter((i) => i.category === 'scam');
  const top = fresh.slice(0, 8);

  const usable = TOOLS.filter((t) => toolSupports(t, profile));

  const L: string[] = [];
  L.push('# iOS 越狱雷达 · ' + date);
  L.push('');
  L.push('> 设备：' + profile.name + '（' + profile.identifier + ' · ' + profile.soc + '） · iOS ' + profile.version + ' (' + profile.build + ')');
  L.push('> 最后更新：' + toCN(new Date().toISOString(), true) + '（北京时间） ｜ 监控间隔 600 秒 ｜ 全库 ' + items.length + ' 条');
  L.push('');
  L.push('## 0. 一句话结论');
  const usableAction = actionable.find((i) => i.actionNote.startsWith('可用'));
  const deviceExploit = exploits.find((i) => i.deviceRelevance === 'direct');
  const headline = usableAction || deviceExploit || exploits[0];
  L.push(
    usableAction
      ? '今天有可执行项：**' + clip(usableAction.title) + '** —— ' + usableAction.actionNote
      : deviceExploit
        ? '与你的 27.0.1 直接相关：**' + clip(deviceExploit.title) + '** —— ' + deviceExploit.actionNote
        : headline
          ? '最高热度：**' + clip(headline.title) + '** —— ' + headline.actionNote
          : '今日无有效情报；' + (usable.length ? '可用工具：' + usable.map((t) => t.name).join('/') : '你的设备与版本仍无任何公开越狱路径') + '。'
  );
  L.push('');

  L.push('## 1. 可以立刻做（' + actionable.length + '）');
  if (!actionable.length) L.push('- 无。今天所有情报都只值记录，不值得动手。');
  for (const i of actionable.slice(0, 10)) {
    L.push('- **[' + CAT_LABEL[i.category] + ']** ' + cleanTitle(i.title).slice(0, 110));
    L.push('  - 动作：' + i.actionNote);
    L.push('  - 证据：' + i.evidence.slice(0, 4).join('，') + '｜' + RELEVANCE_LABEL[i.deviceRelevance]);
    L.push('  - 来源：' + i.source + ' · ' + i.url);
  }
  L.push('');

  L.push('## 2. 漏洞 / 利用链情报（' + exploits.length + '）');
  if (!exploits.length) L.push('- 无高相关漏洞条目。');
  for (const i of exploits.slice(0, 10)) {
    L.push('- [' + i.score + '] ' + cleanTitle(i.title).slice(0, 120));
    L.push('  - 版本：' + (i.versionsMentioned.length ? i.versionsMentioned.join(', ') : '未提及版本') + '｜' + RELEVANCE_LABEL[i.deviceRelevance]);
    L.push('  - 影响：' + i.actionNote);
    L.push('  - ' + i.source + ' · ' + i.url);
  }
  L.push('');

  L.push('## 3. 软件 / 工具更新（' + releases.length + '）');
  if (!releases.length) L.push('- 今日无发版。');
  for (const i of releases.slice(0, 10)) {
    L.push('- ' + i.title.slice(0, 130) + '（' + fmt(i.publishedAt) + '）');
    L.push('  - ' + plain(i.text || '', 240));
  }
  L.push('');

  // 最新动态：不分类、不按分数，纯时间倒序
  const dayAgo = Date.now() - 24 * 3600 * 1000;
  const latest = fresh.filter((i) => new Date(i.publishedAt).getTime() >= dayAgo).slice(0, 12);
  L.push('## 4. 最新动态（近 24 小时，按时间倒序）');
  if (!latest.length) L.push('- 近 24 小时没有新发布的情报。');
  for (const i of latest) {
    L.push('- [' + i.publishedAt.slice(5, 16).replace('T', ' ') + '] **[' + CAT_LABEL[i.category] + ']** ' + cleanTitle(i.title).slice(0, 110));
    L.push('  - ' + i.actionNote + ' · ' + i.source);
  }
  L.push('');

  L.push('## 5. 作者动态（按影响力）');
  const byAuthor = new Map<string, Item[]>();
  for (const i of sorted) {
    if (!/^x:/.test(i.source)) continue;
    const k = i.author || i.source;
    if (!byAuthor.has(k)) byAuthor.set(k, []);
    byAuthor.get(k)!.push(i);
  }
  if (!byAuthor.size) L.push('- 今日未抓到 X 动态（可能处于冷却或代理限流）。');
  for (const [author, list] of byAuthor) {
    const best = list[0];
    L.push('- **' + author + '**（' + list.length + ' 条，最高分 ' + best.score + '）');
    for (const i of [...list].sort(byTimeDesc).slice(0, 3)) L.push('  - ' + i.title.slice(0, 120) + '｜' + i.actionNote);
  }
  L.push('');

  L.push('## 6. 版本与签名');
  if (meta.signing) {
    L.push('- 已签名：' + (meta.signing.signed.map((s) => s.version + ' (' + s.build + ')').join(', ') || '无') + '（检查于 ' + toCN(meta.signing.checkedAt) + '）');
    L.push('- 最新固件：' + (meta.signing.latest ? meta.signing.latest.version + ' ' + meta.signing.latest.build : '未知'));
  } else {
    L.push('- 未获取到签名信息。');
  }
  L.push('');

  L.push('## 7. 骗局预警（' + scams.length + '）');
  if (!scams.length) L.push('- 今日无新增。仍记住：任何"在线一键越狱/装描述文件"都是假的。');
  for (const i of scams.slice(0, 5)) L.push('- ' + i.title.slice(0, 120) + ' · ' + i.url);
  L.push('');

  L.push('## 8. 你的设备能不能用（工具矩阵）');
  L.push('');
  L.push('| 工具 | 公开 | 版本上限 | SoC | 对你的设备 |');
  L.push('| --- | --- | --- | --- | --- |');
  for (const t of TOOLS) {
    const ok = toolSupports(t, profile);
    L.push('| ' + t.name + ' | ' + (t.public ? '是' : '否(私有)') + ' | ' + (t.maxVersion || '—') + ' | ' + (t.socs.join('/') || '—') + ' | ' + (ok ? '**可用**' : '不可用') + ' |');
  }
  L.push('');
  L.push('## 9. 抓取健康度');
  const bad = Object.entries(meta.sourceStatus).filter(([, v]) => !v.ok);
  L.push('- 采集源：' + Object.keys(meta.sourceStatus).length + ' 个，失败 ' + bad.length + ' 个' + (bad.length ? '（' + bad.map(([k]) => k).join(', ') + '）' : ''));
  L.push('- 今日入库：' + dayItems.length + ' 条；其中可执行 ' + actionable.length + ' 条');
  L.push('');
  L.push('---');
  L.push('*由 ios-jailbreak-radar 自动生成，规则引擎 v1（关键词 + 版本/SoC 匹配）。所有"可执行"判断仅基于公开工具矩阵，不含私有链。*');

  return L.join('\n');
}
