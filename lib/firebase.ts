import { getApps, getApp, initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
// @ts-expect-error getReactNativePersistence lacks bundled type exports in firebase 12
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBABqCU25I2iAfMNrRzbFzgLfqle--LdRE",
  authDomain: "scrubs-daff9.firebaseapp.com",
  projectId: "scrubs-daff9",
  storageBucket: "scrubs-daff9.firebasestorage.app",
  messagingSenderId: "709860087462",
  appId: "1:709860087462:web:8160209d9ada10dc31c667",
  measurementId: "G-67BVRM2PVJ"
};

// Reuse the existing app across Fast Refresh re-evaluations instead of
// re-initializing (which would throw "duplicate-app").
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth / initializeFirestore throw if called more than once on the
// same app (e.g. when this module is re-evaluated by Fast Refresh). Fall back to
// the getters when the services are already set up.

// Auth with AsyncStorage persistence so sessions survive app restarts on native.
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

// The Firebase JS SDK's default Firestore transport (WebChannel streaming) does
// not work reliably in React Native — it silently falls back to cache-only, so
// writes never reach the server. Forcing long-polling fixes cloud sync on device.
let db: Firestore;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch {
  db = getFirestore(app);
}

export { auth, db };
