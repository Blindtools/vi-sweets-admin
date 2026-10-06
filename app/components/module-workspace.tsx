'use client';

import { useState } from 'react';
import type { User } from 'firebase/auth';
import type { RemoteSnapshot } from '@/lib/remote-assets';

type Props = { id: string; snapshot: RemoteSnapshot | null; user: User };

export function ModuleWorkspace({ id, snapshot, user }: Props) {
  if (id === 'sounds') return <SoundsModule snapshot={snapshot} user={user} />;
  if (id === 'shop') return <ShopModule snapshot={snapshot} user={user} />;
  if (id === 'notifications') return <NotificationsModule snapshot={snapshot} user={user} />;
  if (id === 'content') return <ContentModule snapshot={snapshot} />;
  return <GenericModule id={id} snapshot={snapshot} />;
}

async function publish(user: User, path: string, content: unknown, message: string) {
  const token = await user.getIdToken();
  const response = await fetch('/api/admin/publish-json', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ path, content, message }) });
  const data = await response.json() as { error?: string };
  if (!response.ok) throw new Error(data.error ?? 'Publish failed');
}

function SoundsModule({ snapshot, user }: { snapshot: RemoteSnapshot | null; user: User }) {
  const games = Object.entries(snapshot?.sounds ?? {});
  const [selectedGame, setSelectedGame] = useState(games[0]?.[0] ?? 'blind_temple_run');
  const slots = snapshot?.sounds[selectedGame] ?? {};
  const [message, setMessage] = useState('');
  const [soundId, setSoundId] = useState('new_sound');
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    const form = new FormData(); form.append('file', file); form.append('gameId', selectedGame); form.append('soundId', soundId);
    setMessage('Uploading…');
    try { const token = await user.getIdToken(); const response = await fetch('/api/admin/upload-sound', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }); const data = await response.json() as { error?: string }; if (!response.ok) throw new Error(data.error ?? 'Upload failed'); setMessage('Uploaded. Refresh the page to read the new manifest.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Upload failed'); }
  }
  return <div className="module-workspace"><div className="module-header"><div><span className="eyebrow">REMOTE CONTENT</span><h2>Sound library</h2><p>Review and publish versioned game sounds without an app release.</p></div></div><div className="toolbar"><select value={selectedGame} onChange={(event) => setSelectedGame(event.target.value)}>{games.length ? games.map(([game]) => <option key={game}>{game}</option>) : <option>No games in manifest</option>}</select><input value={soundId} onChange={(event) => setSoundId(event.target.value)} placeholder="Sound slot ID" aria-label="Sound slot ID" /><label className="primary-button">＋ Upload sound<input type="file" accept="audio/*" hidden onChange={upload} /></label><span className="sync-chip">{games.length} games · {Object.keys(slots).length} slots</span></div><div className="sound-grid">{Object.entries(slots).map(([slot, sound]) => <div className="sound-card" key={slot}><div className="sound-card-top"><span className="sound-wave">♫</span><span className="version">v{sound.version}</span></div><strong>{slot.replaceAll('_', ' ')}</strong><small>{sound.url}</small><a className="text-button" href={sound.url} target="_blank" rel="noreferrer">Preview sound →</a></div>)}{!Object.keys(slots).length && <Empty text="No published sounds in this manifest yet. Upload a versioned sound to begin." />}</div>{message && <Notice text={message} />}<Notice text="The server checks the Firebase admin role before writing to the private GitHub token path." /></div>;
}

function ShopModule({ snapshot, user }: { snapshot: RemoteSnapshot | null; user: User }) {
  const initial = JSON.stringify(snapshot?.shop?.items ?? {}, null, 2);
  const [value, setValue] = useState(initial);
  const [message, setMessage] = useState('');
  async function save() { try { const parsed = JSON.parse(value); await publish(user, 'config/shop.json', { schema_version: 1, catalog_version: Date.now(), updated_at: new Date().toISOString(), items: parsed }, 'Admin update: shop catalog'); setMessage('Published successfully.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Invalid JSON or publish failed'); } }
  return <div className="module-workspace"><ModuleHeader eyebrow="REMOTE CONTENT" title="Shop catalog" description="Edit the public catalog without changing the Flutter source." action="Add item" /><div className="editor-layout"><div className="editor-card"><div className="editor-heading"><strong>Catalog JSON</strong><span>Stable item IDs only</span></div><textarea value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} /></div><div className="side-card"><span className="eyebrow">PUBLISH CHECKLIST</span><h3>Safe catalog update</h3><p>Keep purchase IDs stable. Prices are remote display values; authoritative currency rules remain protected by app/backend permissions.</p><button className="primary-button" onClick={save}>Validate & publish</button>{message && <small className="success-message">{message}</small>}</div></div></div>;
}

function NotificationsModule({ snapshot, user }: { snapshot: RemoteSnapshot | null; user: User }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [message, setMessage] = useState('');
  async function save() { if (!title || !body) { setMessage('Add a title and message first.'); return; } try { const feed = snapshot?.notifications ?? []; await publish(user, 'config/notifications.json', { schema_version: 1, feed_version: Date.now(), updated_at: new Date().toISOString(), notifications: [{ id: crypto.randomUUID(), title, body, created_at: new Date().toISOString() }, ...feed] }, 'Admin update: in-app notification'); setMessage('Published to the in-app feed.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Publish failed'); } }
  return <div className="module-workspace"><ModuleHeader eyebrow="ENGAGEMENT" title="Notifications" description="Publish an in-app announcement. Firebase FCM remains the background push transport." action="View history" /><div className="editor-layout"><div className="editor-card form-card"><label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="New game update" /></label><label>Message<textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Tell players what changed..." /></label><label>Action URL <input placeholder="Optional deep link" /></label><div className="button-row"><button className="primary-button" onClick={save}>Validate & publish</button><span className="sync-chip">{snapshot?.notifications.length ?? 0} existing</span></div>{message && <small className="success-message">{message}</small>}</div><div className="side-card"><span className="eyebrow">DELIVERY MODEL</span><h3>One message, two surfaces</h3><p>Cloud content becomes the in-app feed. Existing Firebase FCM remains the background push transport.</p><Notice text="No Firebase private key is stored in this browser." /></div></div></div>;
}

function ContentModule({ snapshot }: { snapshot: RemoteSnapshot | null }) { return <div className="module-workspace"><ModuleHeader eyebrow="ENGAGEMENT" title="Content editor" description="Remote settings and public copy will live in versioned JSON." action="New content" /><div className="content-list"><ContentRow title="App settings" value={Object.keys(snapshot?.settings ?? {}).length ? 'Connected' : 'Empty'} /><ContentRow title="Notifications feed" value={`${snapshot?.notifications.length ?? 0} entries`} /><ContentRow title="Shop catalog" value={snapshot?.shop?.catalog_version ? `v${snapshot.shop.catalog_version}` : 'Not published'} /></div><Notice text="Draft editing is local until the protected GitHub publish action is configured." /></div>; }
function GenericModule({ id, snapshot }: Pick<Props, 'id' | 'snapshot'>) { return <div className="module-workspace"><ModuleHeader eyebrow="OPERATIONS" title={id.replaceAll('_', ' ')} description="This workspace is mapped to the existing VI Sweets admin capability and is ready for its protected data adapter." action="Configure" /><div className="integration-note"><span>✦</span><div><strong>Existing data remains unchanged</strong><small>Firebase user/admin data and Supabase voice/chat data will be accessed through role-checked adapters. Nothing is migrated automatically.</small></div></div><div className="metric-row"><span>Remote snapshot</span><strong>{snapshot ? 'Connected' : 'Waiting'}</strong></div></div>; }
function ModuleHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action: string }) { return <div className="module-header"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div><button className="primary-button">＋ {action}</button></div>; }
function Notice({ text }: { text: string }) { return <div className="small-notice"><span>i</span><small>{text}</small></div>; }
function Empty({ text }: { text: string }) { return <div className="empty-module">{text}</div>; }
function ContentRow({ title, value }: { title: string; value: string }) { return <div className="content-row"><strong>{title}</strong><span>{value}</span><button className="text-button">Open →</button></div>; }
