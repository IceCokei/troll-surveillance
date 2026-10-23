import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { getProfile, saveProfile, getItems, saveItems, getMeta, saveDigest, today, saveDeviceSnapshot } from '../lib/store';
import { analyze, toolSupports } from '../lib/analyze';
import { buildDigest } from '../lib/digest';
import { TOOLS } from '../lib/knowledge';
import type { RawItem } from '../lib/types';

const NAMES: Record<string, { name: string; soc: string }> = {
  'iPhone17,1': { name: 'iPhone 16 Pro', soc: 'A18 Pro (t8140)' },
  'iPhone17,2': { name: 'iPhone 16 Pro Max', soc: 'A18 Pro (t8140)' },
  'iPhone17,3': { name: 'iPhone 16', soc: 'A18 (t8140)' },
  'iPhone17,4': { name: 'iPhone 16 Plus', soc: 'A18 (t8140)' },
  'iPhone18,1': { name: 'iPhone 17 Pro', soc: 'A19 Pro (t8150)' },
  'iPhone18,3': { name: 'iPhone 17', soc: 'A19 (t8150)' },
  'iPhone19,2': { name: 'iPhone 18 Pro', soc: 'A20 Pro (t8160)' },
  'iPhone19,3': { name: 'iPhone 18 Pro Max', soc: 'A20 Pro (t8160)' },
  'iPhone19,4': { name: 'iPhone Duo', soc: 'A20 Pro (t8160)' },
};

function run(cmd: string, args: string[]): string {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (e: any) {
    return '';
  }
}

function diagnose(): void {
  console.log('❌ 没有发现已连接的 iOS 设备\n');
  const usb = run('system_profiler', ['SPUSBDataType']);
  const apple = (usb.match(/iPhone|iPad|Apple Mobile Device/gi) || []).length;
  console.log('诊断：');
  console.log('  usbmuxd socket : ' + (fs.existsSync('/var/run/usbmuxd') ? '存在' : '缺失'));
  console.log('  usbmuxd 进程   : ' + (run('pgrep', ['-x', 'usbmuxd']) || '未运行'));
  console.log('  USB 树里的苹果设备 : ' + (apple ? apple + ' 个' : '0 个 ← 说明系统层面就没看到手机'));
  console.log('');
  console.log('按顺序排查：');
  console.log('  1. 换一根数据线（很多线只能充电），换 Mac 上的另一个 USB-C 口，不要用扩展坞');
  console.log('  2. 解锁手机 → 插线 → 手机上点「信任」并输入密码');
  console.log('  3. 手机 设置 → 隐私与安全性 → 开发者模式（iOS 16+ 需要开启，否则部分服务不可用）');
  console.log('  4. 配对：idevicepair pair   （成功后会打印 SUCCESS: Paired with device ...）');
  console.log('  5. 复核：idevice_id -l      （应输出 40 位 UDID）');
  console.log('  6. 无线调试：手机与 Mac 同一 WiFi + 已配对后，idevice_id -n');
}

function main() {
  const write = process.argv.includes('--write');
  const ids = run('idevice_id', ['-l']).split('\n').filter(Boolean);

  if (!ids.length) {
    const netIds = run('idevice_id', ['-n']).split('\n').filter(Boolean);
    if (!netIds.length) {
      diagnose();
      process.exitCode = 1;
      return;
    }
    ids.push(...netIds);
  }

  const udid = ids[0];
  const info = run('ideviceinfo', ['-u', udid]);
  const kv: Record<string, string> = {};
  for (const line of info.split('\n')) {
    const m = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (m) kv[m[1]] = m[2].trim();
  }

  const type = kv['ProductType'] || kv['HardwareModel'] || '?';
  const ver = kv['ProductVersion'] || '?';
  const build = kv['BuildVersion'] || '?';
  const known = NAMES[type];
  const model = known?.name || kv['DeviceName'] || '未知机型';
  const soc = known?.soc || '未知 SoC';

  console.log('设备信息（来自 ideviceinfo）');
  console.log('  UDID        : ' + udid.slice(0, 8) + '…' + udid.slice(-4));
  console.log('  机型标识    : ' + type);
  console.log('  营销名      : ' + model);
  console.log('  SoC         : ' + soc);
  console.log('  系统        : iOS ' + ver + ' (' + build + ')');
  if (kv['CPUArchitecture']) console.log('  CPU 架构    : ' + kv['CPUArchitecture']);
  if (kv['RegionInfo']) console.log('  区域        : ' + kv['RegionInfo']);
  if (kv['SerialNumber']) console.log('  序列号      : ' + kv['SerialNumber'].slice(0, 4) + '…');
  console.log('');

  // 签名状态
  let signed: string[] = [];
  try {
    const res = execFileSync('curl', ['-sS', '-m', '20', 'https://api.ipsw.me/v4/device/' + type + '?type=ipsw'], { encoding: 'utf8' });
    const data = JSON.parse(res);
    signed = (data.firmwares || []).filter((f: any) => f.signed).map((f: any) => f.version + ' (' + f.buildid + ')');
    const latest = data.firmwares?.[0];
    console.log('签名状态（ipsw.me）');
    console.log('  当前版本    : ' + ver + ' → ' + (signed.some((s) => s.startsWith(ver)) ? '仍在签名 ✅ 可 DFU 还原' : '已停签名 ❌ 不能回退'));
    console.log('  可刷版本    : ' + (signed.join(', ') || '无'));
    console.log('  最新固件    : ' + (latest ? latest.version + ' ' + latest.buildid : '未知'));
  } catch {
    console.log('签名状态：查询失败');
  }
  console.log('');

  // 与档案对比
  const profile = getProfile();
  const diffs: string[] = [];
  if (profile.identifier !== type) diffs.push('标识 ' + profile.identifier + ' → ' + type);
  if (profile.version !== ver) diffs.push('版本 ' + profile.version + ' → ' + ver);
  if (profile.build !== build) diffs.push('build ' + profile.build + ' → ' + build);
  if (profile.name !== model && model !== '未知机型') diffs.push('机型 ' + profile.name + ' → ' + model);

  if (diffs.length) {
    console.log('档案不一致：');
    for (const d of diffs) console.log('  · ' + d);
  } else {
    console.log('档案一致 ✅');
  }

  saveDeviceSnapshot({
    checkedAt: new Date().toISOString(),
    udidTail: udid.slice(-4),
    identifier: type,
    name: model,
    soc,
    version: ver,
    build,
    arch: kv['CPUArchitecture'],
    region: kv['RegionInfo'],
    modelNumber: kv['ModelNumber'],
    hardwareModel: kv['HardwareModel'],
    signed,
    latest: signed[0],
  });

  const next = {
    name: model !== '未知机型' ? model : profile.name,
    identifier: type,
    version: ver,
    build,
    soc,
  };

  const usable = TOOLS.filter((t) => toolSupports(t, next));
  console.log('\n可用工具（按实测档案重算）：' + (usable.length ? usable.map((t) => t.name).join(' / ') : '无'));

  if (write && diffs.length) {
    saveProfile(next);
    const items = getItems().map((it) => {
      const raw: RawItem = { source: it.source, kind: it.kind, author: it.author, title: it.title, url: it.url, text: it.text, publishedAt: it.publishedAt };
      const fresh = analyze(raw, next);
      fresh.fetchedAt = it.fetchedAt;
      return fresh;
    });
    saveItems(items);
    saveDigest(today(), buildDigest(today(), items, next, getMeta()));
    console.log('已写入 data/profile.json 并重算 ' + items.length + ' 条情报');
  } else if (diffs.length) {
    console.log('\n（加 --write 可把实测结果写进档案并重算全库）');
  }
}

main();
