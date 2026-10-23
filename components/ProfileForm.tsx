'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import type { Profile } from '@/lib/types';
import { t as tr, type Lang } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

export default function ProfileForm({ initial, lang = 'zh' }: { initial: Profile; lang?: Lang }) {
  const [p, setP] = useState<Profile>(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function save() {
    setBusy(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(p),
      });
      const j = await res.json();
      setMsg(j.ok ? '已保存并重算 ' + j.reanalyzed + ' 条' : '失败：' + j.error);
      router.refresh();
    } catch (e: any) {
      setMsg('失败：' + String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  const field = (k: keyof Profile, label: string, placeholder: string) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">{label}</label>
      <input
        value={p[k]}
        placeholder={placeholder}
        onChange={(e) => setP({ ...p, [k]: e.target.value })}
        className="h-9 rounded-md border border-border bg-neutral-950/60 px-3 font-mono text-[12.5px] text-foreground outline-none transition-colors placeholder:text-neutral-700 focus:border-neutral-700"
      />
    </div>
  );

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">{tr(lang, 'profile.title')}</div>
        {msg && <span className="text-[11px] text-neutral-500">{msg}</span>}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {field('name', tr(lang, 'profile.name'), 'iPhone 15 Pro')}
        {field('identifier', tr(lang, 'profile.id'), 'iPhone16,1')}
        {field('version', tr(lang, 'profile.version'), '17.3.1')}
        {field('build', tr(lang, 'profile.build'), '21E236')}
        {field('soc', tr(lang, 'profile.soc'), 'A17 Pro (t8130)')}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button variant="purple" size="sm" onClick={save} disabled={busy}>
          <Save className="mr-1.5 size-3.5" />
          {busy ? '…' : tr(lang, 'profile.save')}
        </Button>
      </div>
    </div>
  );
}
