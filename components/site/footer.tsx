import Link from 'next/link';
import AnimationContainer from '@/components/global/animation-container';

const LINKS = [
  { title: '情报源', items: [['X 作者动态', '/authors'], ['GitHub 发版', '/feed?src=gh%3Aopa334%2FDopamine'], ['r/jailbreak', '/feed?src=rss%3Ar%2Fjailbreak']] },
  { title: '系统', items: [['工具矩阵', '/tools'], ['每日简报', '/digest'], ['采集健康度', '/#health']] },
];

export default function Footer() {
  return (
    <footer className="relative mx-auto mt-24 flex w-full max-w-6xl flex-col items-center justify-center border-t border-border px-6 pt-16 pb-10 lg:pt-24 bg-[radial-gradient(35%_128px_at_50%_0%,theme(colors.white/8%),transparent)]">
      <div className="absolute left-1/2 right-1/2 top-0 h-1.5 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" />

      <AnimationContainer className="grid w-full gap-8 xl:grid-cols-3">
        <div className="flex flex-col items-start gap-4">
          <span className="font-heading text-lg font-semibold">iOS 越狱雷达</span>
          <p className="max-w-xs text-sm text-muted-foreground">
            监控越狱生态的作者动态、工具发版与漏洞情报，并把「哪条对你这台设备真的可用」算清楚。
          </p>
          <span className="text-xs text-neutral-600">
            自托管 · iPhone / iPad 自适应判定 · 数据全部来自公开源
          </span>
        </div>
        {LINKS.map((group) => (
          <div key={group.title} className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-[0.16em] text-neutral-500">{group.title}</span>
            {group.items.map(([label, href]) => (
              <Link key={label} href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {label}
              </Link>
            ))}
          </div>
        ))}
      </AnimationContainer>

      <div className="mt-14 w-full select-none overflow-hidden">
        <div className="text-center font-heading text-[18vw] font-bold leading-none tracking-tighter text-transparent bg-gradient-to-b from-neutral-800 to-neutral-950 bg-clip-text">
          RADAR
        </div>
      </div>

      <div className="mt-6 flex w-full flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-neutral-600 md:flex-row">
        <span>ios-jailbreak-radar · 自托管 · 数据源全部免费公开</span>
        <span>规则引擎不做主观判断，只做版本与 SoC 匹配</span>
      </div>
    </footer>
  );
}
