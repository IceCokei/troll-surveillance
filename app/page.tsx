import Link from 'next/link';
import { ArrowRight, Fingerprint, ShieldCheck, Smartphone, Tablet, Terminal } from 'lucide-react';
import { getMeta, getProfile, today } from '@/lib/store';
import { getVisibleItems } from '@/lib/items';
import { byStateThenTime, isThisYear, withinYears } from '@/lib/fresh';
import { dedupeByTool } from '@/lib/dedupe';
import { localDate } from '@/lib/date';
import { TOOLS } from '@/lib/knowledge';
import { toolSupports } from '@/lib/analyze';
import { listDevices, maskDevice } from '@/lib/devices';
import AnimationContainer from '@/components/global/animation-container';
import MaxWidthWrapper from '@/components/global/max-width-wrapper';
import MagicBadge from '@/components/ui/magic-badge';
import { BorderBeam } from '@/components/ui/border-beam';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ItemCard from '@/components/site/item-card';
import SyncButton from '@/components/SyncButton';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const redact = sp.redact === '1';
  const profile = getProfile();
  const meta = getMeta();
  const items = getVisibleItems();
  const rawDevices = await listDevices();
  const devices = redact ? rawDevices.map(maskDevice) : rawDevices;
  const d = today();

  const dayItems = items.filter((i) => localDate(i.fetchedAt) === d);
  const timeSorted = dedupeByTool([...dayItems].sort(byStateThenTime)).items;
  const thisYearItems = timeSorted.filter((i) => isThisYear(i.publishedAt));
  const olderItems = timeSorted.filter((i) => !isThisYear(i.publishedAt) && withinYears(i.publishedAt));
  const actionable = timeSorted.filter((i) => i.actionable);
  const exploits = dayItems.filter((i) => i.category === 'exploit');
  const badSources = Object.entries(meta.sourceStatus).filter(([, v]) => !v.ok);
  const usableForProfile = TOOLS.filter((t) => toolSupports(t, profile) && t.kind !== 'sideload');

  const stats = [
    { label: '今日入库', value: dayItems.length, hint: '条情报（含往年重抓）' },
    { label: '可执行', value: actionable.length, hint: '条动作', accent: actionable.length > 0 },
    { label: '漏洞情报', value: exploits.length, hint: '条链路相关' },
    { label: '采集失败', value: badSources.length, hint: '个数据源', warn: badSources.length > 0 },
  ];

  return (
    <div className="size-full overflow-x-hidden">
      <MaxWidthWrapper>
        <div className="flex w-full flex-col items-center justify-center bg-gradient-to-t from-background pb-6 pt-10 text-center md:pt-16">
          <AnimationContainer className="flex w-full flex-col items-center justify-center text-center">
            <MagicBadge title={devices.length ? devices.length + ' 台设备已连接' : 'iOS / iPadOS 越狱情报'} />

            <h1 className="w-full py-6 font-heading text-4xl font-medium leading-[1.12] tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
              越狱情报，
              <span className="text-gradient">精准到你的设备</span>
            </h1>

            <p className="mb-10 max-w-xl text-base tracking-tight text-muted-foreground text-balance md:text-lg">
              盯 X 作者、GitHub 发版、漏洞披露与签名窗口。
              <br className="hidden md:block" />
              只回答一件事：这条东西，你现在到底能不能用。
            </p>

            <div className="z-50 flex items-center justify-center gap-4 whitespace-nowrap">
              <SyncButton variant="primary" size="lg" label="立即同步" />
              <Link href="/digest">
                <Button variant="outline" size="lg">
                  查看今日简报
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>
          </AnimationContainer>

          {/* macOS 终端面板：窗口常驻，设备信息仅在有设备时显示 */}
          <AnimationContainer delay={0.2} className="relative w-full px-2 pb-10 pt-14 md:py-20">
            <div className="absolute inset-0 left-1/2 top-[10%] h-1/4 w-3/4 -translate-x-1/2 animate-image-glow gradient blur-[5rem] md:h-1/3" />
            <div className="relative -m-2 rounded-xl bg-opacity-50 p-2 ring-1 ring-inset ring-foreground/20 backdrop-blur-3xl lg:-m-4 lg:rounded-2xl">
              <BorderBeam size={250} duration={12} delay={9} />
              <div className="rounded-md border border-border bg-[#08080a]/90 p-6 text-left lg:rounded-xl lg:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <Terminal className="size-4 text-violet-400" />
                    <span className="font-mono text-xs">radar devices --live</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={devices.length ? 'ok' : 'ghost'}>{devices.length ? devices.length + ' 台在线' : '未连接'}</Badge>
                    <Link href="/devices" className="font-mono text-[11px] text-neutral-500 hover:text-violet-300">设备页 →</Link>
                  </div>
                </div>

                {devices.length ? (
                  devices.map((dev) => {
                    const Icon = dev.kind === 'iPad' ? Tablet : Smartphone;
                    const jb = dev.verdicts.filter((v) => v.supported && !v.tool.includes('SideStore'));
                    return (
                      <div key={dev.udid} className="grid grid-cols-2 gap-6 border-b border-border/60 py-5 last:border-0 md:grid-cols-4">
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-neutral-600">
                            <Icon className="size-3" /> 设备
                          </div>
                          <div className="mt-2 font-heading text-[15px] leading-tight">{dev.marketing}</div>
                          <div className="mt-1 font-mono text-[11px] text-neutral-600">{dev.identifier}</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-neutral-600">
                            <Fingerprint className="size-3" /> 系统
                          </div>
                          <div className="mt-2 font-heading text-[15px] leading-tight">{dev.kind === 'iPad' ? 'iPadOS' : 'iOS'} {dev.version}</div>
                          <div className="mt-1 font-mono text-[11px] text-neutral-600">build {dev.build}</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-neutral-600">
                            <ShieldCheck className="size-3" /> 越狱
                          </div>
                          <div className={`mt-2 font-heading text-[15px] leading-tight ${jb.length ? 'text-emerald-300' : 'text-neutral-400'}`}>
                            {jb.length ? jb.map((v) => v.tool).join(' / ') : '无可用工具'}
                          </div>
                          <div className="mt-1 font-mono text-[11px] text-neutral-600">{dev.soc}</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-neutral-600">
                            <Terminal className="size-3" /> TrollStore
                          </div>
                          <div className={`mt-2 font-heading text-[15px] leading-tight ${dev.trollstore.supported ? 'text-emerald-300' : 'text-neutral-400'}`}>
                            {dev.trollstore.supported ? '可用' : '不可用'}
                          </div>
                          <div className="mt-1 font-mono text-[11px] text-neutral-600">上限 {dev.trollstore.max}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-7 font-mono text-[12px] leading-relaxed text-neutral-600">
                    <div>
                      <span className="text-emerald-500">$</span> usbmuxd --list
                    </div>
                    <div className="mt-1 text-neutral-700">no device connected</div>
                    <div className="mt-1 text-neutral-700">
                      <span className="animate-[caret-blink_1.25s_ease-out_infinite]">█</span>
                    </div>
                    <div className="mt-3 text-[11px] text-neutral-700">
                      插线 → 解锁 → 点「信任」后自动出现；也可到 <Link href="/devices" className="text-violet-300/80 hover:text-violet-200">设备页</Link> 查看历史快照
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-lg border border-border bg-neutral-950/60 px-4 py-3 font-mono text-[11.5px] leading-relaxed text-neutral-500">
                  <span className="text-emerald-500">$</span> judge --tool-public --version-in-range --soc-match{' '}
                  <span className="text-neutral-700">// 三条全中才标可执行；私有链永不计入</span>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 -bottom-4 z-40 h-1/2 bg-gradient-to-t from-background" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 h-1/4 bg-gradient-to-t from-background md:-bottom-8" />
          </AnimationContainer>
        </div>
      </MaxWidthWrapper>

      <MaxWidthWrapper>
        <AnimationContainer delay={0.1}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card/50 p-5">
                <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">{s.label}</div>
                <div className={`mt-3 font-heading text-3xl font-medium tabular-nums ${s.accent ? 'text-emerald-400' : s.warn ? 'text-amber-400' : 'text-foreground'}`}>{s.value}</div>
                <div className="mt-1 text-[11px] text-neutral-600">{s.hint}</div>
              </div>
            ))}
          </div>
        </AnimationContainer>
      </MaxWidthWrapper>

      <MaxWidthWrapper className="pt-16">
        <AnimationContainer>
          <div className="flex flex-col items-start">
            <MagicBadge title="可以立刻做" />
            <h2 className="mt-6 font-heading text-2xl font-medium leading-[1.15] md:text-4xl">
              {actionable.length > 0 ? '今天有能动手的事' : '今天没有能动手的事'}
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              {actionable.length > 0
                ? '以下条目同时满足：工具已公开、版本在支持区间、SoC 匹配。'
                : '所有情报都只值记录。这不是系统没抓到，而是你的设备与版本上确实没有公开工具可用。'}
            </p>
          </div>
        </AnimationContainer>

        <div className="mt-6 space-y-3">
          {actionable.slice(0, 5).map((it) => <ItemCard key={it.id} it={it} compact />)}
          {!actionable.length && (
            <div className="rounded-xl border border-dashed border-border bg-card/30 p-6 text-sm text-neutral-500">
              没有可执行项。等私有链公开、或有人把利用移植到你的芯片之后，这里才会亮。
            </div>
          )}
        </div>
      </MaxWidthWrapper>

      <MaxWidthWrapper className="pt-16">
        <AnimationContainer>
          <div className="flex items-end justify-between gap-4">
            <div>
              <MagicBadge title={new Date().getFullYear() + ' 年情报'} />
              <h2 className="mt-6 font-heading text-2xl font-medium md:text-4xl">按时间倒序</h2>
              <p className="mt-2 text-[12.5px] text-neutral-500">最新发布的在最上面；超过 5 年的旧消息不再展示。</p>
            </div>
            <Link href="/feed" className="hidden shrink-0 items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-foreground md:flex">
              查看全部 <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </AnimationContainer>

        <div className="mt-6 space-y-3">
          {thisYearItems.slice(0, 12).map((it) => <ItemCard key={it.id} it={it} />)}
          {!thisYearItems.length && (
            <div className="rounded-xl border border-border bg-card/40 p-8 text-center text-sm text-neutral-500">
              今年还没有新情报。点右上角「同步」抓一次。
            </div>
          )}
        </div>

        {olderItems.length > 0 && (
          <details className="mt-4 rounded-xl border border-border bg-card/30 p-4">
            <summary className="cursor-pointer text-[12.5px] text-neutral-500">
              往年消息（{new Date().getFullYear() - 4}–{new Date().getFullYear() - 1}，共 {olderItems.length} 条，点开查看）
            </summary>
            <div className="mt-3 space-y-3">
              {olderItems.slice(0, 20).map((it) => <ItemCard key={it.id} it={it} compact />)}
            </div>
          </details>
        )}
      </MaxWidthWrapper>

      <MaxWidthWrapper className="pt-16">
        <div id="health">
          <AnimationContainer><MagicBadge title="采集健康度" /></AnimationContainer>
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-neutral-600">
                  <th className="px-5 py-3 text-left font-medium">源</th>
                  <th className="px-5 py-3 text-left font-medium">状态</th>
                  <th className="px-5 py-3 text-left font-medium">条数</th>
                  <th className="px-5 py-3 text-left font-medium">时间</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {Object.entries(meta.sourceStatus).map(([k, v]) => (
                  <tr key={k} className="border-b border-border/60 last:border-0 hover:bg-neutral-900/40">
                    <td className="px-5 py-3 text-neutral-400">{k}</td>
                    <td className="px-5 py-3">{v.ok ? <Badge variant="ok">ok</Badge> : <Badge variant="bad">fail</Badge>}</td>
                    <td className="px-5 py-3 text-neutral-500">{v.count ?? 0}</td>
                    <td className="px-5 py-3 text-neutral-600">{v.at.slice(11, 19)}{v.message ? ' · ' + v.message.slice(0, 48) : ''}</td>
                  </tr>
                ))}
                {!Object.keys(meta.sourceStatus).length && (
                  <tr><td colSpan={4} className="px-5 py-6 text-center text-neutral-600">尚未同步</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
