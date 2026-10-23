'use client';
import { useState } from 'react';
import { Terminal, LayoutList } from 'lucide-react';
import { cn } from '@/lib/cn';
import DigestView from './DigestView';
import TerminalFrame from './TerminalFrame';

type View = 'terminal' | 'reading';

export default function DigestSwitch({
  markdown,
  date,
  device,
  initial = 'terminal',
}: {
  markdown: string;
  date: string;
  device: string;
  initial?: View;
}) {
  const [view, setView] = useState<View>(initial);

  const btn = (active: boolean) =>
    cn(
      'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] transition-colors',
      active ? 'bg-neutral-800 text-foreground' : 'text-neutral-500 hover:text-foreground'
    );

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card/40 p-1">
          <button onClick={() => setView('terminal')} className={btn(view === 'terminal')}>
            <Terminal className="size-3.5" /> 终端
          </button>
          <button onClick={() => setView('reading')} className={btn(view === 'reading')}>
            <LayoutList className="size-3.5" /> 阅读
          </button>
        </div>
        <span className="font-mono text-[10.5px] text-neutral-700">
          {view === 'terminal' ? '~ zsh · digest view' : 'reader mode'}
        </span>
      </div>

      {view === 'terminal' ? (
        <TerminalFrame title={'~/ios-radar/data/digests/' + date + '.md'} meta={'zsh · ' + device}>
          <div className="font-mono text-[11.5px] leading-relaxed">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-neutral-600">
              <span className="text-emerald-400">➜</span>
              <span className="text-violet-300">~/ios-radar</span>
              <span>radar digest --date {date} --device {device}</span>
              <span className="ml-auto text-neutral-700">[{markdown.split('\n').length} lines]</span>
            </div>
            <DigestView markdown={markdown} variant="terminal" />
            <div className="mt-4 flex items-center gap-1.5 text-neutral-600">
              <span className="text-emerald-400">➜</span>
              <span className="text-violet-300">~/ios-radar</span>
              <span className="inline-block h-3.5 w-[7px] animate-[caret-blink_1.25s_ease-out_infinite] bg-neutral-400" />
            </div>
          </div>
        </TerminalFrame>
      ) : (
        <DigestView markdown={markdown} variant="reading" />
      )}
    </>
  );
}
