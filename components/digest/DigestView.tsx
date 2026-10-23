import { parseMarkdown, parseInline, type Block, type Inline } from '@/lib/markdown';
import { cn } from '@/lib/cn';

type Variant = 'terminal' | 'reading';

function InlineText({ parts, tone = 'normal' }: { parts: Inline[]; tone?: 'normal' | 'mono' }) {
  return (
    <>
      {parts.map((p, i) => {
        if (p.t === 'bold') return <strong key={i} className="font-medium text-foreground">{p.v}</strong>;
        if (p.t === 'code')
          return (
            <code key={i} className="rounded bg-neutral-900 px-1 py-0.5 font-mono text-[11px] text-violet-200">
              {p.v}
            </code>
          );
        if (p.t === 'link')
          return (
            <a
              key={i}
              href={p.href}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'text-violet-300 underline decoration-violet-500/25 underline-offset-2 hover:text-violet-200',
                tone === 'mono' && 'font-mono text-[11px]'
              )}
            >
              {p.v}
            </a>
          );
        return <span key={i}>{p.v}</span>;
      })}
    </>
  );
}

function splitScore(text: string): { score?: number; rest: string } {
  const m = text.match(/^\[(\d{1,3})\]\s*(.*)$/);
  if (m) return { score: Number(m[1]), rest: m[2] };
  return { rest: text };
}

function scoreTone(score: number) {
  if (score >= 80) return 'bg-rose-500/15 text-rose-300 border-rose-500/25';
  if (score >= 50) return 'bg-amber-500/15 text-amber-300 border-amber-500/25';
  return 'bg-neutral-800/70 text-neutral-400 border-neutral-700/60';
}

function ReadingSection({ num, title, count, children }: { num?: string; title: string; count?: string; children: React.ReactNode }) {
  return (
    <section id={num ? 'section-' + num : undefined} className="relative scroll-mt-20 overflow-hidden rounded-2xl border border-border bg-card/40">
      <div className="flex items-center gap-3 border-b border-border/70 px-5 py-3.5">
        {num && <span className="grid size-6 shrink-0 place-items-center rounded-md bg-neutral-900 font-mono text-[11px] text-neutral-500">{num}</span>}
        <h2 className="font-heading text-[15px] font-medium text-foreground">{title}</h2>
        {count && <span className="ml-auto rounded-full border border-border px-2 py-0.5 font-mono text-[10.5px] text-neutral-500">{count}</span>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function TerminalSection({ num, title, count, children }: { num?: string; title: string; count?: string; children: React.ReactNode }) {
  return (
    <section id={num ? 'section-' + num : undefined} className="mb-5 scroll-mt-20 last:mb-0">
      <div className="mb-2.5 flex items-center gap-2 border-b border-neutral-800/70 pb-1.5">
        <span className="text-[10px] text-neutral-700">{num?.padStart(2, '0') ?? '--'}</span>
        <span className="text-neutral-300">{title}</span>
        {count && <span className="ml-auto text-[10px] text-neutral-700">{count}</span>}
      </div>
      {children}
    </section>
  );
}

export default function DigestView({ markdown, variant = 'reading', lang = 'zh' }: { markdown: string; variant?: Variant; lang?: 'zh' | 'en' }) {
  const blocks = parseMarkdown(markdown);
  const sections: { title: string; num?: string; count?: string; blocks: Block[] }[] = [];
  let cur: (typeof sections)[number] | null = null;

  for (const b of blocks) {
    if (b.type === 'h2') {
      const m = b.text.match(/^(\d+)\.\s*(.*)$/);
      const cm = (m?.[2] || b.text).match(/^(.*?)（(\d+)(?:\s*条)?）$/);
      cur = { title: cm ? cm[1] : m?.[2] || b.text, num: m?.[1], count: cm ? cm[2] + ' 条' : undefined, blocks: [] };
      sections.push(cur);
      continue;
    }
    if (b.type === 'h1' || b.type === 'hr') continue;
    if (cur) cur.blocks.push(b);
  }

  if (!sections.length) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-800 p-8 text-center text-sm text-neutral-500">
        该日期没有可显示的简报内容。
      </div>
    );
  }

  const Section = variant === 'terminal' ? TerminalSection : ReadingSection;

  return (
    <div className={variant === 'terminal' ? '' : 'space-y-3'}>
      {sections.map((s, idx) => {
        // 0. 一句话结论
        if (s.num === '0') {
          const text = s.blocks.filter((b) => b.type === 'p').map((b: any) => b.text).join(' ');
          if (variant === 'terminal') {
            return (
              <div key={idx} className="mb-5 rounded-lg border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3">
                <div className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-violet-300/60">verdict</div>
                <p className="text-[12.5px] leading-relaxed text-neutral-200">
                  <InlineText parts={parseInline(text)} />
                </p>
              </div>
            );
          }
          return (
            <div key={idx} className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(139,92,246,0.14),transparent_60%)] p-6">
              <div className="text-[11px] uppercase tracking-[0.16em] text-violet-300/70">{lang === 'en' ? 'verdict' : '今日结论'}</div>
              <p className="mt-2.5 font-heading text-[17px] leading-relaxed text-foreground md:text-lg">
                <InlineText parts={parseInline(text)} />
              </p>
            </div>
          );
        }

        return (
          <Section key={idx} num={s.num} title={s.title} count={s.count}>
            {s.blocks.map((b, j) => {
              if (b.type === 'list') {
                if (!b.items.length) return null;
                return (
                  <ul key={j} className={variant === 'terminal' ? 'space-y-2' : 'space-y-2.5'}>
                    {b.items.map((it, k) => {
                      const { score, rest } = splitScore(it.text);
                      const empty = /^无[。.]?$/.test(it.text.trim());

                      if (variant === 'terminal') {
                        return (
                          <li key={k} className="text-[12px] leading-relaxed">
                            <div className="flex items-start gap-2.5">
                              <span className="select-none text-neutral-700">·</span>
                              {score !== undefined && (
                                <span className={cn('mt-[1px] shrink-0 rounded border px-1 font-mono text-[10px] tabular-nums', scoreTone(score))}>
                                  {score}
                                </span>
                              )}
                              <span className={cn('min-w-0 flex-1', empty ? 'text-neutral-600' : 'text-neutral-300')}>
                                <InlineText parts={parseInline(rest)} />
                              </span>
                            </div>
                            {it.children.length > 0 && (
                              <div className="mt-1 space-y-0.5 pl-6">
                                {it.children.map((c, ci) => (
                                  <div key={ci} className="text-[11px] leading-relaxed text-neutral-600">
                                    <span className="mr-1.5 select-none text-neutral-800">└</span>
                                    <InlineText parts={parseInline(c)} tone="mono" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </li>
                        );
                      }

                      return (
                        <li key={k} className={cn('rounded-xl border border-border/60 bg-neutral-950/30 px-4 py-3', empty && 'border-dashed bg-transparent')}>
                          <div className="flex items-start gap-3">
                            {score !== undefined && (
                              <span className={cn('mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums', scoreTone(score))}>{score}</span>
                            )}
                            <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-neutral-300">
                              <InlineText parts={parseInline(rest)} />
                            </div>
                          </div>
                          {it.children.length > 0 && (
                            <div className="mt-2 space-y-1 border-l border-border pl-3">
                              {it.children.map((c, ci) => (
                                <div key={ci} className="text-[12px] leading-relaxed text-neutral-500">
                                  <InlineText parts={parseInline(c)} />
                                </div>
                              ))}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                );
              }

              if (b.type === 'table') {
                return (
                  <div key={j} className={cn('overflow-hidden rounded-lg border', variant === 'terminal' ? 'border-neutral-800' : 'border-border/70')}>
                    <table className={cn('w-full', variant === 'terminal' ? 'text-[11px]' : 'text-[12.5px]')}>
                      <thead>
                        <tr className={cn('text-[10px] uppercase tracking-[0.12em] text-neutral-600', variant === 'terminal' ? 'bg-neutral-900/40' : 'bg-neutral-900/60')}>
                          {b.head.map((h, hi) => (
                            <th key={hi} className="px-3 py-2 text-left font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {b.rows.map((r, ri) => (
                          <tr key={ri} className={cn('border-t border-neutral-800/70', variant !== 'terminal' && 'hover:bg-neutral-900/40')}>
                            {r.map((c, ci) => (
                              <td key={ci} className={cn('px-3 py-2', variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-400', ci === 0 && 'text-neutral-200')}>
                                <InlineText parts={parseInline(c.replace(/<\/?strong>|<\/?b>/g, '**'))} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }

              if (b.type === 'quote') {
                return <p key={j} className="text-[11.5px] text-neutral-600"><InlineText parts={parseInline(b.text)} /></p>;
              }

              if (b.type === 'p') {
                return (
                  <p key={j} className={cn(variant === 'terminal' ? 'text-[11.5px] leading-relaxed text-neutral-500' : 'text-[13px] leading-relaxed text-neutral-400')}>
                    <InlineText parts={parseInline(b.text)} />
                  </p>
                );
              }

              return null;
            })}
            {!s.blocks.length && <p className="text-[11.5px] text-neutral-700">（空）</p>}
          </Section>
        );
      })}
    </div>
  );
}
