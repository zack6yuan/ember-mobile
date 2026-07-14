import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
// @ts-expect-error getReactNativePersistence lacks bundled type exports in firebase 12
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// The Firebase JS SDK's default Firestore transport (WebChannel streaming) does
// not work reliably in React Native — it silently falls back to cache-only, so
// writes never reach the server. Forcing long-polling fixes cloud sync on device.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Auth with AsyncStorage persistence so sessions survive app restarts on native.
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
