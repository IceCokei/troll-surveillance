import Link from 'next/link';
import { FileText, ArrowUpRight } from 'lucide-react';
import fs from 'node:fs';
import path from 'node:path';
import { getDigest, listDigests, today, getMeta, getProfile } from '@/lib/store';
import { cn } from '@/lib/cn';
import MaxWidthWrapper from '@/components/global/max-width-wrapper';
import AnimationContainer from '@/components/global/animation-container';
import MagicBadge from '@/components/ui/magic-badge';
import DigestSwitch from '@/components/digest/DigestSwitch';
import { toCN } from '@/lib/date';

export const dynamic = 'force-dynamic';

export default async function DigestPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const dates = listDigests();
  const date = sp.date || dates[0] || today();
  const md = getDigest(date);
  const profile = getProfile();
  const meta = getMeta();
  const initial = sp.view === 'reading' ? 'reading' : 'terminal';

  let watch: { intervalMs?: number; lastRunAt?: string; nextRunAt?: string; runs?: number } | null = null;
  try {
    watch = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'watch.json'), 'utf8'));
  } catch {
    watch = null;
  }

  return (
    <MaxWidthWrapper>
      <AnimationContainer>
        <div className="flex flex-col items-start pt-8">
          <MagicBadge title="每日简报" />
          <h1 className="mt-6 font-heading text-3xl font-medium md:text-5xl">{date}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>
              同步于 {meta.lastSyncAt ? toCN(meta.lastSyncAt) : '尚未同步'}
              <span className="ml-1 text-neutral-600">（北京时间）</span>
            </span>
            {watch?.intervalMs && (
              <span className="text-neutral-600">
                · 每 {Math.round(watch.intervalMs / 1000)} 秒自动同步
                {watch.nextRunAt ? '，下次 ' + toCN(watch.nextRunAt, false) : ''}
              </span>
            )}
          </p>
        </div>
      </AnimationContainer>

      <div className="mt-7 flex flex-wrap items-center gap-1.5">
        {dates.slice(0, 30).map((d) => (
          <Link
            key={d}
            href={'/digest?date=' + d}
            className={cn(
              'rounded-full border px-3 py-1 font-mono text-[11.5px] transition-colors',
              d === date
                ? 'border-neutral-700 bg-neutral-800 text-foreground'
                : 'border-border text-neutral-500 hover:border-neutral-700 hover:text-foreground'
            )}
          >
            {d}
          </Link>
        ))}
        {!dates.length && <span className="text-xs text-neutral-600">还没有简报，先同步一次。</span>}
      </div>

      <AnimationContainer delay={0.05}>
        <div className="mt-6">
          {md ? (
            <DigestSwitch markdown={md} date={date} device={profile.identifier} initial={initial} />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center text-sm text-neutral-500">
              该日期没有简报。
            </div>
          )}
        </div>
      </AnimationContainer>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11.5px] text-neutral-600">
        <a href={'/api/digest?date=' + date} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-neutral-300">
          <FileText className="size-3" /> 原始 Markdown（归档用）
        </a>
        <a href={'/digest?date=' + date + '&view=reading'} className="inline-flex items-center gap-1 hover:text-neutral-300">
          <ArrowUpRight className="size-3" /> 切到阅读版
        </a>
        <span className="font-mono">data/digests/{date}.md</span>
      </div>
    </MaxWidthWrapper>
  );
}
