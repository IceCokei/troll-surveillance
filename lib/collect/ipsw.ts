import { fetchJson } from './http';
import type { RawItem, SigningInfo } from '../types';

export async function fetchSigning(identifier: string): Promise<{ info: SigningInfo; items: RawItem[] }> {
  const data = await fetchJson<any>('https://api.ipsw.me/v4/device/' + identifier + '?type=ipsw', { timeoutMs: 20000 });
  const fw = (data?.firmwares || []).map((f: any) => ({
    version: String(f.version),
    build: String(f.buildid),
    signed: Boolean(f.signed),
    date: f.releasedate,
  }));
  const signed = fw.filter((f: any) => f.signed).map((f: any) => ({ version: f.version, build: f.build }));
  const info: SigningInfo = {
    checkedAt: new Date().toISOString(),
    device: identifier,
    signed,
    latest: fw[0] ? { version: fw[0].version, build: fw[0].build } : null,
  };
  const items: RawItem[] = [
    {
      kind: 'ipsw',
      source: 'ipsw:' + identifier,
      author: 'ipsw.me',
      title:
        identifier +
        ' 签名状态：' +
        (signed.length ? signed.map((s: any) => s.version + '/' + s.build).join(', ') : '全部未签名') +
        (fw[0] ? '（最新 ' + fw[0].version + ' ' + fw[0].build + (fw[0].signed ? '，仍在签名' : '，未签名') + '）' : ''),
      text:
        '最新固件 ' + (fw[0] ? fw[0].version + ' ' + fw[0].build : '未知') +
        '；可刷版本：' + (signed.map((s: any) => s.version).join(', ') || '无') +
        '；历史版本：' + fw.slice(0, 6).map((f: any) => f.version + (f.signed ? '(签名)' : '')).join(', '),
      url: 'https://ipsw.me/' + identifier,
      publishedAt: new Date().toISOString(),
    },
  ];
  return { info, items };
}
