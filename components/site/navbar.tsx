'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/cn';
import MaxWidthWrapper from '@/components/global/max-width-wrapper';
import AnimationContainer from '@/components/global/animation-container';
import { buttonVariants } from '@/components/ui/button';
import SyncButton from '@/components/SyncButton';
import Controls from '@/components/site/Controls';
import { t, type Lang } from '@/lib/i18n';

export default function Navbar({ lang, theme }: { lang: Lang; theme: 'dark' | 'light' }) {
  const [scroll, setScroll] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScroll(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const NAV = [
    { href: '/', label: t(lang, 'nav.home') },
    { href: '/feed', label: t(lang, 'nav.feed') },
    { href: '/devices', label: t(lang, 'nav.devices') },
    { href: '/sources', label: t(lang, 'nav.sources') },
    { href: '/exploits', label: t(lang, 'nav.exploits') },
    { href: '/tools', label: t(lang, 'nav.tools') },
    { href: '/digest', label: t(lang, 'nav.digest') },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 inset-x-0 h-14 w-full border-b border-transparent z-[99999] select-none',
        scroll && 'border-background/80 bg-background/40 backdrop-blur-md'
      )}
    >
      <AnimationContainer reverse delay={0.05} className="size-full">
        <MaxWidthWrapper className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-10">
            <Link href="/" className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-lg font-bold font-heading !leading-none tracking-tight">Troll Surveillance</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {NAV.map((n) => {
                const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={cn(
                      'px-3 py-2 rounded-md text-sm transition-colors',
                      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Controls lang={lang} theme={theme} />
            <SyncButton variant="ghost" label={t(lang, 'common.sync')} />
            <Link href="/digest" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
              {t(lang, 'nav.digest')}
              <Zap className="size-3.5 text-orange-500 fill-orange-500" />
            </Link>
          </div>

          <div className="lg:hidden">
            <Controls lang={lang} theme={theme} />
          </div>
        </MaxWidthWrapper>
      </AnimationContainer>
    </header>
  );
}
