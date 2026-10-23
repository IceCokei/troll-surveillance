import { NextResponse } from 'next/server';
import { listDevices } from '@/lib/devices';

export const dynamic = 'force-dynamic';

export async function GET() {
  const started = Date.now();
  const devices = await listDevices();
  return NextResponse.json(
    { checkedAt: new Date().toISOString(), tookMs: Date.now() - started, devices },
    { headers: { 'cache-control': 'no-store' } }
  );
}
