import Link from 'next/link';
import AnimationContainer from '@/components/global/animation-container';
import { t, type Lang } from '@/lib/i18n';

export default function Footer({ lang }: { lang: Lang }) {
  const LINKS = [
    {
      title: t(lang, 'footer.sources'),
      items: [
        [t(lang, 'footer.x'), '/sources'],
        [t(lang, 'footer.gh'), '/feed?src=gh%3Aopa334%2FDopamine'],
        [t(lang, 'footer.reddit'), '/feed?src=rss%3Ar%2Fjailbreak'],
      ] as [string, string][],
    },
    {
      title: t(lang, 'footer.system'),
      items: [
        [t(lang, 'footer.tools'), '/tools'],
        [t(lang, 'footer.digest'), '/digest'],
        [t(lang, 'footer.health'), '/#health'],
      ] as [string, string][],
    },
  ];

  return (
    <footer className="relative mx-auto mt-24 flex w-full max-w-6xl flex-col items-center justify-center border-t border-border px-6 pt-16 pb-10 lg:pt-24 bg-[radial-gradient(35%_128px_at_50%_0%,theme(colors.white/8%),transparent)]">
      <div className="absolute left-1/2 right-1/2 top-0 h-1.5 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" />

      <AnimationContainer className="grid w-full gap-8 xl:grid-cols-3">
        <div className="flex flex-col items-start gap-4">
          <span className="font-heading text-lg font-semibold">Troll Surveillance</span>
          <p className="max-w-xs text-sm text-muted-foreground">{t(lang, 'footer.tagline')}</p>
          <span className="text-xs text-neutral-600">{t(lang, 'footer.selfhost')}</span>
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

      <div className="mt-12 flex w-full flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-neutral-600 md:flex-row">
        <span>{t(lang, 'footer.bottom1')}</span>
        <span>{t(lang, 'footer.bottom2')}</span>
      </div>
    </footer>
  );
}
