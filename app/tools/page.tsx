import MaxWidthWrapper from '@/components/global/max-width-wrapper';
import AnimationContainer from '@/components/global/animation-container';
import MagicBadge from '@/components/ui/magic-badge';
import { Badge } from '@/components/ui/badge';
import ProfileForm from '@/components/ProfileForm';
import { TOOLS } from '@/lib/knowledge';
import { getMeta, getProfile } from '@/lib/store';
import { toolSupports } from '@/lib/analyze';
import { cookies } from 'next/headers';
import { t as tr } from '@/lib/i18n';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';

export default async function Tools() {
  const lang = await getLang();
  const profile = getProfile();
  const meta = getMeta();

  const verdict = (t: (typeof TOOLS)[number]) => {
    if (!t.public) return { ok: false, why: tr(lang, 'tools.private') };
    if (toolSupports(t, profile)) return { ok: true, why: tr(lang, 'tools.yes') };
    const ceil = (t.maxVersionBySoc && t.maxVersionBySoc[profile.soc.split(' ')[0]]) || t.maxVersion;
    if (ceil && profile.version.localeCompare(ceil, undefined, { numeric: true }) > 0)
      return { ok: false, why: tr(lang, 'tools.over', { v: profile.version, c: ceil }) };
    if (t.minVersion) return { ok: false, why: tr(lang, 'tools.need', { v: t.minVersion }) };
    return { ok: false, why: tr(lang, 'tools.unsupported', { soc: profile.soc }) };
  };

  return (
    <MaxWidthWrapper>
      <AnimationContainer>
        <div className="flex flex-col items-start pt-8">
          <MagicBadge title={tr(lang, 'nav.tools')} />
          <h1 className="mt-6 font-heading text-3xl font-medium md:text-5xl">{tr(lang, 'page.tools.title')}</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {tr(lang, 'tools.target', { name: profile.name, id: profile.identifier, soc: profile.soc, v: profile.version, b: profile.build })}
            {meta.signing ? tr(lang, 'tools.signed', { v: meta.signing.signed.map((s) => s.version).join(', ') || '—' }) : ''}
          </p>
        </div>
      </AnimationContainer>

      <div className="mt-6">
        <ProfileForm initial={profile} lang={lang} />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-neutral-600">
              <th className="px-5 py-3 text-left font-medium">{tr(lang, 'tools.thTool')}</th>
              <th className="px-5 py-3 text-left font-medium">{tr(lang, 'tools.thKind')}</th>
              <th className="px-5 py-3 text-left font-medium">{tr(lang, 'tools.thRange')}</th>
              <th className="px-5 py-3 text-left font-medium">{tr(lang, 'tools.thSoc')}</th>
              <th className="px-5 py-3 text-left font-medium">{tr(lang, 'tools.thMine')}</th>
              <th className="px-5 py-3 text-left font-medium">{tr(lang, 'tools.thNote')}</th>
            </tr>
          </thead>
          <tbody>
            {TOOLS.map((t) => {
              const v = verdict(t);
              return (
                <tr key={t.name} className="border-b border-border/60 align-top last:border-0 hover:bg-neutral-900/40">
                  <td className="px-5 py-4">
                    <div className="font-heading text-[13.5px] text-foreground">{t.name}</div>
                    {t.url && (
                      <a href={t.url} target="_blank" rel="noreferrer" className="text-[11px] text-neutral-600 hover:text-violet-300">
                        {tr(lang, 'tools.site')}
                      </a>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-[11.5px] text-neutral-500">
                    {t.kind}
                    {!t.public && (lang === 'en' ? ' · unreleased' : ' · 未发布')}
                  </td>
                  <td className="px-5 py-4 font-mono text-[11.5px] text-neutral-400">
                    {t.minVersion ? t.minVersion + ' – ' : '≤ '}
                    {t.maxVersion || '—'}
                  </td>
                  <td className="px-5 py-4 font-mono text-[11.5px] text-neutral-500">{t.socs.join('/') || '—'}</td>
                  <td className="px-5 py-4">
                    {v.ok ? <Badge variant="ok">{tr(lang, 'tools.yes')}</Badge> : <Badge variant="bad">{tr(lang, 'tools.no')}</Badge>}
                    <div className="mt-1 text-[11px] text-neutral-600">{v.why}</div>
                  </td>
                  <td className="max-w-[320px] px-5 py-4 text-[11.5px] leading-relaxed text-neutral-500">{lang === 'en' && t.noteEn ? t.noteEn : t.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimationContainer delay={0.1}>
        <div className="mt-6 rounded-2xl border border-border bg-card/40 p-6 text-[12.5px] leading-[1.9] text-neutral-400">
          <div className="mb-2 font-heading text-sm text-foreground">{tr(lang, 'tools.whyTitle')}</div>
          {tr(lang, 'tools.whyBody')}
        </div>
      </AnimationContainer>
    </MaxWidthWrapper>
  );
}
