import { NextResponse } from 'next/server';
import { runSync } from '@/lib/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

async function handle(req: Request) {
  const url = new URL(req.url);
  const force = url.searchParams.get('force') === '1';
  try {
    const result = await runSync({ force });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(req: Request) { return handle(req); }
export async function GET(req: Request) { return handle(req); }
