const DEFAULT_CAPTION_LANGUAGES = ['Hindi', 'English', 'Tamil'];

const parseCaptionLanguages = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : DEFAULT_CAPTION_LANGUAGES;
    } catch {
      return DEFAULT_CAPTION_LANGUAGES;
    }
  }

  return DEFAULT_CAPTION_LANGUAGES;
};

const formatPreferences = (preferences = {}) => ({
  notifications: Boolean(preferences.notifications ?? true),
  autoPlay: Boolean(preferences.auto_play ?? preferences.autoPlay ?? true),
  downloadOverWifi: Boolean(
    preferences.download_over_wifi ?? preferences.downloadOverWifi ?? true
  ),
  language: preferences.language || 'English',
  captionLanguages: parseCaptionLanguages(
    preferences.caption_languages ?? preferences.captionLanguages
  ),
});

const formatUser = (user, preferences) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatar: user.avatar || undefined,
  createdAt: user.created_at || user.createdAt || new Date().toISOString(),
  preferences: formatPreferences(preferences),
});

module.exports = {
  formatPreferences,
  formatUser,
};
