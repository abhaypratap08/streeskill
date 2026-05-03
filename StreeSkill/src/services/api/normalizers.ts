import { User, UserPreferences } from './types';

const DEFAULT_PREFERENCES: UserPreferences = {
  notifications: true,
  autoPlay: true,
  downloadOverWifi: true,
  language: 'English',
  captionLanguages: ['Hindi', 'English', 'Tamil'],
};

const parseCaptionLanguages = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }

  if (typeof value === 'string' && value.trim() !== '') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((entry): entry is string => typeof entry === 'string')
        : DEFAULT_PREFERENCES.captionLanguages;
    } catch {
      return DEFAULT_PREFERENCES.captionLanguages;
    }
  }

  return DEFAULT_PREFERENCES.captionLanguages;
};

export const normalizeUserPreferences = (value: unknown): UserPreferences => {
  if (typeof value !== 'object' || value === null) {
    return DEFAULT_PREFERENCES;
  }

  const raw = value as Record<string, unknown>;
  const notifications = raw['notifications'];
  const autoPlay = raw['autoPlay'];
  const autoPlaySnake = raw['auto_play'];
  const downloadOverWifi = raw['downloadOverWifi'];
  const downloadOverWifiSnake = raw['download_over_wifi'];
  const language = raw['language'];

  return {
    notifications: typeof notifications === 'boolean' ? notifications : DEFAULT_PREFERENCES.notifications,
    autoPlay:
      typeof autoPlay === 'boolean'
        ? autoPlay
        : typeof autoPlaySnake === 'boolean'
          ? autoPlaySnake
          : DEFAULT_PREFERENCES.autoPlay,
    downloadOverWifi:
      typeof downloadOverWifi === 'boolean'
        ? downloadOverWifi
        : typeof downloadOverWifiSnake === 'boolean'
          ? downloadOverWifiSnake
          : DEFAULT_PREFERENCES.downloadOverWifi,
    language: typeof language === 'string' && language.trim() !== '' ? language : DEFAULT_PREFERENCES.language,
    captionLanguages: parseCaptionLanguages(raw['captionLanguages'] ?? raw['caption_languages']),
  };
};

export const normalizeUser = (value: unknown): User | undefined => {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const id = raw['id'];
  const email = raw['email'];
  const name = raw['name'];
  if (typeof id !== 'string' || typeof email !== 'string' || typeof name !== 'string') {
    return undefined;
  }

  const rawAvatar = raw['avatar'];
  const avatar = typeof rawAvatar === 'string' && rawAvatar.trim() !== '' ? rawAvatar : undefined;
  const createdAt =
    typeof raw['createdAt'] === 'string'
      ? raw['createdAt']
      : typeof raw['created_at'] === 'string'
        ? raw['created_at']
        : new Date().toISOString();

  return {
    id,
    email,
    name,
    createdAt,
    preferences: normalizeUserPreferences(raw['preferences']),
    ...(avatar ? { avatar } : {}),
  };
};
