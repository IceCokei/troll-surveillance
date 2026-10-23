'use client';
import { useEffect, useState } from 'react';
import { Cable, Loader2, RefreshCw, ShieldAlert, ShieldCheck, Smartphone, Tablet } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';

interface Verdict { tool: string; supported: boolean; why: string }
interface Target { tool: string; max: string; gap: string; supported: boolean; note: string }
interface Device {
  udid: string;
  identifier: string;
  name: string;
  marketing: string;
  soc: string;
  chipClass: string;
  version: string;
  build: string;
  arch?: string;
  region?: string;
  modelNumber?: string;
  hardwareModel?: string;
  kind: string;
  signed: string[];
  latest?: string;
  verdicts: Verdict[];
  trollstore: { supported: boolean; max: string; why: string };
  targets: Target[];
}

function mask(list: Device[] | null, redact?: boolean): Device[] | null {
  if (!list || !redact) return list;
  return list.map((d) => ({ ...d, udid: '…', name: d.kind === 'iPad' ? 'iPad' : 'iPhone', modelNumber: '—', region: '—' }));
}

export default function LiveDevices({ compact = false, initial = null, redact = false }: { compact?: boolean; initial?: Device[] | null; redact?: boolean }) {
  const [devices, setDevices] = useState<Device[] | null>(initial);
  const masked = mask(devices, redact);
  const [checkedAt, setCheckedAt] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function poll() {
    setBusy(true);
    try {
      const res = await fetch('/api/devices', { cache: 'no-store' });
      const j = await res.json();
      setDevices(j.devices || []);
      setCheckedAt(j.checkedAt || '');
      setErr(null);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    poll();
    const t = setInterval(poll, 5000);
    return () => clearInterval(t);
  }, []);

  const connected = (masked?.length || 0) > 0;

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">实机连接</span>
        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px]', connected ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-neutral-700 bg-neutral-900 text-neutral-500')}>
          <span className={cn('relative flex size-1.5', connected && 'animate-pulse')}>
            <span className={cn('size-1.5 rounded-full', connected ? 'bg-emerald-400' : 'bg-neutral-600')} />
          </span>
          {masked === null ? '检测中…' : connected ? '已连接 ' + masked!.length + ' 台' : '未连接'}
        </span>
        <span className="ml-auto flex items-center gap-2 font-mono text-[10.5px] text-neutral-600">
          {checkedAt && '刷新于 ' + new Date(checkedAt).toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}
          <button onClick={poll} className="rounded p-1 hover:bg-neutral-800 hover:text-neutral-300" title="立即刷新">
            {busy ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
          </button>
        </span>
      </div>

      {masked === null && (
        <div className="mt-4 flex items-center gap-2 text-[12px] text-neutral-500">
          <Loader2 className="size-3.5 animate-spin" /> 正在通过 usbmuxd 枚举…
        </div>
      )}

      {masked?.length === 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-neutral-800 p-4 text-[12px] text-neutral-500">
          <Cable className="size-4 text-neutral-600" />
          没检测到设备。插线 → 解锁 → 点「信任」后会自动出现（每 5 秒轮询，无需刷新页面）。
        </div>
      )}

      <div className={cn('mt-4 grid gap-3', !compact && 'md:grid-cols-2')}>
        {masked?.map((d) => {
          const Icon = d.kind === 'iPad' ? Tablet : Smartphone;
          const jb = d.verdicts.filter((v) => v.supported && !v.tool.includes('SideStore'));
          const signedNow = d.signed.join(', ') || '无';
          const canRestore = d.signed.some((s) => s.startsWith(d.version));
          return (
            <div key={d.udid} className="rounded-xl border border-border bg-neutral-950/40 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Icon className="size-4 text-neutral-500" />
                <span className="font-heading text-[14px] text-foreground">{d.marketing}</span>
                <Badge variant="ghost">{d.identifier}</Badge>
                {jb.length ? <Badge variant="ok">可越狱</Badge> : <Badge variant="bad">无可用工具</Badge>}
                {d.trollstore.supported ? <Badge variant="acc">TrollStore 可用</Badge> : <Badge variant="ghost">TrollStore 不支持</Badge>}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-neutral-500">
                <span>iOS {d.version} ({d.build})</span>
                <span>{d.soc}</span>
                <span>{d.modelNumber || '—'} / {d.region || '—'}</span>
                <span>{d.arch || '—'}</span>

              </div>

              {!compact && (
                <div className="mt-3 space-y-1.5 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-700">离可用还差多少</div>
                  {d.targets.map((t) => (
                    <div key={t.tool} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[11.5px]">
                      <span className="w-44 shrink-0 text-neutral-400">{t.tool}</span>
                      {t.supported ? (
                        <span className="text-emerald-300/90">现在就能用（需要 ≤ {t.max}）</span>
                      ) : (
                        <span className="text-neutral-500">
                          需要 ≤ <span className="text-neutral-300">{t.max}</span>
                          {t.gap !== '—' && <span className="ml-1 text-amber-300/80">比上限高 {t.gap}</span>}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!canRestore && (
                <div className="mt-2 rounded-md border border-amber-500/25 bg-amber-500/[0.07] px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-200/80">
                  {d.version} 已停签名：任何 DFU / 还原 / 维修刷机都会强制升级到最新版本，回不到 {d.version}。别还原、别送修刷机。
                </div>
              )}

              {!compact && (
                <div className="mt-3 space-y-1">
                  {d.verdicts.map((v) => (
                    <div key={v.tool} className="flex items-start gap-2 text-[11.5px]">
                      {v.supported ? <ShieldCheck className="mt-0.5 size-3 shrink-0 text-emerald-400" /> : <ShieldAlert className="mt-0.5 size-3 shrink-0 text-neutral-700" />}
                      <span className={v.supported ? 'text-emerald-300/80' : 'text-neutral-600'}>
                        <span className="text-neutral-400">{v.tool}</span> · {v.why}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {err && <div className="mt-3 text-[11px] text-rose-300/80">接口错误：{err}</div>}
    </div>
  );
}
