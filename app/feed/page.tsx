import Link from 'next/link';
import { Search } from 'lucide-react';
import { getVisibleItems } from '@/lib/items';
import { byStateThenTime } from '@/lib/fresh';
import { dedupeByTool } from '@/lib/dedupe';
import { cookies } from 'next/headers';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import MaxWidthWrapper from '@/components/global/max-width-wrapper';
import AnimationContainer from '@/components/global/animation-container';
import MagicBadge from '@/components/ui/magic-badge';
import ItemCard from '@/components/site/item-card';

export const dynamic = 'force-dynamic';

const CATS: [string, string][] = [
  ['exploit', '漏洞'],
  ['tool-release', '工具发版'],
  ['signing', '签名'],
  ['os-release', '系统'],
  ['wiki', '资料'],
  ['news', '新闻'],
  ['scam', '骗局'],
];

function qs(base: string, params: Record<string, string | undefined>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) u.set(k, v);
  const s = u.toString();
  return base + (s ? '?' + s : '');
}

export default async function Feed({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const lang = (await cookies()).get('lang')?.value === 'en' ? 'en' : 'zh';
  const items = getVisibleItems();
  const cat = sp.cat || '';
  const src = sp.src || '';
  const only = sp.only || '';
  const q = (sp.q || '').toLowerCase();

  let list = items;
  if (cat) list = list.filter((i) => i.category === cat);
  if (src) list = list.filter((i) => i.source === src);
  if (only === 'actionable') list = list.filter((i) => i.actionable);
  if (q) list = list.filter((i) => (i.title + ' ' + (i.text || '') + ' ' + i.tags.join(' ')).toLowerCase().includes(q));
  const sorted = [...list].sort(byStateThenTime);
  const showAll = sp.all === '1';
  const deduped = showAll ? { items: sorted, merged: 0 } : dedupeByTool(sorted);
  list = deduped.items.slice(0, 300);

  const sources = [...new Set(items.map((i) => i.source))].sort();

  const pill = (active: boolean) =>
    cn(
      'rounded-full border px-3.5 py-1.5 text-xs transition-colors',
      active ? 'border-neutral-700 bg-neutral-800 text-foreground' : 'border-border text-neutral-500 hover:border-neutral-700 hover:text-foreground'
    );

  return (
    <MaxWidthWrapper>
      <AnimationContainer>
        <div className="flex flex-col items-start pt-8">
          <MagicBadge title="全部情报" />
          <h1 className="mt-6 font-heading text-3xl font-medium md:text-5xl">{t(lang, 'page.feed.title')}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            共 {items.length} 条（近 5 年），当前筛选 {list.length} 条 · 按发布时间倒序
            {!showAll && deduped.merged > 0 && ' · 已合并同工具的 ' + deduped.merged + ' 条历史版本'}
            {' · '}
            <Link href={showAll ? '/feed' : '/feed?all=1'} className="text-violet-300/80 hover:text-violet-200">
              {showAll ? '合并同工具版本' : '展开全部版本'}
            </Link>
          </p>
        </div>
      </AnimationContainer>

      <AnimationContainer delay={0.1}>
        <form action="/feed" className="mt-8 flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 focus-within:border-neutral-700">
            <Search className="size-4 text-neutral-600" />
            <input
              name="q"
              defaultValue={sp.q || ''}
              placeholder="搜索：untether / MIE / 27.0.1 / Dopamine / Chollima"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-neutral-600"
            />
            <button type="submit" className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              搜索
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={qs('/feed', { cat, src, only })} className={pill(!cat && only !== 'actionable')}>
              全部
            </Link>
            {CATS.map(([key, label]) => (
              <Link key={key} href={qs('/feed', { cat: key, src, only, q: sp.q })} className={pill(cat === key)}>
                {label}
              </Link>
            ))}
            <span className="mx-1 h-4 w-px bg-border" />
            <Link
              href={qs('/feed', { cat, src, only: only === 'actionable' ? '' : 'actionable', q: sp.q })}
              className={cn(pill(only === 'actionable'), 'border-emerald-500/25 text-emerald-300 hover:text-emerald-200')}
            >
              只看可执行
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {sources.map((s) => (
              <Link key={s} href={qs('/feed', { cat, src: src === s ? '' : s, only, q: sp.q })} className={cn(pill(src === s), 'px-2.5 py-1 text-[11px]')}>
                {s}
              </Link>
            ))}
          </div>
        </form>
      </AnimationContainer>

      <div className="mt-8 space-y-3">
        {list.map((it) => (
          <ItemCard key={it.id} it={it} />
        ))}
        {!list.length && (
          <div className="rounded-xl border border-dashed border-border bg-card/30 p-8 text-center text-sm text-neutral-500">
            没有符合条件的情报。
          </div>
        )}
      </div>
    </MaxWidthWrapper>
  );
}
