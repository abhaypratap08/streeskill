type RuntimeEnv = Record<string, string | undefined>;

const runtimeEnv =
  (globalThis as { process?: { env?: RuntimeEnv } }).process?.env ?? {};

const readEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = runtimeEnv[key];
    if (value) {
      return value;
    }
  }
  return undefined;
};

const readBooleanEnv = (keys: string[], defaultValue: boolean) => {
  const value = readEnv(...keys);
  if (value == null) {
    return defaultValue;
  }

  return !['0', 'false', 'no', 'off'].includes(value.toLowerCase());
};

const DEFAULT_DEV_BASE_URL = 'http://localhost:3000/api/v1';
const DEFAULT_PROD_BASE_URL = 'https://api.streeskill.com/api/v1';

// API Configuration
export const API_CONFIG = {
  BASE_URL:
    readEnv('EXPO_PUBLIC_API_BASE_URL', 'EXPO_PUBLIC_STREESKILL_API_BASE_URL') ??
    (__DEV__ ? DEFAULT_DEV_BASE_URL : DEFAULT_PROD_BASE_URL),
  TIMEOUT: 10000,
  YOUTUBE_API_KEY:
    readEnv('EXPO_PUBLIC_YOUTUBE_API_KEY', 'EXPO_PUBLIC_STREESKILL_YOUTUBE_API_KEY') ??
    '',
  ALGOLIA_APP_ID:
    readEnv('EXPO_PUBLIC_ALGOLIA_APP_ID', 'EXPO_PUBLIC_STREESKILL_ALGOLIA_APP_ID') ??
    '',
  ALGOLIA_API_KEY:
    readEnv('EXPO_PUBLIC_ALGOLIA_API_KEY', 'EXPO_PUBLIC_STREESKILL_ALGOLIA_API_KEY') ??
    '',
};

// Default to mock mode so the app is usable without a separately configured backend.
export const USE_MOCK_API = readBooleanEnv(
  ['EXPO_PUBLIC_USE_MOCK_API', 'EXPO_PUBLIC_STREESKILL_USE_MOCK_API'],
  true
);

// API Headers
export const getHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` }),
});
