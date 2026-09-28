import { NextResponse } from 'next/server';
import { getRemoteSnapshot } from '@/lib/remote-assets';

export const dynamic = 'force-dynamic';

export async function GET() {
  const snapshot = await getRemoteSnapshot();
  return NextResponse.json(snapshot, {
    headers: { 'Cache-Control': 'private, max-age=30' },
  });
}
