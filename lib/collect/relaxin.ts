import { fetchText } from './http';
import type { RawItem } from '../types';

function cmp(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

/**
 * Relaxin（OwnGoal Studio）官网是纯前端 SPA：
 * 版本号与支持矩阵都打在 assets/index-*.js 里，因此直接从 bundle 读取，
 * 不依赖 GitHub release（他们没有公开仓库）。
 */
export async function collectRelaxin(): Promise<RawItem[]> {
  const html = await fetchText('https://relaxin.owngoal.dev/', { timeoutMs: 20000 });
  const bundlePath = (html.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/) || [])[0];
  if (!bundlePath) throw new Error('bundle path not found');

  const js = await fetchText('https://relaxin.owngoal.dev' + bundlePath, { timeoutMs: 30000 });

  const versions = [...js.matchAll(/changelog\/(\d+\.\d+\.\d+)\.md/g)].map((m) => m[1]);
  const latest = versions.sort(cmp).pop() || 'unknown';

  const rangeA12 = (js.match(/\["A12\/A13","([^"]+)"\]/) || [])[1] || 'iOS 16.5–18.7.1, 26.0–26.0.1';
  const rangeA14 = (js.match(/\["A14–A17","([^"]+)"\]/) || [])[1] || 'iOS 16.5–17.3.1';

  return [
    {
      kind: 'rss',
      source: 'site:relaxin',
      author: 'Relaxin (OwnGoal Studio)',
      title: 'Relaxin ' + latest + ' · roothide 越狱',
      text:
        'product: relaxin ｜ type: roothide（基于 Dopamine）｜ A12/A13: ' +
        rangeA12 +
        ' ｜ A14–A17: ' +
        rangeA14 +
        ' ｜ 状态: public beta ｜ 另提供 .tipa（iOS 17.0 走 TrollStore 安装）｜ 开发者 @82Flex @roothideDev，安全研究 @0x88FFA357 @Lakr233 @pattern_F_',
      url: 'https://relaxin.owngoal.dev/',
      publishedAt: new Date().toISOString(),
    },
  ];
}
