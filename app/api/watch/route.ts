import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const file = path.join(process.cwd(), 'data', 'watch.json');
  if (!fs.existsSync(file)) {
    return NextResponse.json({ running: false, intervalMs: null, message: 'watcher 未启动' }, { status: 200 });
  }
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return NextResponse.json(data, { headers: { 'cache-control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
