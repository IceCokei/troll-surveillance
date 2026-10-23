'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export default function SyncButton({
  force = false,
  variant = 'primary',
  label = '立即同步',
  size = 'sm',
}: {
  force?: boolean;
  variant?: 'primary' | 'ghost' | 'outline' | 'purple';
  label?: string;
  size?: 'sm' | 'default' | 'lg';
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/sync' + (force ? '?force=1' : ''), { method: 'POST' });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'sync failed');
      setMsg('抓取 ' + j.fetched + ' · 新增 ' + j.added + ' · 可执行 ' + j.actionable);
      router.refresh();
    } catch (e: any) {
      setMsg('失败：' + String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant={variant} size={size} onClick={run} disabled={busy}>
        <RefreshCw className={cn('mr-1.5 size-3.5', busy && 'animate-spin')} />
        {busy ? '抓取中…' : label}
      </Button>
      {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
    </div>
  );
}
