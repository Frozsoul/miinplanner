
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { 
  getFirestore, 
  type Firestore, 
  initializeFirestore, 
  // CACHE_SIZE_UNLIMITED, // We can re-evaluate enabling full offline persistence later
  // persistentLocalCache, 
  // persistentMultipleTabManager
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
    "Please ensure your .env file (e.g., .env.local) is correctly set up with NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID, " +
    "and that you have restarted your Next.js development server."
  );
}

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);

// Initialize Firestore with experimentalForceLongPolling
// For more robust offline persistence, you might also consider:
// const db = initializeFirestore(app, {
//   localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
// });
// However, let's first try to solve the connection issue.
const db: Firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  // experimentalAutoDetectLongPolling: true, // This is another option, but explicit force is better for debugging
});


export { app, auth, db };

