import { Compass, Glasses, Hammer, Laptop, Smartphone, Tablet, Tv, Watch, Activity } from 'lucide-react';
import type { OsPush, OsRelease, OsRow } from '@/lib/osversions';
import { t, type Lang } from '@/lib/i18n';
import { toCN } from '@/lib/date';
import MagicBadge from '@/components/ui/magic-badge';
import { Badge } from '@/components/ui/badge';

const ICONS: Record<string, typeof Smartphone> = {
  Xcode: Hammer,
  iOS: Smartphone,
  iPadOS: Tablet,
  macOS: Laptop,
  tvOS: Tv,
  visionOS: Glasses,
  watchOS: Watch,
  Safari: Compass,
};

function cmp(a: string, b: string): number {
  const norm = (v: string) =>
    String(v || '')
      .replace(/[^0-9.]/g, '')
      .split('.')
      .filter(Boolean)
      .map((n) => parseInt(n, 10) || 0);
  const pa = norm(a);
  const pb = norm(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

function ago(iso: string, lang: Lang): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return toCN(iso).slice(0, 10);
  const m = Math.round(ms / 60000);
  if (m < 1) return lang === 'en' ? 'just now' : '刚刚';
  if (m < 60) return lang === 'en' ? m + 'm ago' : m + ' 分钟前';
  const h = Math.round(m / 60);
  if (h < 24) return lang === 'en' ? h + 'h ago' : h + ' 小时前';
  const d = Math.round(h / 24);
  if (d < 30) return lang === 'en' ? d + 'd ago' : d + ' 天前';
  return toCN(iso).slice(0, 10);
}

function ChannelBadge({ channel, lang }: { channel: OsRelease['channel']; lang: Lang }) {
  if (channel === 'rc') return <Badge variant="acc">{t(lang, 'home.os.ch.rc')}</Badge>;
  if (channel === 'beta') return <Badge variant="warn">{t(lang, 'home.os.ch.beta')}</Badge>;
  return <Badge variant="ok">{t(lang, 'home.os.ch.release')}</Badge>;
}

/** 新 / 旧：是否由本次推送带出来，以及从哪个版本升上来 */
function StateChip({ row, lang }: { row: OsRow; lang: Lang }) {
  if (row.inPush) {
    return (
      <span className="inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap font-mono text-[11px] text-emerald-400">
        <span className="size-1.5 shrink-0 rounded-full bg-emerald-400" />
        <span className="hidden sm:inline">{t(lang, 'home.os.stateNew')}</span>
        <span className="sm:hidden">{t(lang, 'home.os.stateNewShort')}</span>
        {row.prevVersion ? (
          <span className="truncate text-neutral-600">
            {t(lang, 'home.os.from', {
              v: row.prevVersion + (row.prevLabel && !/^rc$/i.test(row.prevLabel) ? ' ' + row.prevLabel : ''),
            })}
          </span>
        ) : null}
      </span>
    );
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap font-mono text-[11px] text-neutral-600">
      <span className="size-1.5 shrink-0 rounded-full bg-neutral-700" />
      <span className="hidden sm:inline">{t(lang, 'home.os.stateOld')}</span>
      <span className="sm:hidden">{t(lang, 'home.os.stateOldShort')}</span>
      {row.prevPublishedAt ? (
        <span className="hidden truncate text-neutral-700 lg:inline">{ago(row.prevPublishedAt, lang)}</span>
      ) : null}
    </span>
  );
}

/** 与当前设备对比：只比 iOS / iPadOS 这条线 */
function Compare({ release, mine, lang }: { release: OsRelease; mine?: string; lang: Lang }) {
  if (!mine) return <span className="font-mono text-[11px] text-neutral-700">—</span>;
  const d = cmp(release.version, mine);
  const label = d > 0 ? t(lang, 'home.os.newer') : d === 0 ? t(lang, 'home.os.same') : t(lang, 'home.os.lower');
  return (
    <span className={`font-mono text-[11px] ${d > 0 ? 'text-amber-400' : d === 0 ? 'text-emerald-400' : 'text-neutral-600'}`}>
      {t(lang, 'home.os.yours', { v: mine })} · {label}
    </span>
  );
}

export default function OsPushPanel({
  lang,
  push,
  rows,
  deviceVersions,
  fetchedAt,
  ok,
  error,
}: {
  lang: Lang;
  push: OsPush | null;
  rows: OsRow[];
  deviceVersions: Record<string, string>;
  fetchedAt: string;
  ok: boolean;
  error?: string;
}) {
  if (!rows.length) {
    return (
      <section>
        <MagicBadge title={t(lang, 'home.os.badge')} />
        <div className="mt-5 rounded-xl border border-dashed border-border bg-card/30 p-6 text-sm text-neutral-500">
          {t(lang, 'home.os.empty')}
          {error ? <span className="ml-2 font-mono text-[11px] text-rose-300">{error.slice(0, 80)}</span> : null}
        </div>
      </section>
    );
  }

  // 「刚推」按 Apple 实际推送时刻判断，不是按我们何时抓到
  const fresh = push ? Date.now() - new Date(push.at).getTime() < 36 * 3600 * 1000 : false;

  return (
    <section id="apple-push" className="scroll-mt-24">
      <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
        <div>
          <MagicBadge title={t(lang, 'home.os.badge')} />
          <h2 className="mt-6 font-heading text-2xl font-medium leading-[1.15] md:text-4xl">
            {push && push.items.length > 1
              ? fresh
                ? t(lang, 'home.os.title', { n: push.items.length })
                : t(lang, 'home.os.titleRecent', { n: push.items.length })
              : t(lang, 'home.os.titleSingle')}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">{t(lang, 'home.os.sub')}</p>
        </div>

        {/* 推送时间放外面，右对齐；列表里只留版本与构建号 */}
        <div className="shrink-0 rounded-xl border border-border bg-card/40 px-5 py-4 text-left md:min-w-[220px] md:text-right">
          <div className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-neutral-600 md:justify-end">
            {t(lang, 'home.os.lastPush')}
            {fresh ? <span className="size-1.5 rounded-full bg-emerald-400" /> : null}
          </div>
          <div className="mt-2 font-heading text-xl tabular-nums leading-tight">
            {push ? toCN(push.at) : '—'}
          </div>
          <div className="mt-3 flex items-center gap-1.5 font-mono text-[10.5px] text-neutral-600 md:justify-end">
            <Activity className="size-3" />
            {ok ? 'live' : t(lang, 'home.os.stale')} · {t(lang, 'home.os.cadence')}
          </div>
          <div className="mt-2 font-mono text-[10.5px] text-neutral-700 md:justify-end">
            {t(lang, 'home.os.updated', { t: toCN(fetchedAt) })}
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card/50">
        {push && push.items.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
            {push.items.map((r) => (
              <span
                key={r.platform + r.build}
                className="rounded-md border border-neutral-800 bg-neutral-900/60 px-2 py-0.5 font-mono text-[11px] text-neutral-400"
              >
                {r.platform} <span className="text-foreground">{r.version}</span> {r.build}
              </span>
            ))}
          </div>
        ) : null}

        <div className="divide-y divide-border/70">
          {rows.map((r) => {
            const Icon = ICONS[r.platform] || Smartphone;
            return (
              <div key={r.platform + r.build} className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5">
                <Icon className="size-4 shrink-0 text-neutral-500" />
                <div className="w-16 shrink-0 font-heading text-[13px] leading-tight sm:w-20 sm:text-[13.5px]">
                  {r.platform}
                </div>
                <div className="w-14 shrink-0 font-mono text-[12px] leading-tight sm:w-16">
                  <span className="text-foreground">{r.version}</span>
                  {r.label && !/^rc$/i.test(r.label) ? <span className="ml-1 text-neutral-600">{r.label}</span> : null}
                </div>
                <div className="hidden w-20 shrink-0 font-mono text-[11px] text-neutral-600 sm:block">{r.build}</div>
                <div className="w-[76px] shrink-0 overflow-hidden sm:w-[150px]">
                  <StateChip row={r} lang={lang} />
                </div>
                <div className="hidden min-w-0 flex-1 lg:block">
                  <Compare release={r} mine={deviceVersions[r.platform]} lang={lang} />
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-3">
                  <span className="hidden font-mono text-[10.5px] text-neutral-700 md:inline">{ago(r.publishedAt, lang)}</span>
                  <ChannelBadge channel={r.channel} lang={lang} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-border px-4 py-3 font-mono text-[11px] leading-relaxed text-neutral-600 sm:px-5">
          <span className="text-emerald-500">$</span> curl -s https://developer.apple.com/news/releases/rss/releases.rss{' '}
          <span className="text-neutral-700">// {t(lang, 'home.os.devNote')}</span>
        </div>
      </div>
    </section>
  );
}
