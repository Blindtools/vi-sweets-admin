import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';

const repository = 'Blindtools/vi-sweets-remote-assets';
const allowedGames = new Set(['blind_temple_run', 'blind_cricket', 'blind_carrom', 'fighting_game', 'audio_free_fire', 'audio_drive_quest', 'site_shoot']);
const allowedExtensions = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac']);

async function github(path: string, init?: RequestInit) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not configured');
  return fetch(`https://api.github.com/repos/${repository}/contents/${path}`, { ...init, headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28', ...(init?.headers ?? {}) } });
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const form = await request.formData();
    const file = form.get('file');
    const gameId = String(form.get('gameId') ?? '');
    const soundId = String(form.get('soundId') ?? 'new_sound').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    if (!(file instanceof File) || !allowedGames.has(gameId)) return NextResponse.json({ error: 'Valid file and game are required' }, { status: 400 });
    if (file.size === 0 || file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'Audio must be between 1 byte and 20 MiB' }, { status: 400 });
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!allowedExtensions.has(extension)) return NextResponse.json({ error: 'Unsupported audio format' }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const assetPath = `sounds/${gameId}/${soundId}-${sha256.slice(0, 12)}.${extension}`;
    const current = await github(assetPath);
    const currentData = current.ok ? await current.json() as { sha?: string } : {};
    const uploaded = await github(assetPath, { method: 'PUT', body: JSON.stringify({ message: `Admin upload: ${assetPath}`, content: bytes.toString('base64'), sha: currentData.sha, branch: 'master' }) });
    if (!uploaded.ok) return NextResponse.json({ error: await uploaded.text() }, { status: uploaded.status });
    const manifestResponse = await github('manifests/sounds.json');
    if (!manifestResponse.ok) throw new Error('Sound uploaded but manifest could not be read');
    const manifestFile = await manifestResponse.json() as { sha: string; content: string };
    const manifest = JSON.parse(Buffer.from(manifestFile.content, 'base64').toString('utf8')) as { schema_version?: number; manifest_version?: number; updated_at?: string; games?: Record<string, Record<string, { version: number; url: string; sha256: string }>> };
    const game = (manifest.games ??= {})[gameId] ??= {};
    const previous = game[soundId];
    game[soundId] = { version: (previous?.version ?? 0) + 1, url: `https://cdn.jsdelivr.net/gh/${repository}@master/${assetPath}`, sha256 };
    manifest.manifest_version = (manifest.manifest_version ?? 0) + 1;
    manifest.updated_at = new Date().toISOString();
    const manifestUpdate = await github('manifests/sounds.json', { method: 'PUT', body: JSON.stringify({ message: `Admin update: sound manifest ${gameId}/${soundId}`, content: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`).toString('base64'), sha: manifestFile.sha, branch: 'master' }) });
    if (!manifestUpdate.ok) return NextResponse.json({ error: `Audio uploaded but manifest update failed: ${await manifestUpdate.text()}` }, { status: 502 });
    return NextResponse.json({ ok: true, path: assetPath, gameId, soundId, sha256, updatedBy: admin.email ?? admin.uid });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload failed' }, { status: 400 }); }
}
