// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Optional native dependencies that only exist in a custom dev build. While a
// package is NOT installed, resolve it to a local stub so the Expo Go and web
// bundles still build; each feature stays gated off at runtime. Once a package
// is installed, its entry passes straight through to the real module — no code
// change needed.
//   - @react-native-google-signin/google-signin — issue #1 / GOOGLE_SIGNIN_SETUP.md
//   - expo-notifications                          — issue #10 / PUSH_NOTIFICATIONS_SETUP.md
const OPTIONAL_MODULE_STUBS = {
  '@react-native-google-signin/google-signin': path.resolve(__dirname, 'lib/googleSigninStub.js'),
  'expo-notifications': path.resolve(__dirname, 'lib/expoNotificationsStub.js'),
};

const baseResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const stub = OPTIONAL_MODULE_STUBS[moduleName];
  if (stub) {
    try {
      require.resolve(moduleName);
    } catch {
      return { type: 'sourceFile', filePath: stub };
    }
  }
  const next = baseResolveRequest ?? context.resolveRequest;
  return next(context, moduleName, platform);
};

module.exports = config;
