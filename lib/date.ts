const TZ = 'Asia/Shanghai';

export function localDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toLocaleDateString('sv-SE', { timeZone: TZ });
  return d.toLocaleDateString('sv-SE', { timeZone: TZ });
}

/** ISO(UTC) → 北京时间显示，如 2026-10-24 03:49 */
export function toCN(iso?: string, withDate = true): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const s = d.toLocaleString('sv-SE', { timeZone: TZ });
  return withDate ? s.slice(0, 16) : s.slice(11, 16);
}

export function nowLocalStamp(): string {
  const d = new Date();
  return d.toLocaleString('sv-SE', { timeZone: TZ });
}
