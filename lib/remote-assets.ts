export const ASSET_REPOSITORY = 'Blindtools/vi-sweets-remote-assets';
export const ASSET_REF = 'master';

export type RemoteNotification = {
  id: string;
  title: string;
  body: string;
  action?: string;
  action_url?: string;
  created_at: string;
};

export type SoundEntry = {
  version: number;
  url: string;
  sha256?: string;
};

export type RemoteSnapshot = {
  shop: Record<string, unknown>;
  settings: Record<string, unknown>;
  notifications: RemoteNotification[];
  sounds: Record<string, Record<string, SoundEntry>>;
  fetchedAt: string;
};

const cdn = (path: string) =>
  `https://cdn.jsdelivr.net/gh/${ASSET_REPOSITORY}@${ASSET_REF}/${path}`;

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(cdn(path), { cache: 'no-store' });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getRemoteSnapshot(): Promise<RemoteSnapshot> {
  const [shop, settings, notificationFeed, soundManifest] = await Promise.all([
    readJson<Record<string, unknown>>('config/shop.json', {}),
    readJson<Record<string, unknown>>('config/app_settings.json', {}),
    readJson<{ notifications?: RemoteNotification[] }>('config/notifications.json', {}),
    readJson<{ games?: Record<string, Record<string, SoundEntry>> }>('manifests/sounds.json', {}),
  ]);

  return {
    shop,
    settings,
    notifications: notificationFeed.notifications ?? [],
    sounds: soundManifest.games ?? {},
    fetchedAt: new Date().toISOString(),
  };
}

export const assetUrl = (path: string) => cdn(path);
