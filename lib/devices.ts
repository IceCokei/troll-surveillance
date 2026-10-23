import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { TS_TOOLS, toolVerdict } from './trollstore';

const pexec = promisify(execFile);

export interface DeviceInfo {
  udid: string;
  connected: boolean;
  identifier: string;
  name: string;
  marketing: string;
  soc: string;
  chipClass: 'A8-A11' | 'A12/A13' | 'A14-A17' | 'M1/M2' | 'A18+' | 'unknown';
  version: string;
  build: string;
  arch?: string;
  region?: string;
  modelNumber?: string;
  hardwareModel?: string;
  kind: 'iPhone' | 'iPad' | 'unknown';
  signed: string[];
  latest?: string;
  verdicts: { tool: string; supported: boolean; why: string }[];
  trollstore: { supported: boolean; max: string; why: string };
  targets: { tool: string; max: string; gap: string; supported: boolean; note: string }[];
  tsTools: { name: string; kind: string; repo: string; url: string; needsTrollStore: boolean; supported: boolean; why: string }[];
}

/** 计算版本差：17.4.1 相对 17.3.1 => "0.1.0"（正数表示你更高，已经错过窗口） */
function versionGap(cur: string, max: string): string {
  const pc = cur.split('.').map((n) => parseInt(n, 10) || 0);
  const pm = max.split('.').map((n) => parseInt(n, 10) || 0);
  const out: number[] = [];
  let borrow = 0;
  for (let i = Math.max(pc.length, pm.length) - 1; i >= 0; i--) {
    let d = (pc[i] || 0) - (pm[i] || 0) - borrow;
    borrow = 0;
    if (d < 0) { d += 100; borrow = 1; }
    out.unshift(d);
  }
  while (out.length > 1 && out[out.length - 1] === 0) out.pop();
  return out.join('.');
}

export function buildTargets(chipClass: DeviceInfo['chipClass'], version: string) {
  const list: { tool: string; max: string; gap: string; supported: boolean; note: string }[] = [];

  const tsMax = TROLLSTORE_MAX;
  list.push({
    tool: 'TrollStore',
    max: tsMax,
    gap: versionGap(version, tsMax),
    supported: cmp(version, tsMax) <= 0,
    note: cmp(version, tsMax) <= 0 ? '当前版本可用' : '需要 ' + tsMax + ' 或更低；再高的版本没有 CoreTrust 漏洞',
  });

  if (chipClass === 'A12/A13') {
    list.push({ tool: 'Dopamine', max: '26.0.1', gap: versionGap(version, '26.0.1'), supported: cmp(version, '26.0.1') <= 0 && cmp(version, '15.0') >= 0, note: 'A12/A13：15.0–18.7.1 或 26.0–26.0.1' });
  } else if (chipClass === 'A14-A17' || chipClass === 'M1/M2') {
    list.push({ tool: 'Dopamine', max: '17.3.1', gap: versionGap(version, '17.3.1'), supported: cmp(version, '17.3.1') <= 0 && cmp(version, '15.0') >= 0, note: 'A14–A17 / M1 / M2 最高 17.3.1' });
  } else if (chipClass === 'A8-A11') {
    list.push({ tool: 'palera1n', max: '全版本', gap: '—', supported: true, note: 'checkm8 bootROM 漏洞，不受版本限制' });
  } else {
    list.push({ tool: 'Dopamine', max: '—', gap: '—', supported: false, note: '该芯片没有公开越狱' });
  }

  list.push({
    tool: '半越狱（NathanLR / Bootstrap）',
    max: '17.0',
    gap: versionGap(version, '17.0'),
    supported: cmp(version, '16.5.1') >= 0 && cmp(version, '17.0') <= 0,
    note: '仅 16.5.1–17.0',
  });

  return list;
}

const IPHONE: Record<string, { name: string; soc: string; chipClass: DeviceInfo['chipClass'] }> = {
  'iPhone14,2': { name: 'iPhone 13 Pro', soc: 'A15', chipClass: 'A14-A17' },
  'iPhone15,2': { name: 'iPhone 14 Pro', soc: 'A16', chipClass: 'A14-A17' },
  'iPhone16,1': { name: 'iPhone 15 Pro', soc: 'A17 Pro', chipClass: 'A14-A17' },
  'iPhone17,1': { name: 'iPhone 16 Pro', soc: 'A18 Pro (t8140)', chipClass: 'A18+' },
  'iPhone17,2': { name: 'iPhone 16 Pro Max', soc: 'A18 Pro (t8140)', chipClass: 'A18+' },
  'iPhone17,3': { name: 'iPhone 16', soc: 'A18 (t8140)', chipClass: 'A18+' },
  'iPhone17,4': { name: 'iPhone 16 Plus', soc: 'A18 (t8140)', chipClass: 'A18+' },
  'iPhone18,1': { name: 'iPhone 17 Pro', soc: 'A19 Pro (t8150)', chipClass: 'A18+' },
  'iPhone18,2': { name: 'iPhone 17 Pro Max', soc: 'A19 Pro (t8150)', chipClass: 'A18+' },
  'iPhone18,3': { name: 'iPhone 17', soc: 'A19 (t8150)', chipClass: 'A18+' },
  'iPhone19,2': { name: 'iPhone 18 Pro', soc: 'A20 Pro (t8160)', chipClass: 'A18+' },
  'iPhone19,3': { name: 'iPhone 18 Pro Max', soc: 'A20 Pro (t8160)', chipClass: 'A18+' },
  'iPhone19,4': { name: 'iPhone Duo', soc: 'A20 Pro (t8160)', chipClass: 'A18+' },
};

const IPAD: Record<string, { name: string; soc: string; chipClass: DeviceInfo['chipClass'] }> = {
  'iPad13,4': { name: 'iPad Pro 11" (M1)', soc: 'M1 (t8110)', chipClass: 'M1/M2' },
  'iPad13,5': { name: 'iPad Pro 11" (M1)', soc: 'M1 (t8110)', chipClass: 'M1/M2' },
  'iPad13,8': { name: 'iPad Pro 12.9" (M1)', soc: 'M1 (t8110)', chipClass: 'M1/M2' },
  'iPad13,9': { name: 'iPad Pro 12.9" (M1)', soc: 'M1 (t8110)', chipClass: 'M1/M2' },
  'iPad14,3': { name: 'iPad Pro 11" (M2)', soc: 'M2 (t8112)', chipClass: 'M1/M2' },
  'iPad14,5': { name: 'iPad Pro 12.9" (M2)', soc: 'M2 (t8112)', chipClass: 'M1/M2' },
  'iPad14,8': { name: 'iPad Air (M3)', soc: 'M3', chipClass: 'M1/M2' },
  'iPad16,3': { name: 'iPad Pro 11" (M4)', soc: 'M4 (t8132)', chipClass: 'M1/M2' },
  'iPad16,5': { name: 'iPad Pro 13" (M4)', soc: 'M4 (t8132)', chipClass: 'M1/M2' },
};

function cmp(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** TrollStore：CoreTrust 漏洞，公开上限 iOS/iPadOS 17.0（另有 16.7 RC 20H18） */
export const TROLLSTORE_MAX = '17.0';

export function trollstoreVerdict(chipClass: DeviceInfo['chipClass'], version: string) {
  if (cmp(version, TROLLSTORE_MAX) <= 0) {
    return { supported: true, max: TROLLSTORE_MAX, why: 'iOS/iPadOS ≤ ' + TROLLSTORE_MAX + '，CoreTrust 漏洞可用' };
  }
  return { supported: false, max: TROLLSTORE_MAX, why: '你的 ' + version + ' 超出 ' + TROLLSTORE_MAX + '，CoreTrust 漏洞已被修补' };
}

export function jailbreakVerdicts(d: Pick<DeviceInfo, 'chipClass' | 'version' | 'identifier'>) {
  const v = d.version;
  const out: { tool: string; supported: boolean; why: string }[] = [];
  const oniOS15to18 = cmp(v, '15.0') >= 0 && cmp(v, '18.7.1') <= 0;
  const oniOS26 = v.startsWith('26.');

  if (d.chipClass === 'A8-A11') {
    out.push({ tool: 'palera1n', supported: true, why: 'checkm8 bootROM 漏洞，A8–A11 全版本可越（需 USB 引导）' });
  } else {
    out.push({ tool: 'palera1n', supported: false, why: 'palera1n 只覆盖 A8–A11（checkm8），你的芯片不在内' });
  }

  if (d.chipClass === 'A12/A13') {
    out.push({ tool: 'Dopamine', supported: oniOS15to18 || (oniOS26 && cmp(v, '26.0.1') <= 0), why: 'A12/A13：15.0–18.7.1，以及 26.0–26.0.1' });
  } else if (d.chipClass === 'A14-A17' || d.chipClass === 'M1/M2') {
    const ok = oniOS15to18 && cmp(v, '17.3.1') <= 0;
    out.push({ tool: 'Dopamine', supported: ok, why: 'A14–A17 / M1 / M2：15.0–17.3.1（上限 17.3.1）' });
  } else {
    out.push({ tool: 'Dopamine', supported: false, why: '不支持 ' + d.chipClass + ' 芯片' });
  }

  const relaxinOk =
    d.chipClass === 'A12/A13'
      ? (cmp(v, '16.5') >= 0 && cmp(v, '18.7.1') <= 0) || (cmp(v, '26.0') >= 0 && cmp(v, '26.0.1') <= 0)
      : d.chipClass === 'A14-A17'
        ? cmp(v, '16.5') >= 0 && cmp(v, '17.3.1') <= 0
        : false;
  out.push({
    tool: 'Relaxin',
    supported: relaxinOk,
    why: 'roothide 半越狱（public beta）：A12/A13 → 16.5–18.7.1 或 26.0–26.0.1；A14–A17 → 16.5–17.3.1；不支持 M 系',
  });

  out.push({
    tool: 'NathanLR / Bootstrap',
    supported: cmp(v, '16.5.1') >= 0 && cmp(v, '17.0') <= 0,
    why: '半越狱，仅 16.5.1–17.0',
  });
  out.push({ tool: 'Chollima', supported: false, why: '私有链，仅 iPhone 18 Pro / 27.0.1 演示，未发布' });
  out.push({ tool: 'AltStore / SideStore', supported: true, why: '侧载（非越狱）：7 天续签，最多 3 个 App' });
  return out;
}

/** 给截图/演示用：抹掉 UDID 尾号、型号、区域、设备名 */
export function maskDevice(d: DeviceInfo): DeviceInfo {
  return {
    ...d,
    udid: '…',
    name: d.kind === 'iPad' ? 'iPad' : 'iPhone',
    modelNumber: '—',
    region: '—',
  };
}

export async function run(cmd: string, args: string[], timeout = 12000): Promise<string> {
  try {
    const { stdout } = await pexec(cmd, args, { timeout, encoding: 'utf8' });
    return stdout.trim();
  } catch {
    return '';
  }
}

export async function listDevices(): Promise<DeviceInfo[]> {
  const ids = (await run('idevice_id', ['-l'])).split('\n').filter(Boolean);
  const devices: DeviceInfo[] = [];

  for (const udid of ids) {
    const info = await run('ideviceinfo', ['-u', udid]);
    const kv: Record<string, string> = {};
    for (const line of info.split('\n')) {
      const m = line.match(/^([A-Za-z]+):\s*(.*)$/);
      if (m) kv[m[1]] = m[2].trim();
    }
    const identifier = kv['ProductType'] || kv['HardwareModel'] || '?';
    const kind: DeviceInfo['kind'] = identifier.startsWith('iPad') ? 'iPad' : identifier.startsWith('iPhone') ? 'iPhone' : 'unknown';
    const meta = IPHONE[identifier] || IPAD[identifier];
    const version = kv['ProductVersion'] || '?';
    const build = kv['BuildVersion'] || '?';

    let signed: string[] = [];
    let latest: string | undefined;
    try {
      const raw = await run('curl', ['-sS', '-m', '12', 'https://api.ipsw.me/v4/device/' + identifier + '?type=ipsw']);
      const data = JSON.parse(raw);
      signed = (data.firmwares || []).filter((f: any) => f.signed).map((f: any) => f.version + ' (' + f.buildid + ')');
      latest = data.firmwares?.[0] ? String(data.firmwares[0].version) : undefined;
    } catch {
      /* 签名查询失败不阻塞 */
    }

    const chipClass = meta?.chipClass || 'unknown';
    devices.push({
      udid: udid.slice(0, 8) + '…' + udid.slice(-4),
      connected: true,
      identifier,
      name: kv['DeviceName'] || meta?.name || '未知设备',
      marketing: meta?.name || '未知机型',
      soc: meta?.soc || '未知 SoC',
      chipClass,
      version,
      build,
      arch: kv['CPUArchitecture'],
      region: kv['RegionInfo'],
      modelNumber: kv['ModelNumber'],
      hardwareModel: kv['HardwareModel'],
      kind,
      signed,
      latest,
      verdicts: jailbreakVerdicts({ chipClass, version, identifier }),
      trollstore: trollstoreVerdict(chipClass, version),
      targets: buildTargets(chipClass, version),
      tsTools: TS_TOOLS.map((t) => {
        const v = toolVerdict(t, version, cmp(version, TROLLSTORE_MAX) <= 0);
        return { name: t.name, kind: t.kind, repo: t.repo, url: t.url, needsTrollStore: t.needsTrollStore, supported: v.ok, why: v.why };
      }),
    });
  }
  return devices;
}
