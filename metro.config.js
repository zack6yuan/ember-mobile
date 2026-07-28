// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Optional native dependency: `@react-native-google-signin/google-signin` only
// exists in a custom dev build (issue #1 / GOOGLE_SIGNIN_SETUP.md). While it is
// NOT installed, resolve it to a local stub so the Expo Go and web bundles still
// build; the feature stays gated off at runtime. Once the package is installed,
// this passes straight through to the real module — no code change needed.
const OPTIONAL_GOOGLE_SIGNIN = '@react-native-google-signin/google-signin';
const googleSigninStub = path.resolve(__dirname, 'lib/googleSigninStub.js');

const baseResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === OPTIONAL_GOOGLE_SIGNIN) {
    try {
      require.resolve(OPTIONAL_GOOGLE_SIGNIN);
    } catch {
      return { type: 'sourceFile', filePath: googleSigninStub };
    }
  }
  const next = baseResolveRequest ?? context.resolveRequest;
  return next(context, moduleName, platform);
};

module.exports = config;
