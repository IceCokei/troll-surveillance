/** 时间口径：只展示最近 5 年，且默认按时间倒序（新年份优先） */
export const MAX_YEARS = 5;

export function yearsAgoMs(n = MAX_YEARS): number {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d.getTime();
}

export function withinYears(iso: string | undefined, years = MAX_YEARS): boolean {
  if (!iso) return true;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return true;
  return t >= yearsAgoMs(years);
}

export function byTimeDesc(a: { publishedAt: string }, b: { publishedAt: string }): number {
  return a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0;
}

export function byStateThenTime(
  a: { publishedAt: string; tags?: string[] },
  b: { publishedAt: string; tags?: string[] }
): number {
  const sa = a.tags?.includes('state') ? 1 : 0;
  const sb = b.tags?.includes('state') ? 1 : 0;
  if (sa !== sb) return sa - sb;
  return byTimeDesc(a, b);
}

export function thisYear(): number {
  return new Date().getFullYear();
}

export function isThisYear(iso: string | undefined, year = thisYear()): boolean {
  if (!iso) return false;
  return new Date(iso).getFullYear() === year;
}
