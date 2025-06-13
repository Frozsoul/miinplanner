
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { 
  getFirestore, 
  type Firestore,
  initializeFirestore, // Keep for potential future use with settings
  // CACHE_SIZE_UNLIMITED, // Example setting
  // persistentLocalCache, // Example setting
  // persistentMultipleTabManager // Example setting
  experimentalForceLongPolling // For debugging connection issues
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Log the configuration to the browser console for debugging
console.log("Firebase Config Used by App:", firebaseConfig);

// Critical check for essential config values
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "CRITICAL FIREBASE CONFIG ERROR: Firebase API Key or Project ID is missing. " +
    "Please ensure your .env.local file is correctly set up with NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID, " +
    "and that the Next.js development server has been restarted to pick up these changes."
  );
}

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);

// Initialize Firestore with standard getFirestore
// We keep the experimentalForceLongPolling and initializeFirestore imports
// in case they are needed for future debugging or specific settings.
const db: Firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  // Other settings like cacheSizeBytes could be added here if needed
});
// const db: Firestore = getFirestore(app); // Standard initialization

export { app, auth, db };
