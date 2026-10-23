import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import type { Item } from '@/lib/types';

const CAT: Record<string, { label: string; variant: 'ok' | 'warn' | 'bad' | 'acc' | 'ghost' }> = {
  exploit: { label: '漏洞', variant: 'bad' },
  'tool-release': { label: '工具', variant: 'ok' },
  'os-release': { label: '系统', variant: 'acc' },
  signing: { label: '签名', variant: 'warn' },
  wiki: { label: '资料', variant: 'acc' },
  news: { label: '新闻', variant: 'ghost' },
  scam: { label: '骗局', variant: 'bad' },
};

function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return m + ' 分钟前';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' 小时前';
  return Math.floor(h / 24) + ' 天前';
}

export default function ItemCard({ it, compact = false }: { it: Item; compact?: boolean }) {
  const cat = CAT[it.category] || CAT.news;
  return (
    <div
      className={cn(
        'group relative flex gap-5 rounded-xl border border-border bg-card/60 p-5 transition-colors hover:border-neutral-700 hover:bg-card',
        it.actionable && 'border-emerald-500/25'
      )}
    >
      <div className="flex w-12 shrink-0 flex-col items-center">
        <span
          className={cn(
            'font-heading text-2xl font-medium leading-none tabular-nums',
            it.score >= 80 ? 'text-foreground' : it.score >= 50 ? 'text-neutral-400' : 'text-neutral-600'
          )}
        >
          {it.score}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-neutral-600">score</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={cat.variant}>{cat.label}</Badge>
          {it.actionable && <Badge variant="ok">可执行</Badge>}
          {it.deviceRelevance === 'direct' && <Badge variant="acc">版本命中</Badge>}
          {it.deviceRelevance === 'future' && <Badge variant="warn">需更高版本</Badge>}
          {it.deviceRelevance === 'obsolete' && <Badge variant="ghost">已过时</Badge>}
          <span className="text-xs text-neutral-500">{it.source}</span>
          <span className="text-xs text-neutral-600">{ago(it.publishedAt)}</span>
        </div>

        <h4 className="mt-2.5 text-[15px] font-medium leading-snug">
          <a href={it.url} target="_blank" rel="noreferrer" className="transition-colors hover:text-violet-300">
            {it.title}
          </a>
        </h4>

        <p className={cn('mt-2 border-l-2 pl-3 text-[12.5px] leading-relaxed', it.actionable ? 'border-emerald-500/40 text-emerald-200/80' : 'border-neutral-800 text-neutral-400')}>
          {it.actionNote}
        </p>

        {!compact && it.text && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-500">{it.text}</p>
        )}

        {it.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {it.tags.slice(0, 8).map((t) => (
              <span key={t} className="rounded-md border border-neutral-800 bg-neutral-900/60 px-1.5 py-0.5 text-[10.5px] text-neutral-500">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
