import type { ExpoConfig } from 'expo/config';

const variant = process.env.APP_VARIANT;
const IS_DEV = variant === 'development';
const IS_PREVIEW = variant === 'preview';

const bundleId = IS_DEV
  ? 'com.byun618.homecoffing.dev'
  : IS_PREVIEW
    ? 'com.byun618.homecoffing.preview'
    : 'com.byun618.homecoffing';

const appName = IS_DEV
  ? '홈 커핑 (dev)'
  : IS_PREVIEW
    ? '홈 커핑 (preview)'
    : '홈 커핑';

const scheme = IS_DEV
  ? 'homecoffing-dev'
  : IS_PREVIEW
    ? 'homecoffing-preview'
    : 'homecoffing';

const config: ExpoConfig = {
  name: appName,
  slug: 'home-coffing',
  scheme,
  version: '0.3.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#F2EDE8',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: bundleId,
  },
  android: {
    package: bundleId,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#3A2419',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    softwareKeyboardLayoutMode: 'resize',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-dev-client',
    '@react-native-community/datetimepicker',
    'expo-secure-store',
  ],
  experiments: {
    autolinkingModuleResolution: true,
    typedRoutes: false,
  },
  extra: {
    router: {},
    eas: {
      projectId: 'e86d28f1-83fb-4912-8622-26f99d23a473',
    },
  },
  owner: 'byun618',
};

export default config;
