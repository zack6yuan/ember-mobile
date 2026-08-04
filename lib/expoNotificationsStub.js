// Stub for the optional native module `expo-notifications`.
//
// Metro resolves that package to THIS file while it isn't installed (see
// metro.config.js and PUSH_NOTIFICATIONS_SETUP.md / issue #10), so the Expo Go
// and web bundles keep building. It is never invoked at runtime: push is gated
// off behind PUSH_NOTIFICATIONS_ENABLED / isPushNotificationsAvailable() in
// lib/pushNotifications.ts. Once the real package is installed, Metro resolves to
// it instead and this file is no longer used. If something ever does reach it,
// fail loudly rather than silently.
function unavailable() {
  throw new Error(
    'expo-notifications is not installed. See PUSH_NOTIFICATIONS_SETUP.md.'
  );
}

module.exports = {
  setNotificationHandler: unavailable,
  getPermissionsAsync: unavailable,
  requestPermissionsAsync: unavailable,
  getExpoPushTokenAsync: unavailable,
  setNotificationChannelAsync: unavailable,
  addNotificationResponseReceivedListener: unavailable,
  getLastNotificationResponseAsync: unavailable,
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
};
