import { NextResponse } from 'next/server';
import { getDigest, listDigests, today } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get('date') || listDigests()[0] || today();
  const md = getDigest(date);
  if (!md) return NextResponse.json({ error: 'no digest for ' + date, dates: listDigests() }, { status: 404 });
  return new NextResponse(md, { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
}
