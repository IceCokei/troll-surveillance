import Link from 'next/link';
import { cookies } from 'next/headers';
import MaxWidthWrapper from '@/components/global/max-width-wrapper';
import AnimationContainer from '@/components/global/animation-container';
import MagicBadge from '@/components/ui/magic-badge';
import { Badge } from '@/components/ui/badge';
import LiveDevices from '@/components/site/LiveDevices';
import { getItems } from '@/lib/store';
import { byTimeDesc, withinYears } from '@/lib/fresh';
import { listDevices, maskDevice, TROLLSTORE_MAX } from '@/lib/devices';
import { TS_TOOLS, toolVerdict } from '@/lib/trollstore';
import { EXPLOITS, exploitApplies } from '@/lib/exploits';
import { t } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function DevicesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const redact = sp.redact === '1';
  const lang = (await cookies()).get('lang')?.value === 'en' ? 'en' : 'zh';
  const [rawDevices, rawItems] = await Promise.all([listDevices(), Promise.resolve(getItems())]);
  const devices = redact ? rawDevices.map(maskDevice) : rawDevices;
  const items = rawItems.filter((i) => withinYears(i.publishedAt)).sort(byTimeDesc);

  const deviceExploits = devices.map((d) => ({
    device: d,
    hits: EXPLOITS.filter((e) => exploitApplies(e, d.chipClass, d.version).ok),
  }));

  const tsTools = TS_TOOLS.map((t) => {
    const feed = items
      .filter((i) => i.source === 'ghatom:' + t.repo + ':commits' || i.source === 'gh:' + t.repo || i.source === 'gh:' + t.repo + ':commits')
      .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
    const latest = feed[0];
    const perDevice = devices.map((d) => ({ device: d, ...toolVerdict(t, d.version, d.trollstore.supported) }));
    return { tool: t, latest, perDevice };
  });

  const trollstoreNews = items
    .filter((i) => i.tags.includes('trollstore'))
    .sort(byTimeDesc)
    .slice(0, 10);

  // 每台设备：只看它自己的版本有没有人提
  const watches = devices.map((d) => {
    const short = d.version.split('.').slice(0, 2).join('.');
    const hits = items
      .filter((i) => {
        const hay = i.title + ' ' + (i.text || '') + ' ' + i.tags.join(' ');
        return new RegExp('\\b' + d.version.replace(/\./g, '\\.') + '\\b').test(hay) || new RegExp('\\b' + short.replace(/\./g, '\\.') + '\\b').test(hay) || hay.includes(d.identifier);
      })
      .sort(byTimeDesc)
      .slice(0, 6);
    return { device: d, hits };
  });

  return (
    <MaxWidthWrapper>
      <AnimationContainer>
        <div className="flex flex-col items-start pt-8">
          <MagicBadge title="设备与 TrollStore" />
          <h1 className="mt-6 font-heading text-3xl font-medium md:text-5xl">{t(lang, 'page.devices.title')}</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            每 5 秒通过 usbmuxd 轮询：连接/断开、机型、系统、越狱与 TrollStore 的判定实时更新。
            判定只针对设备当前这个系统版本，不看别的版本能不能刷。
          </p>
        </div>
      </AnimationContainer>

      <div className="mt-6">
        <LiveDevices initial={devices} redact={redact} />
      </div>

      <AnimationContainer delay={0.05}>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">TrollStore 支持上限</div>
            <div className="mt-2 font-heading text-2xl">≤ {TROLLSTORE_MAX}</div>
            <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
              TrollStore 2 依赖 CoreTrust 多次签名校验漏洞；17.0 以上已修补，没有「TrollStore Lite」这种东西。
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">M 系 iPad 越狱上限</div>
            <div className="mt-2 font-heading text-2xl">Dopamine ≤ 17.3.1</div>
            <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
              M1/M2 设备走 Dopamine 只能到 17.3.1；17.4 之后没有公开方案。
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">你现在该盯什么</div>
            <div className="mt-2 font-heading text-2xl">自己的版本号</div>
            <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
              不是「最新签名版本」，也不是「能不能刷别的版本」——只看你手上这个 build 有没有人做出东西。
            </p>
          </div>
        </div>
      </AnimationContainer>

      <AnimationContainer delay={0.07}>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <MagicBadge title="TrollStore 生态工具" />
            <h2 className="mt-4 font-heading text-xl font-medium md:text-2xl">GitHub 上还在更新的公开工具</h2>
            <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-neutral-500">
              「最新更新」来自各仓库的 commits.atom（不走 API 限额）；「对你的设备」按你当前系统版本 + 是否已有 TrollStore 判定。
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card/40">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border text-[10.5px] uppercase tracking-[0.12em] text-neutral-600">
                <th className="px-4 py-2.5 text-left font-medium">工具</th>
                <th className="px-4 py-2.5 text-left font-medium">类型</th>
                <th className="px-4 py-2.5 text-left font-medium">最新更新</th>
                <th className="px-4 py-2.5 text-left font-medium">前提</th>
                <th className="px-4 py-2.5 text-left font-medium">对你的设备</th>
              </tr>
            </thead>
            <tbody>
              {tsTools.map(({ tool, latest, perDevice }) => (
                <tr key={tool.repo} className="border-b border-border/60 align-top last:border-0 hover:bg-neutral-900/40">
                  <td className="px-4 py-3">
                    <a href={tool.url} target="_blank" rel="noreferrer" className="font-heading text-[13px] text-neutral-200 hover:text-violet-300">{tool.name}</a>
                    <div className="mt-0.5 font-mono text-[10.5px] text-neutral-700">{tool.repo}</div>
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-neutral-500">{tool.kind}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-neutral-500">
                    {latest ? latest.publishedAt.slice(0, 10) : '未抓到'}
                    {latest && <div className="mt-0.5 max-w-[220px] truncate text-[10.5px] text-neutral-700">{latest.title}</div>}
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-neutral-500">
                    {tool.needsTrollStore ? '需 TrollStore' : '不需要'}
                    <div className="text-[10.5px] text-neutral-700">
                      {tool.minVersion || '—'} ≤ iOS ≤ {tool.maxVersion || '不限'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {perDevice.map((p) => (
                      <div key={p.device.udid} className="flex flex-wrap items-baseline gap-1.5 text-[11.5px]">
                        <span className={p.ok ? 'text-emerald-300/90' : 'text-neutral-600'}>{p.ok ? '✓ 可用' : '✕ 不可用'}</span>
                        <span className="text-neutral-600">{p.why}</span>
                      </div>
                    ))}
                    {!perDevice.length && <span className="text-[11.5px] text-neutral-600">未连接设备</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-neutral-500">
          <span className="text-neutral-600">TrollStore 相关作者：</span>
          {['opa334dev', 'verygenericname', 'Lessica', 'dhinakg'].map((h) => (
            <a key={h} href={'https://x.com/' + h} target="_blank" rel="noreferrer" className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[10.5px] text-neutral-400 hover:border-neutral-700 hover:text-violet-300">
              @{h}
            </a>
          ))}
        </div>
      </AnimationContainer>

      <AnimationContainer delay={0.12}>
        <div className="mt-10">
          <MagicBadge title="公开利用代码覆盖" />
          <p className="mt-3 max-w-2xl text-[12.5px] leading-relaxed text-neutral-500">
            只做静态匹配：芯片类别 + 系统版本是否落在这些公开仓库声明的范围内。命中不等于能越狱，详见
            <Link href="/exploits" className="text-violet-300 hover:underline"> 漏洞研究</Link>。
          </p>
          <div className="mt-4 space-y-2">
            {deviceExploits.map((row) => (
              <div key={row.device.udid} className="rounded-xl border border-border bg-card/40 p-4">
                <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
                  <span className="font-heading">{row.device.marketing}</span>
                  <Badge variant="ghost">{row.device.version}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {row.hits.map((h) => (
                    <span key={h.name} className="rounded-md border border-emerald-500/25 bg-emerald-500/[0.07] px-2 py-0.5 text-[11px] text-emerald-200/80">
                      {h.name}
                    </span>
                  ))}
                  {!row.hits.length && <span className="text-[11.5px] text-neutral-600">没有公开利用代码覆盖这台设备的版本与芯片</span>}
                </div>
              </div>
            ))}
            {!deviceExploits.length && <div className="text-[11.5px] text-neutral-600">未连接设备时无法匹配。</div>}
          </div>
        </div>
      </AnimationContainer>

      {watches.map(({ device, hits }) => (
        <AnimationContainer key={device.udid} delay={0.08}>
          <div className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <MagicBadge title={'在等 ' + device.version} />
                <h2 className="mt-4 font-heading text-xl font-medium md:text-2xl">
                  {device.marketing} · 谁提到过 {device.version} / {device.identifier}
                </h2>
              </div>
              <Link href={'/feed?q=' + encodeURIComponent(device.version)} className="text-[12px] text-neutral-500 hover:text-foreground">
                在情报里搜 {device.version} →
              </Link>
            </div>

            <div className="mt-4 space-y-2">
              {hits.map((i) => (
                <div key={i.id} className="rounded-xl border border-border bg-card/40 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-600">
                    <span className="rounded border border-neutral-800 px-1.5 py-0.5 font-mono">{i.score}</span>
                    <span>{i.source}</span>
                    <span>{i.publishedAt.slice(0, 10)}</span>
                    {i.versionsMentioned.length > 0 && (
                      <span className="rounded border border-neutral-800 px-1.5 py-0.5 font-mono">{i.versionsMentioned.slice(0, 4).join(' / ')}</span>
                    )}
                  </div>
                  <a href={i.url} target="_blank" rel="noreferrer" className="mt-1.5 block text-[13px] text-neutral-200 hover:text-violet-300">
                    {i.title.slice(0, 140)}
                  </a>
                  <div className="mt-1 text-[11.5px] text-neutral-600">{i.actionNote}</div>
                </div>
              ))}
              {!hits.length && (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-[12px] leading-relaxed text-neutral-500">
                  目前没有任何情报提到 {device.version} 的越狱或 TrollStore 方案。
                  <br />
                  一旦出现，这个区块会自动列出；也可以看 <Link href="/feed" className="text-violet-300 hover:underline">全部情报</Link>。
                </div>
              )}
            </div>
          </div>
        </AnimationContainer>
      ))}

      <AnimationContainer delay={0.1}>
        <div className="mt-10 flex items-end justify-between gap-3">
          <div>
            <MagicBadge title="TrollStore 动态" />
            <h2 className="mt-4 font-heading text-xl font-medium md:text-2xl">永久签名相关的所有消息</h2>
          </div>
          <Link href="/feed?q=trollstore" className="text-[12px] text-neutral-500 hover:text-foreground">全部 →</Link>
        </div>

        <div className="mt-4 space-y-2">
          {trollstoreNews.map((i) => (
            <div key={i.id} className="rounded-xl border border-border bg-card/40 p-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-600">
                <span className="rounded border border-neutral-800 px-1.5 py-0.5 font-mono">{i.score}</span>
                <span>{i.source}</span>
                <span>{i.publishedAt.slice(0, 10)}</span>
                {i.actionable && <Badge variant="ok">可执行</Badge>}
              </div>
              <a href={i.url} target="_blank" rel="noreferrer" className="mt-1.5 block text-[13px] text-neutral-200 hover:text-violet-300">
                {i.title.slice(0, 140)}
              </a>
              <div className="mt-1 text-[11.5px] text-neutral-600">{i.actionNote}</div>
            </div>
          ))}
          {!trollstoreNews.length && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-[12px] text-neutral-500">
              暂无 TrollStore 相关条目。点右上角「同步」抓一次（已接入 opa334/TrollStore 与 r/Trollstore）。
            </div>
          )}
        </div>
      </AnimationContainer>
    </MaxWidthWrapper>
  );
}
