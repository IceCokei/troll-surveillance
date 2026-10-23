import MaxWidthWrapper from '@/components/global/max-width-wrapper';
import AnimationContainer from '@/components/global/animation-container';
import MagicBadge from '@/components/ui/magic-badge';
import { Badge } from '@/components/ui/badge';
import { getMeta } from '@/lib/store';
import { cookies } from 'next/headers';
import { t } from '@/lib/i18n';
import { enNote, stateTitleEn, roleEn, roleTextEn } from '@/lib/en';
import { getVisibleItems } from '@/lib/items';
import { byTimeDesc } from '@/lib/fresh';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';

export default async function Authors() {
  const lang = await getLang();
  const items = getVisibleItems();
  const meta = getMeta();
  const map = new Map<string, { count: number; best: number; last: string; items: typeof items }>();
  for (const it of items) {
    const key = it.author || it.source;
    const cur = map.get(key) || { count: 0, best: 0, last: '', items: [] as typeof items };
    cur.count += 1;
    cur.best = Math.max(cur.best, it.score);
    if (it.publishedAt > cur.last) cur.last = it.publishedAt;
    cur.items.push(it);
    map.set(key, cur);
  }
  const rows = [...map.entries()].sort((a, b) => b[1].best - a[1].best);

  return (
    <MaxWidthWrapper>
      <AnimationContainer>
        <div className="flex flex-col items-start pt-8">
          <MagicBadge title={t(lang, 'authors.badge')} />
          <h1 className="mt-6 font-heading text-3xl font-medium md:text-5xl">{t(lang, 'page.authors.title')}</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            {t(lang, 'page.authors.sub')}
          </p>
        </div>
      </AnimationContainer>

      <AnimationContainer delay={0.1}>
        <div className="mt-8 rounded-2xl border border-border bg-card/50 p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">{t(lang, 'authors.xlist')}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(meta.xCache).map(([k, v]) => (
              <Badge key={k} variant="acc" className="font-mono text-[11px]">
                {k} · {v.at.slice(5, 16).replace('T', ' ')}
              </Badge>
            ))}
            {!Object.keys(meta.xCache).length && <span className="text-xs text-neutral-600">{t(lang, 'authors.never')}</span>}
          </div>
        </div>
      </AnimationContainer>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {rows.map(([name, v]) => (
          <div key={name} className="rounded-2xl border border-border bg-card/50 p-5 transition-colors hover:border-neutral-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-heading text-base">{name}</span>
              <Badge variant={v.best >= 70 ? 'acc' : 'ghost'}>{t(lang, 'authors.best', { n: v.best })}</Badge>
              <Badge variant="ghost">{t(lang, 'authors.count', { n: v.count })}</Badge>
            </div>
            <div className="mt-1 text-[11px] text-neutral-600">{lang === 'en' ? 'latest' : '最近'} {v.last.slice(0, 16).replace('T', ' ')}</div>
            <div className="mt-4 space-y-3">
              {v.items.sort(byTimeDesc).slice(0, 3).map((it) => (
                <div key={it.id}>
                  <a href={it.url} target="_blank" rel="noreferrer" className="text-[13px] leading-snug text-neutral-300 transition-colors hover:text-violet-300">
                    {lang === 'en' ? stateTitleEn(it.title).slice(0, 120) : it.title.slice(0, 120)}
                  </a>
                  <div className="mt-1 text-[11px] text-neutral-600">[{it.score}] {lang === 'en' ? enNote(it.actionNote) : it.actionNote}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!rows.length && (
          <div className="rounded-xl border border-dashed border-border bg-card/30 p-8 text-center text-sm text-neutral-500 md:col-span-2">
            还没有数据，先同步一次。
          </div>
        )}
      </div>
    </MaxWidthWrapper>
  );
}
