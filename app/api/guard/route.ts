import { NextResponse } from 'next/server';
import { getItems, getProfile, getMeta } from '@/lib/store';
import { evaluateGuard } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const profile = getProfile();
  const meta = getMeta();
  const guard = evaluateGuard(profile, meta.signing, getItems());
  return NextResponse.json({ profile: { identifier: profile.identifier, version: profile.version }, guard });
}
