import { NextResponse } from 'next/server';
import { getProfile, saveProfile } from '@/lib/store';
import { analyze } from '@/lib/analyze';
import { getItems, saveItems, getMeta, saveDigest, today } from '@/lib/store';
import { buildDigest } from '@/lib/digest';
import type { RawItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getProfile());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const allowed = ['name', 'identifier', 'version', 'build', 'soc'];
    const patch: Record<string, string> = {};
    for (const k of allowed) if (typeof body?.[k] === 'string' && body[k]) patch[k] = body[k];
    const profile = saveProfile(patch);

    // 换了档案就重算全库的可用性与简报
    const items = getItems().map((it) => {
      const raw: RawItem = { source: it.source, kind: it.kind, author: it.author, title: it.title, url: it.url, text: it.text, publishedAt: it.publishedAt };
      const fresh = analyze(raw, profile);
      fresh.fetchedAt = it.fetchedAt;
      return fresh;
    });
    saveItems(items);
    saveDigest(today(), buildDigest(today(), items, profile, getMeta()));
    return NextResponse.json({ ok: true, profile, reanalyzed: items.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 400 });
  }
}
