import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { ArrowUpRight, Video, Link2 } from 'lucide-react';
import MaxWidthWrapper from '@/components/global/max-width-wrapper';
import AnimationContainer from '@/components/global/animation-container';
import MagicBadge from '@/components/ui/magic-badge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';

interface Post {
  handle: string;
  id?: string;
  url: string;
  date?: string;
  text: string;
  video: boolean;
  images: number;
}
interface Author {
  handle: string;
  name: string;
  role: string;
  tags: string[];
  posts: Post[];
  fetchedAt: string;
}

function readDossier(): { authors: Author[]; fetchedAt: string | null } {
  const file = path.join(process.cwd(), 'data', 'dossier.json');
  if (!fs.existsSync(file)) return { authors: [], fetchedAt: null };
  try {
    const authors: Author[] = JSON.parse(fs.readFileSync(file, 'utf8'));
    const fetchedAt = authors.reduce((m, a) => (a.fetchedAt > m ? a.fetchedAt : m), '');
    return { authors, fetchedAt };
  } catch {
    return { authors: [], fetchedAt: null };
  }
}

const PRIMARY = [
  {
    title: 'Hexacon 2026：iPhone 18 Pro / iOS 27.0.1 untethered 演示（现场报道）',
    source: 'heise online',
    url: 'https://www.heise.de/en/news/Calif-io-jailbreak-How-the-untethered-tool-cracks-iOS-27-0-1-11492321.html',
    quote: 'first reboot-proof jailbreak for current iPhones in years',
  },
  {
    title: '演示细节：SSH uid=0、iPhone19,2、24A446、重启后仍持',
    source: 'iClarified',
    url: 'https://www.iclarified.com/102876/untethered-ios-2701-jailbreak-demonstrated-on-iphone-18-pro-video',
    quote: 'uid=0 / iPhone19,2 / iOS 27.0.1 build 24A446',
  },
  {
    title: 'Chollima：链的构成（untether + 沙盒逃逸 + 内核漏洞 + MIE 绕过 + WASM tweak runner）',
    source: 'The Apple Wiki',
    url: 'https://theapplewiki.com/wiki/Chollima',
    quote: 'private exploit chain and tweak runner, shown off by calif.io',
  },
  {
    title: 'Calif 官方 X 主页（Hexacon 演示视频 + “popped the iPhone Duo on release day”）',
    source: 'X @calif_io',
    url: 'https://x.com/calif_io',
    quote: 'we popped the iPhone Duo on release day',
  },
  {
    title: '工具发版与支持矩阵（Dopamine 3.0.12，上限 26.0.1 / A12-A13）',
    source: 'GitHub opa334/Dopamine',
    url: 'https://github.com/opa334/Dopamine/releases',
    quote: 'Dopamine 3.0.12 · 2026-10-20',
  },
  {
    title: '签名状态（按机型标识实时查询，决定能否还原）',
    source: 'ipsw.me',
    url: 'https://ipsw.me/',
    quote: 'signed builds per identifier',
  },
  {
    title: 'iOS 27.2 RC (24B115) / 26.7.2 RC 已放出 —— 与 ipsw.me 的签名列表存在时间差，动手前务必以 Apple 官方为准',
    source: 'X @FCE365',
    url: 'https://x.com/FCE365/status/2112266026553348121',
    quote: 'iOS 27.2 RC (24B115)',
  },
  {
    title: 'tihmstar 转述：Cellebrite 公布 bootROM 级 0day “LOKI”',
    source: 'X @tihmstar',
    url: 'https://x.com/tihmstar/status/2112099806567174567',
    quote: 'zero-day LOKI, a boot ROM exploit',
  },
];

export default async function Sources({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const tag = sp.tag || '';
  const { authors, fetchedAt } = readDossier();

  const allTags = [...new Set(authors.flatMap((a) => a.tags))];
  const list = (tag ? authors.filter((a) => a.tags.includes(tag)) : authors).map((a) => ({
    ...a,
    posts: [...a.posts].sort((x, y) => ((y.date || '') < (x.date || '') ? -1 : 1)),
  }));
  const totalPosts = authors.reduce((n, a) => n + a.posts.length, 0);
  const withLinks = authors.reduce((n, a) => n + a.posts.filter((p) => p.url.includes('/status/')).length, 0);

  const pill = (active: boolean) =>
    cn(
      'rounded-full border px-3 py-1.5 text-xs transition-colors',
      active ? 'border-neutral-700 bg-neutral-800 text-foreground' : 'border-border text-neutral-500 hover:border-neutral-700 hover:text-foreground'
    );

  return (
    <MaxWidthWrapper>
      <AnimationContainer>
        <div className="flex flex-col items-start pt-8">
          <MagicBadge title="作者 / 引用总表" />
          <h1 className="mt-6 font-heading text-3xl font-medium md:text-5xl">谁在说，原话是什么</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {authors.length} 个账号 · {totalPosts} 条贴文 · 其中 {withLinks} 条带可直接打开的 status 直链
            {fetchedAt ? ' · 抓取于 ' + fetchedAt.replace('T', ' ').slice(0, 16) + ' UTC' : ''}
          </p>
        </div>
      </AnimationContainer>

      {/* 一手引用 */}
      <AnimationContainer delay={0.05}>
        <div className="mt-8 rounded-2xl border border-border bg-card/50 p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">可直接引用的一手来源</div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {PRIMARY.map((p) => (
              <a
                key={p.url}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl border border-border bg-neutral-950/40 p-4 transition-colors hover:border-neutral-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-neutral-200">{p.title}</span>
                  <ArrowUpRight className="size-3.5 shrink-0 text-neutral-600 group-hover:text-violet-300" />
                </div>
                <div className="mt-1.5 font-mono text-[11px] text-neutral-500">
                  {p.source} · {p.quote}
                </div>
              </a>
            ))}
          </div>
        </div>
      </AnimationContainer>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link href="/sources" className={pill(!tag)}>全部 {authors.length}</Link>
        {allTags.map((t) => (
          <Link key={t} href={'/sources?tag=' + t} className={pill(tag === t)}>
            {t}
          </Link>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {list.map((a) => (
          <div key={a.handle} className="rounded-2xl border border-border bg-card/40 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-heading text-lg">{a.name}</span>
              <a href={'https://x.com/' + a.handle} target="_blank" rel="noreferrer" className="font-mono text-xs text-neutral-500 hover:text-violet-300">
                @{a.handle}
              </a>
              {a.tags.map((t) => (
                <Badge key={t} variant={t === 'research' ? 'acc' : t === 'media' ? 'ghost' : t === 'exploit' ? 'bad' : 'ok'}>
                  {t}
                </Badge>
              ))}
            </div>
            <div className="mt-1 text-xs text-neutral-500">{a.role}</div>

            {a.posts.length ? (
              <ul className="mt-4 space-y-3">
                {a.posts.map((p, i) => (
                  <li key={(p.id || '') + i} className="border-l border-border pl-4">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-600">
                      <span className="font-mono">{p.date || '日期未取到'}</span>
                      {p.video && (
                        <span className="inline-flex items-center gap-1 text-rose-300/80">
                          <Video className="size-3" /> 含视频
                        </span>
                      )}
                      {p.url.includes('/status/') ? (
                        <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-violet-300/80 hover:text-violet-200">
                          <Link2 className="size-3" /> status 直链
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-300/70">仅主页级引用</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-300">{p.text}</p>
                    <div className="mt-1 font-mono text-[10.5px] text-neutral-700 select-all">{p.url}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-neutral-600">本次未抓到贴文（限流或账号不可见）· 主页 https://x.com/{a.handle}</p>
            )}
          </div>
        ))}
        {!list.length && (
          <div className="rounded-xl border border-dashed border-border bg-card/30 p-8 text-center text-sm text-neutral-500">
            还没有 dossier。运行 <span className="font-mono">npx tsx scripts/dossier.ts</span> 生成 data/dossier.json。
          </div>
        )}
      </div>
    </MaxWidthWrapper>
  );
}
