import type { Item } from './types';

/** 同一条目来源（同一个仓库）只保留最新一条，避免 Dopamine 3.0.8~3.0.12 占满列表 */
export function toolKey(i: Item): string | null {
  const m = (i.source || '').match(/^(?:gh|ghatom):([^:]+)(?::commits)?$/);
  if (!m) return null;
  return m[1];
}

export function dedupeByTool(items: Item[]): { items: Item[]; merged: number } {
  const seen = new Map<string, Item>();
  const out: Item[] = [];
  let merged = 0;

  for (const it of items) {
    const key = toolKey(it);
    if (!key) {
      out.push(it);
      continue;
    }
    if (seen.has(key)) {
      const prev = seen.get(key)!;
      // 保留更新时间更晚的那条（列表一般已按时间倒序，这里再保一次）
      if (it.publishedAt > prev.publishedAt) {
        seen.set(key, it);
        const idx = out.indexOf(prev);
        if (idx >= 0) out[idx] = it;
      }
      merged += 1;
      continue;
    }
    seen.set(key, it);
    out.push(it);
  }
  return { items: out, merged };
}
