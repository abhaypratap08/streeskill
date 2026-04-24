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

  return {
    notifications: typeof raw.notifications === 'boolean' ? raw.notifications : DEFAULT_PREFERENCES.notifications,
    autoPlay:
      typeof raw.autoPlay === 'boolean'
        ? raw.autoPlay
        : typeof raw.auto_play === 'boolean'
          ? raw.auto_play
          : DEFAULT_PREFERENCES.autoPlay,
    downloadOverWifi:
      typeof raw.downloadOverWifi === 'boolean'
        ? raw.downloadOverWifi
        : typeof raw.download_over_wifi === 'boolean'
          ? raw.download_over_wifi
          : DEFAULT_PREFERENCES.downloadOverWifi,
    language: typeof raw.language === 'string' && raw.language.trim() !== '' ? raw.language : DEFAULT_PREFERENCES.language,
    captionLanguages: parseCaptionLanguages(raw.captionLanguages ?? raw.caption_languages),
  };
};

export const normalizeUser = (value: unknown): User | undefined => {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== 'string' || typeof raw.email !== 'string' || typeof raw.name !== 'string') {
    return undefined;
  }

  const avatar = typeof raw.avatar === 'string' && raw.avatar.trim() !== '' ? raw.avatar : undefined;
  const createdAt =
    typeof raw.createdAt === 'string'
      ? raw.createdAt
      : typeof raw.created_at === 'string'
        ? raw.created_at
        : new Date().toISOString();

  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    createdAt,
    preferences: normalizeUserPreferences(raw.preferences),
    ...(avatar ? { avatar } : {}),
  };
};
