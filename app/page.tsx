'use client';

import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import type { RemoteSnapshot } from '@/lib/remote-assets';
import { ModuleWorkspace } from '@/app/components/module-workspace';
import { LoginGate } from '@/app/components/login-gate';

type Module = {
  id: string;
  label: string;
  group: string;
  icon: string;
  description: string;
  status: 'ready' | 'connect';
};

const modules: Module[] = [
  { id: 'overview', label: 'Overview', group: 'Workspace', icon: '⌂', description: 'A live operational view of VI Sweets.', status: 'ready' },
  { id: 'sounds', label: 'Sound library', group: 'Remote content', icon: '♫', description: 'Upload and version game sounds through GitHub.', status: 'connect' },
  { id: 'shop', label: 'Shop catalog', group: 'Remote content', icon: '◇', description: 'Manage prices, labels, descriptions, and availability.', status: 'connect' },
  { id: 'notifications', label: 'Notifications', group: 'Engagement', icon: '✦', description: 'Create in-app announcements and push payloads.', status: 'connect' },
  { id: 'content', label: 'Content editor', group: 'Engagement', icon: '✎', description: 'Edit onboarding, help, policy, and public links.', status: 'connect' },
  { id: 'users', label: 'Users', group: 'People', icon: '♙', description: 'Search users and review account status.', status: 'connect' },
  { id: 'moderation', label: 'Moderation', group: 'People', icon: '⌁', description: 'Approvals, verified devices, blocks, and reports.', status: 'connect' },
  { id: 'games', label: 'Live games', group: 'Operations', icon: '▣', description: 'Review rooms, match state, and game notifications.', status: 'connect' },
  { id: 'analytics', label: 'Analytics', group: 'Operations', icon: '↗', description: 'Usage, content, and delivery health.', status: 'connect' },
  { id: 'settings', label: 'Admin settings', group: 'Security', icon: '⚙', description: 'Roles, access, integrations, and audit history.', status: 'connect' },
];

function ModuleIcon({ icon }: { icon: string }) {
  return <span className="module-icon" aria-hidden="true">{icon}</span>;
}

export default function AdminHome() {
  return <LoginGate>{(user) => <AdminWorkspace user={user} />}</LoginGate>;
}

function AdminWorkspace({ user }: { user: User }) {
  const [active, setActive] = useState('overview');
  const [search, setSearch] = useState('');
  const [snapshot, setSnapshot] = useState<RemoteSnapshot | null>(null);
  const selected = modules.find((module) => module.id === active) ?? modules[0];
  useEffect(() => {
    fetch('/api/remote-assets')
      .then((response) => response.ok ? response.json() as Promise<RemoteSnapshot> : null)
      .then((data) => { if (data) setSnapshot(data); })
      .catch(() => undefined);
  }, []);
  const groups = useMemo(() => {
    const filtered = modules.filter((module) => module.label.toLowerCase().includes(search.toLowerCase()));
    return filtered.reduce<Record<string, Module[]>>((result, module) => {
      (result[module.group] ??= []).push(module);
      return result;
    }, {});
  }, [search]);

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">VS</div>
          <div><strong>VI Sweets</strong><span>Control room</span></div>
        </div>
        <div className="workspace-pill"><span className="online-dot" /> Production workspace</div>
        <label className="search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a module" /></label>
        <nav className="nav" aria-label="Admin modules">
          {Object.entries(groups).map(([group, items]) => (
            <div className="nav-group" key={group}>
              <div className="nav-label">{group}</div>
              {items.map((module) => <button className={active === module.id ? 'nav-item active' : 'nav-item'} key={module.id} onClick={() => setActive(module.id)}><ModuleIcon icon={module.icon} /><span>{module.label}</span>{module.id === 'notifications' && <b className="badge">3</b>}</button>)}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer"><div className="avatar">BM</div><div><strong>Admin workspace</strong><span>Owner access</span></div><button className="icon-button" aria-label="Account menu">•••</button></div>
      </aside>

      <section className="content">
        <header className="topbar"><div><span className="eyebrow">VI SWEETS / {selected.group.toUpperCase()}</span><h1>{selected.label}</h1></div><div className="top-actions"><button className="quiet-button">⌁ Activity</button><button className="primary-button">＋ New update</button></div></header>
        {active === 'overview' ? <Overview onSelect={setActive} snapshot={snapshot} /> : <ModuleWorkspace id={selected.id} snapshot={snapshot} user={user} />}
      </section>
    </main>
  );
}

function Overview({ onSelect, snapshot }: { onSelect: (id: string) => void; snapshot: RemoteSnapshot | null }) {
  return <div className="page-stack">
    <section className="hero-card"><div><span className="eyebrow light">GOOD EVENING, ADMIN</span><h2>Keep every game feeling fresh.</h2><p>Manage remote sounds, shop content, player communication, and live operations from one calm workspace.</p><button className="light-button" onClick={() => onSelect('sounds')}>Open sound library <span>→</span></button></div><div className="hero-orbit"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core">✦</div></div></section>
    <div className="stat-grid"><Stat label="Registered players" value="—" note="Firebase integration pending" /><Stat label="Remote sounds" value={String(Object.values(snapshot?.sounds ?? {}).reduce((total, game) => total + Object.keys(game).length, 0))} note={snapshot ? 'GitHub manifest connected' : 'Loading GitHub manifest'} /><Stat label="Unread alerts" value={String(snapshot?.notifications.length ?? 0)} note={snapshot ? 'Remote feed connected' : 'Loading notification feed'} accent="orange" /><Stat label="System status" value={snapshot ? 'Connected' : 'Ready'} note={snapshot ? `Synced ${new Date(snapshot.fetchedAt).toLocaleTimeString()}` : 'Remote integrations loading'} accent="green" /></div>
    <div className="split-grid"><section className="panel"><div className="panel-heading"><div><span className="eyebrow">QUICK ACTIONS</span><h3>Make a change</h3></div><span className="panel-kicker">4 common tasks</span></div><div className="action-grid"><Action icon="♫" title="Upload a sound" text="Publish a versioned game sound" onClick={() => onSelect('sounds')} /><Action icon="◇" title="Edit shop" text="Change price or button label" onClick={() => onSelect('shop')} /><Action icon="✦" title="Send update" text="Create an in-app announcement" onClick={() => onSelect('notifications')} /><Action icon="✎" title="Edit content" text="Update onboarding or help" onClick={() => onSelect('content')} /></div></section><section className="panel"><div className="panel-heading"><div><span className="eyebrow">RECENT ACTIVITY</span><h3>Nothing connected yet</h3></div><span className="panel-kicker">Live</span></div><div className="empty-state"><div className="empty-icon">◌</div><p>Once integrations are connected, changes and admin actions will appear here.</p></div></section></div>
    <section className="panel checklist"><div><span className="eyebrow">SETUP PROGRESS</span><h3>Finish your control room</h3></div><div className="progress-track"><span /></div><div className="check-row"><span className="check pending">1</span><div><strong>Connect remote assets</strong><p>GitHub sound repository and manifest</p></div><button onClick={() => onSelect('sounds')}>Open →</button></div><div className="check-row"><span className="check pending">2</span><div><strong>Connect app data</strong><p>Firebase and Supabase remain server-side only</p></div><button onClick={() => onSelect('settings')}>Review →</button></div></section>
  </div>;
}

function Stat({ label, value, note, accent = '' }: { label: string; value: string; note: string; accent?: string }) { return <div className={`stat-card ${accent}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function Action({ icon, title, text, onClick }: { icon: string; title: string; text: string; onClick: () => void }) { return <button className="action-card" onClick={onClick}><span className="action-icon">{icon}</span><span><strong>{title}</strong><small>{text}</small></span><b>→</b></button>; }
