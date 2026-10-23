import type { Item, Meta, Profile } from './types';
import { TOOLS } from './knowledge';
import { toCN } from './date';
import { byStateThenTime, withinYears } from './fresh';
import { dedupeByTool } from './dedupe';
import { toolSupports } from './analyze';
import { enNote, CAT_EN } from './en';

const CAT: Record<string, string> = {
  exploit: 'exploit',
  'tool-release': 'tool release',
  signing: 'signing',
  'os-release': 'system',
  wiki: 'wiki',
  news: 'news',
  scam: 'scam',
};

function clean(t: string) {
  return String(t || '').replace(/^\[(?:词条快照|词条更新|Update|Meta)\]\s*/i, '').trim();
}

function clip(t: string, n = 64) {
  const s = clean(t);
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const sp = cut.lastIndexOf(' ');
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s—,;:]+$/, '') + '…';
}

function plain(text: string, n = 240) {
  const s = String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/(^|\s)#{1,6}\s*/g, ' ')
    .replace(/(^|\s)[-*+]\s+/g, ' · ')
    .replace(/\s+/g, ' ')
    .trim();
  return s.length > n ? s.slice(0, n).replace(/[\s·,;:]+$/, '') + '…' : s;
}

export function buildDigestEn(date: string, items: Item[], profile: Profile, meta: Meta): string {
  const day = items.filter((i) => (i.fetchedAt || '').slice(0, 10) <= date && withinYears(i.publishedAt));
  const sorted = [...day].sort(byStateThenTime);
  const fresh = sorted.filter((i) => !i.tags.includes('stale'));
  const actionable = fresh.filter((i) => i.actionable);
  const exploits = fresh.filter((i) => i.category === 'exploit' && i.score >= 35);
  const releases = dedupeByTool(fresh.filter((i) => i.category === 'tool-release')).items;
  const scams = fresh.filter((i) => i.category === 'scam');
  const usable = TOOLS.filter((t) => toolSupports(t, profile));

  const dayAgo = Date.now() - 24 * 3600 * 1000;
  const latest = fresh.filter((i) => new Date(i.publishedAt).getTime() >= dayAgo).slice(0, 12);

  const L: string[] = [];
  L.push('# Troll Surveillance · ' + date);
  L.push('');
  L.push('> Target: ' + profile.name + ' (' + profile.identifier + ' · ' + profile.soc + ') · iOS ' + profile.version + ' (' + profile.build + ')');
  L.push('> Updated: ' + toCN(new Date().toISOString()) + ' (UTC+8) ｜ refresh 600s ｜ ' + items.length + ' items indexed');
  L.push('');

  const usableAction = actionable.find((i) => i.actionNote.startsWith('可用'));
  const deviceExploit = exploits.find((i) => i.deviceRelevance === 'direct');
  const headline = usableAction || deviceExploit || exploits[0];
  L.push('## 0. Verdict');
  L.push(
    usableAction
      ? 'Actionable today: **' + clip(usableAction.title) + '** — ' + enNote(usableAction.actionNote)
      : deviceExploit
        ? 'Directly relevant to your build: **' + clip(deviceExploit.title) + '** — ' + enNote(deviceExploit.actionNote)
        : headline
          ? 'Top signal: **' + clip(headline.title) + '** — ' + enNote(headline.actionNote)
          : 'No signal today; ' + (usable.length ? 'usable tools: ' + usable.map((t) => t.name).join('/') : 'no public jailbreak path for this device') + '.'
  );
  L.push('');

  L.push('## 1. Actionable (' + actionable.length + ')');
  if (!actionable.length) L.push('- None. Nothing here is worth acting on today.');
  for (const i of actionable.slice(0, 10)) {
    L.push('- **[' + (CAT[i.category] || 'news') + ']** ' + clean(i.title).slice(0, 110));
    L.push('  - ' + enNote(i.actionNote));
    L.push('  - ' + i.source + ' · ' + i.url);
  }
  L.push('');

  L.push('## 2. Exploit intel (' + exploits.length + ')');
  if (!exploits.length) L.push('- No high-signal exploit items.');
  for (const i of exploits.slice(0, 10)) {
    L.push('- [' + i.score + '] ' + clean(i.title).slice(0, 120));
    L.push('  - versions: ' + (i.versionsMentioned.length ? i.versionsMentioned.join(', ') : 'not stated'));
    L.push('  - ' + enNote(i.actionNote));
    L.push('  - ' + i.source + ' · ' + i.url);
  }
  L.push('');

  L.push('## 3. Tool releases (' + releases.length + ')');
  if (!releases.length) L.push('- No releases today.');
  for (const i of releases.slice(0, 10)) {
    L.push('- ' + clean(i.title).slice(0, 130) + ' (' + i.publishedAt.slice(0, 16).replace('T', ' ') + ')');
    L.push('  - ' + plain(i.text || ''));
  }
  L.push('');

  L.push('## 4. Latest 24h (newest first)');
  if (!latest.length) L.push('- Nothing published in the last 24 hours.');
  for (const i of latest) {
    L.push('- [' + i.publishedAt.slice(5, 16).replace('T', ' ') + '] **[' + (CAT[i.category] || 'news') + ']** ' + clean(i.title).slice(0, 110));
    L.push('  - ' + enNote(i.actionNote) + ' · ' + i.source);
  }
  L.push('');

  L.push('## 5. Authors');
  const byAuthor = new Map<string, Item[]>();
  for (const i of fresh) {
    if (!i.source.startsWith('x:')) continue;
    const k = i.author || i.source;
    if (!byAuthor.has(k)) byAuthor.set(k, []);
    byAuthor.get(k)!.push(i);
  }
  if (!byAuthor.size) L.push('- No X activity captured this run.');
  for (const [author, list] of byAuthor) {
    L.push('- **' + author + '** (' + list.length + ' posts, peak ' + list[0].score + ')');
    for (const i of list.slice(0, 3)) L.push('  - ' + clean(i.title).slice(0, 120) + ' — ' + enNote(i.actionNote));
  }
  L.push('');

  L.push('## 6. Signing');
  if (meta.signing) {
    L.push('- Signed: ' + (meta.signing.signed.map((s) => s.version + ' (' + s.build + ')').join(', ') || 'none') + ' (checked ' + toCN(meta.signing.checkedAt) + ')');
    L.push('- Latest firmware: ' + (meta.signing.latest ? meta.signing.latest.version + ' ' + meta.signing.latest.build : 'unknown'));
  } else {
    L.push('- Signing data unavailable.');
  }
  L.push('');

  L.push('## 7. Scam watch (' + scams.length + ')');
  if (!scams.length) L.push('- Nothing new. Reminder: any "online one-click jailbreak" is fake.');
  for (const i of scams.slice(0, 5)) L.push('- ' + clean(i.title).slice(0, 120) + ' · ' + i.url);
  L.push('');

  L.push('## 8. Tool matrix');
  L.push('');
  L.push('| Tool | Public | Ceiling | SoC | On this device |');
  L.push('| --- | --- | --- | --- | --- |');
  for (const t of TOOLS) {
    const ok = toolSupports(t, profile);
    L.push('| ' + t.name + ' | ' + (t.public ? 'yes' : 'no (private)') + ' | ' + (t.maxVersion || '—') + ' | ' + (t.socs.join('/') || '—') + ' | ' + (ok ? '**usable**' : 'unusable') + ' |');
  }
  L.push('');

  L.push('## 9. Source health');
  const bad = Object.entries(meta.sourceStatus).filter(([, v]) => !v.ok);
  L.push('- Sources: ' + Object.keys(meta.sourceStatus).length + ', failing ' + bad.length + (bad.length ? ' (' + bad.map(([k]) => k).join(', ') + ')' : ''));
  L.push('- Ingested today: ' + day.length + ' · actionable ' + actionable.length);
  L.push('');
  L.push('---');
  L.push('*Generated by Troll Surveillance. Verdicts are static: public tool × version range × SoC match.*');

  return L.join('\n');
}
