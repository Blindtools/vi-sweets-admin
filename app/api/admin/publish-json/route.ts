import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';

const repository = 'Blindtools/vi-sweets-remote-assets';
const allowedPaths = new Set([
  'config/shop.json',
  'config/app_settings.json',
  'config/notifications.json',
  'manifests/sounds.json',
]);

async function github(path: string, init?: RequestInit) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not configured');
  return fetch(`https://api.github.com/repos/${repository}/contents/${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.headers ?? {}),
    },
  });
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json() as { path?: string; content?: unknown; message?: string };
    if (!body.path || !allowedPaths.has(body.path)) {
      return NextResponse.json({ error: 'Path is not publishable' }, { status: 400 });
    }
    if (body.content === undefined) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    const current = await github(body.path);
    const currentData = current.ok ? await current.json() as { sha?: string } : {};
    const content = Buffer.from(`${JSON.stringify(body.content, null, 2)}\n`, 'utf8').toString('base64');
    const response = await github(body.path, {
      method: 'PUT',
      body: JSON.stringify({
        message: body.message ?? `Admin update: ${body.path}`,
        content,
        sha: currentData.sha,
        branch: 'master',
      }),
    });
    if (!response.ok) return NextResponse.json({ error: await response.text() }, { status: response.status });
    return NextResponse.json({ ok: true, path: body.path, updatedBy: admin.email ?? admin.uid });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Publish failed' }, { status: 401 });
  }
}
