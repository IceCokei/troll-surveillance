import { NextResponse } from 'next/server';
import { getItems, getMeta, getProfile } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const meta = getMeta();
  const items = getItems();
  return NextResponse.json({
    ok: true,
    profile: getProfile(),
    lastSyncAt: meta.lastSyncAt || null,
    totalItems: items.length,
    sources: Object.keys(meta.sourceStatus).length,
    failing: Object.entries(meta.sourceStatus).filter(([, v]) => !v.ok).map(([k]) => k),
    signing: meta.signing || null,
  });
}
