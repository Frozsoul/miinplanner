
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { 
  getFirestore, 
  type Firestore,
  initializeFirestore, // Keep for potential future use if direct getFirestore(app, "name") doesn't work
  // CACHE_SIZE_UNLIMITED, // Not currently used
  // persistentLocalCache, // Not currently used
  // persistentMultipleTabManager, // Not currently used
  // experimentalForceLongPolling // Reverted this for now
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

console.log("Firebase Config Used by App:", firebaseConfig);

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

// Explicitly connect to the "miinplanner" database.
const db: Firestore = getFirestore(app, "miinplanner");

export { app, auth, db };
