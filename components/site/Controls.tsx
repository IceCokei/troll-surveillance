'use client';
import { useRouter } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Lang } from '@/lib/i18n';

function setCookie(name: string, value: string) {
  document.cookie = name + '=' + value + '; path=/; max-age=' + 60 * 60 * 24 * 365;
}

export default function Controls({ lang, theme }: { lang: Lang; theme: 'dark' | 'light' }) {
  const router = useRouter();
  const switchLang = (next: Lang) => {
    if (next === lang) return;
    setCookie('lang', next);
    router.refresh();
  };
  const switchTheme = () => {
    setCookie('theme', theme === 'dark' ? 'light' : 'dark');
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card/40 p-1">
      <button
        onClick={() => switchLang('en')}
        className={cn('rounded px-1.5 py-0.5 font-mono text-[10.5px] transition-colors', lang === 'en' ? 'bg-neutral-800 text-foreground' : 'text-neutral-500 hover:text-foreground')}
        title="English"
      >
        EN
      </button>
      <button
        onClick={() => switchLang('zh')}
        className={cn('rounded px-1.5 py-0.5 text-[10.5px] transition-colors', lang === 'zh' ? 'bg-neutral-800 text-foreground' : 'text-neutral-500 hover:text-foreground')}
        title="简体中文"
      >
        中
      </button>
      <span className="mx-0.5 h-3 w-px bg-border" />
      <button
        onClick={switchTheme}
        className="rounded px-1.5 py-1 text-neutral-500 transition-colors hover:text-foreground"
        title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      >
        {theme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
      </button>
    </div>
  );
}