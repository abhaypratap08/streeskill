const APP_VARIANT = process.env.APP_VARIANT || 'development';

const variantConfig = {
  development: {
    name: 'StreeSkill Dev',
    identifier: 'com.streeskill.dev',
  },
  student: {
    name: 'StreeSkill Student',
    identifier: 'com.streeskill.student',
  },
  production: {
    name: 'StreeSkill',
    identifier: 'com.streeskill.app',
  },
};

const selectedVariant = variantConfig[APP_VARIANT] || variantConfig.development;

module.exports = {
  expo: {
    name: selectedVariant.name,
    slug: 'streeskill',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'streeskill',
    splash: {
      backgroundColor: '#FF6B6B',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: selectedVariant.identifier,
      buildNumber: '1',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#FF6B6B',
      },
      package: selectedVariant.identifier,
      versionCode: 1,
    },
    web: {
      bundler: 'metro',
    },
    primaryColor: '#FF6B6B',
    runtimeVersion: {
      policy: 'appVersion',
    },
    extra: {
      appVariant: APP_VARIANT,
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || '',
      useMockApi: process.env.EXPO_PUBLIC_USE_MOCK_API || 'true',
      eas: {
        projectId: '7e3dacec-2deb-4f73-a276-a962bb07338f',
      },
    },
  },
};
