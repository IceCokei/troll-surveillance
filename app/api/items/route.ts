import { NextResponse } from 'next/server';
import { getItems } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cat = url.searchParams.get('cat');
  const actionOnly = url.searchParams.get('actionable') === '1';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 1000);
  let items = getItems();
  if (cat) items = items.filter((i) => i.category === cat);
  if (actionOnly) items = items.filter((i) => i.actionable);
  return NextResponse.json({ total: items.length, items: items.slice(0, limit) });
}
