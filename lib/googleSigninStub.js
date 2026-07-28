// Stub for the optional native module `@react-native-google-signin/google-signin`.
//
// Metro resolves that package to THIS file while it isn't installed (see
// metro.config.js and GOOGLE_SIGNIN_SETUP.md / issue #1), so the Expo Go and web
// bundles keep building. It is never invoked at runtime: the feature is gated
// off behind GOOGLE_SIGNIN_ENABLED / isGoogleSignInAvailable() in
// lib/googleSignIn.ts. Once the real package is installed, Metro resolves to it
// instead and this file is no longer used. If something ever does reach it, fail
// loudly rather than silently.
function unavailable() {
  throw new Error(
    'Google sign-in native module is not installed. See GOOGLE_SIGNIN_SETUP.md.'
  );
}

const GoogleSignin = {
  configure: unavailable,
  hasPlayServices: unavailable,
  signIn: unavailable,
  signOut: unavailable,
};

module.exports = { GoogleSignin, statusCodes: {} };
