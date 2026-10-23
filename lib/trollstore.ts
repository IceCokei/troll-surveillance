export interface TsTool {
  repo: string;
  name: string;
  kind: '安装器' | '注入/插件' | '包管理' | '侧载' | '免越狱改机';
  needsTrollStore: boolean;
  minVersion?: string;
  maxVersion?: string;
  note: string;
  url: string;
}

/** 目前在 GitHub 上公开、且仍在维护的 TrollStore 生态工具 */
export const TS_TOOLS: TsTool[] = [
  {
    repo: 'opa334/TrollStore',
    name: 'TrollStore',
    kind: '安装器',
    needsTrollStore: false,
    minVersion: '14.0',
    maxVersion: '17.0',
    note: '本体。CoreTrust 多次签名校验漏洞，装上即可永久签名任意 IPA',
    url: 'https://github.com/opa334/TrollStore',
  },
  {
    repo: 'Lessica/TrollFools',
    name: 'TrollFools',
    kind: '注入/插件',
    needsTrollStore: true,
    minVersion: '14.0',
    maxVersion: '17.0',
    note: '把 dylib/tweak 注入已安装 App（Enigma 的替代），仍需 TrollStore 环境',
    url: 'https://github.com/Lessica/TrollFools',
  },
  {
    repo: 'Lessica/TrollSpeed',
    name: 'TrollSpeed',
    kind: '注入/插件',
    needsTrollStore: true,
    minVersion: '14.0',
    maxVersion: '17.0',
    note: '状态栏实时网速，走 TrollStore 安装',
    url: 'https://github.com/Lessica/TrollSpeed',
  },
  {
    repo: 'PureKFD/PureKFD',
    name: 'PureKFD',
    kind: '包管理',
    needsTrollStore: true,
    minVersion: '14.0',
    maxVersion: '17.0',
    note: '包管理器 / 源浏览，TrollStore 环境下装插件用',
    url: 'https://github.com/PureKFD/PureKFD',
  },
  {
    repo: 'SideStore/SideStore',
    name: 'SideStore',
    kind: '侧载',
    needsTrollStore: false,
    minVersion: '14.0',
    note: '免费证书侧载，7 天续签、最多 3 个 App；不依赖 TrollStore，也没有 root',
    url: 'https://github.com/SideStore/SideStore',
  },
  {
    repo: 'LeminLimez/Nugget',
    name: 'Nugget',
    kind: '免越狱改机',
    needsTrollStore: false,
    minVersion: '17.0',
    maxVersion: '26.1',
    note: '走 SparseRestore 的免越狱改机（关 Liquid Glass、开 EU、Tap to Wake 等）；官方明确说别在 iOS 27 上用，可能丢数据',
    url: 'https://github.com/LeminLimez/Nugget',
  },
];

export function cmpVersion(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

export function toolVerdict(t: TsTool, version: string, trollstoreOk: boolean) {
  if (t.needsTrollStore && !trollstoreOk) {
    return { ok: false, why: '需要先有 TrollStore（≤ ' + (t.maxVersion || '17.0') + '），你的 ' + version + ' 不行' };
  }
  if (t.minVersion && cmpVersion(version, t.minVersion) < 0) {
    return { ok: false, why: '需要 ≥ ' + t.minVersion };
  }
  if (t.maxVersion && cmpVersion(version, t.maxVersion) > 0) {
    return { ok: false, why: '需要 ≤ ' + t.maxVersion + '，你是 ' + version };
  }
  return { ok: true, why: t.needsTrollStore ? '可用（先装 TrollStore）' : '可用' };
}
