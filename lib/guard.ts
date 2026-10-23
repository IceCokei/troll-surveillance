import type { Item, Profile, SigningInfo } from './types';

export interface GuardResult {
  level: 'ok' | 'warn' | 'bad';
  headline: string;
  checks: { label: string; state: 'ok' | 'warn' | 'bad'; detail: string }[];
}

const SOC_TOKENS: Record<string, RegExp> = {
  'A16': /\bA16\b|t8130|iPhone15,\d/i,
  'A17': /\bA17\b|t8130|iPhone16,\d/i,
  'A18': /\bA18\b|t8140|iPhone17,\d/i,
  'A19': /\bA19\b|t8150|iPhone18,\d/i,
  'A20': /\bA20\b|t8160|iPhone19,\d/i,
};

/** 冻结守卫：判断「还守着这个版本」这件事是否仍然成立 */
export function evaluateGuard(profile: Profile, signing: SigningInfo | undefined, items: Item[]): GuardResult {
  const checks: GuardResult['checks'] = [];

  // 1) 是否有更新的固件已发布（自动更新风险）
  const latest = signing?.latest?.version;
  if (latest && latest !== profile.version) {
    const newer = latest.localeCompare(profile.version, undefined, { numeric: true }) > 0;
    checks.push({
      label: '固件状态',
      state: newer ? 'bad' : 'ok',
      detail: newer
        ? '已出现更新版本 ' + latest + '，你的 ' + profile.version + ' 不再是唯一在售版本，务必确认自动更新已关'
        : '最新固件仍是 ' + latest,
    });
  } else if (latest) {
    checks.push({ label: '固件状态', state: 'ok', detail: '最新固件 ' + latest + '，与你的版本一致' });
  }

  // 2) 你的版本是否仍可还原
  const signedNow = (signing?.signed || []).map((s) => s.version);
  const canRestore = signedNow.includes(profile.version);
  checks.push({
    label: '还原窗口',
    state: canRestore ? 'ok' : 'bad',
    detail: canRestore
      ? profile.version + ' 仍在签名，出问题可 DFU 还原'
      : profile.version + ' 已停签名，当前只能刷 ' + (signedNow.join(', ') || '无'),
  });

  // 3) 是否出现覆盖你这颗 SoC 的情报
  const socKey = Object.keys(SOC_TOKENS).find((k) => profile.soc.startsWith(k));
  const re = socKey ? SOC_TOKENS[socKey] : null;
  const hits = re ? items.filter((i) => re.test(i.title + ' ' + (i.text || ''))) : [];
  const actionable = hits.filter((i) => i.actionable);
  checks.push({
    label: '本机相关情报',
    state: actionable.length ? 'ok' : hits.length ? 'warn' : 'ok',
    detail: actionable.length
      ? '有 ' + actionable.length + ' 条可直接执行的情报'
      : hits.length
        ? '有 ' + hits.length + ' 条提到 ' + socKey + ' 的情报，但都不可执行（多为旧版本/私有链）'
        : '暂无提到 ' + (socKey || profile.soc) + ' 的情报',
  });

  const bad = checks.filter((c) => c.state === 'bad');
  const warn = checks.filter((c) => c.state === 'warn');
  const level: GuardResult['level'] = bad.length ? 'bad' : warn.length ? 'warn' : 'ok';
  const headline =
    level === 'bad'
      ? '冻结状态被破坏：' + bad.map((b) => b.label).join('、')
      : level === 'warn'
        ? '冻结中，但有新情报需要人工判断'
        : '冻结有效：版本仍是唯一可选，还原窗口开启';

  return { level, headline, checks };
}
