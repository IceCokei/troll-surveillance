import MaxWidthWrapper from '@/components/global/max-width-wrapper';
import AnimationContainer from '@/components/global/animation-container';
import MagicBadge from '@/components/ui/magic-badge';
import { Badge } from '@/components/ui/badge';
import ProfileForm from '@/components/ProfileForm';
import { TOOLS } from '@/lib/knowledge';
import { getMeta, getProfile } from '@/lib/store';
import { toolSupports } from '@/lib/analyze';

export const dynamic = 'force-dynamic';

export default function Tools() {
  const profile = getProfile();
  const meta = getMeta();

  const verdict = (t: (typeof TOOLS)[number]) => {
    if (!t.public) return { ok: false, why: '私有链，无公开工具' };
    if (toolSupports(t, profile)) return { ok: true, why: '可用' };
    const ceil = (t.maxVersionBySoc && t.maxVersionBySoc[profile.soc.split(' ')[0]]) || t.maxVersion;
    if (ceil && profile.version.localeCompare(ceil, undefined, { numeric: true }) > 0)
      return { ok: false, why: '你的 iOS ' + profile.version + ' 超出上限 ' + ceil };
    if (t.minVersion) return { ok: false, why: '需要至少 ' + t.minVersion };
    return { ok: false, why: '不支持 ' + profile.soc };
  };

  return (
    <MaxWidthWrapper>
      <AnimationContainer>
        <div className="flex flex-col items-start pt-8">
          <MagicBadge title="工具矩阵" />
          <h1 className="mt-6 font-heading text-3xl font-medium md:text-5xl">能不能用，一张表说清</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            本机 {profile.name} · {profile.identifier} · {profile.soc} · iOS {profile.version}（{profile.build}）
            {meta.signing ? ' · 当前签名 ' + (meta.signing.signed.map((s) => s.version).join(', ') || '无') : ''}
          </p>
        </div>
      </AnimationContainer>

      <div className="mt-6">
        <ProfileForm initial={profile} />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-neutral-600">
              <th className="px-5 py-3 text-left font-medium">工具</th>
              <th className="px-5 py-3 text-left font-medium">类型</th>
              <th className="px-5 py-3 text-left font-medium">版本范围</th>
              <th className="px-5 py-3 text-left font-medium">SoC</th>
              <th className="px-5 py-3 text-left font-medium">对本机</th>
              <th className="px-5 py-3 text-left font-medium">说明</th>
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
                        官网/仓库
                      </a>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-[11.5px] text-neutral-500">
                    {t.kind}
                    {!t.public && ' · 未发布'}
                  </td>
                  <td className="px-5 py-4 font-mono text-[11.5px] text-neutral-400">
                    {t.minVersion ? t.minVersion + ' – ' : '≤ '}
                    {t.maxVersion || '—'}
                  </td>
                  <td className="px-5 py-4 font-mono text-[11.5px] text-neutral-500">{t.socs.join('/') || '—'}</td>
                  <td className="px-5 py-4">
                    {v.ok ? <Badge variant="ok">可用</Badge> : <Badge variant="bad">不可用</Badge>}
                    <div className="mt-1 text-[11px] text-neutral-600">{v.why}</div>
                  </td>
                  <td className="max-w-[320px] px-5 py-4 text-[11.5px] leading-relaxed text-neutral-500">{t.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimationContainer delay={0.1}>
        <div className="mt-6 rounded-2xl border border-border bg-card/40 p-6 text-[12.5px] leading-[1.9] text-neutral-400">
          <div className="mb-2 font-heading text-sm text-foreground">为什么是这张表</div>
          越狱从来不是「对 iPhone 有效」，而是「对某颗 SoC × 某段 iOS build 有效」。判定必须三段都在：
          <br />
          1. 工具<strong className="text-neutral-200">已公开</strong>（私有链对终端用户等于不存在）；
          <br />
          2. 你的版本落在工具声明的区间内（超出即无效，且 Apple 停签名后无法降级）；
          <br />
          3. SoC 匹配（A11 及更早靠 checkm8 bootROM 漏洞；A12+ 依赖软件漏洞 + PAC/SPTM/MIE 绕过，跨代不通用）。
          <br />
          另外注意 rootless / rootful 生态不互通：给 Dopamine 写的 tweak 不能直接放到 palera1n rootful 上。
        </div>
      </AnimationContainer>
    </MaxWidthWrapper>
  );
}
