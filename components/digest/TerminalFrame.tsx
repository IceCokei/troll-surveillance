import { cn } from '@/lib/cn';

export default function TerminalFrame({
  title,
  meta,
  children,
  className,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'terminal-frame relative overflow-hidden rounded-xl border border-neutral-800 bg-[#08080a] shadow-[0_24px_80px_-32px_rgba(0,0,0,0.9)]',
        className
      )}
    >
      {/* macOS 标题栏 */}
      <div className="flex h-10 items-center gap-3 border-b border-neutral-800/80 bg-[#101013] px-4">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.35)]" />
          <span className="size-3 rounded-full bg-[#febc2e] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.35)]" />
          <span className="size-3 rounded-full bg-[#28c840] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.35)]" />
        </div>
        <div className="pointer-events-none flex-1 truncate text-center font-mono text-[11.5px] text-neutral-500">{title}</div>
        <div className="font-mono text-[10.5px] text-neutral-700">{meta || 'zsh'}</div>
      </div>

      {/* 终端内容 */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(120,80,255,0.06),transparent_60%)]" />
        <div className="relative px-5 py-4 md:px-7 md:py-5">{children}</div>
      </div>
    </div>
  );
}
