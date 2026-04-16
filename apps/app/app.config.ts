import path from 'path';
import { config } from 'dotenv';
import { ExpoConfig, ConfigContext } from 'expo/config';

config({ path: path.resolve(__dirname, '../../.env') });

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: '홈 커핑',
  slug: 'home-coffing',
  scheme: 'homecoffing',
  version: '0.1.0',
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
  },
  android: {
    package: 'com.byun618.homecoffing',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#F2EDE8',
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    '@react-native-community/datetimepicker',
  ],
  experiments: {
    autolinkingModuleResolution: true,
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: 'e86d28f1-83fb-4912-8622-26f99d23a473',
    },
  },
  owner: 'byun618',
});
