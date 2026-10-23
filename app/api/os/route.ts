import { NextResponse } from 'next/server';
import { APPLE_RELEASES_URL, getOsVersions, latestPush, latestRows } from '@/lib/osversions';

export const dynamic = 'force-dynamic';

/** 供外部巡检 / 本地脚本拉取：/api/os?force=1 强制回源 */
export async function GET(req: Request) {
  const force = new URL(req.url).searchParams.get('force') === '1';
  const snap = await getOsVersions({ force });
  const push = latestPush(snap.releases);
  return NextResponse.json({
    ok: snap.ok,
    source: APPLE_RELEASES_URL,
    fetchedAt: snap.fetchedAt,
    detectedAt: snap.detectedAt || null,
    error: snap.error || null,
    count: snap.releases.length,
    push: push ? { at: push.at, count: push.items.length, items: push.items.map((i) => i.platform + ' ' + i.version + ' (' + i.build + ')') } : null,
    /** inPush=false 即「这次没动，仍是旧版本」 */
    rows: latestRows(snap.releases, push),
    history: snap.pushes || [],
  });
}
