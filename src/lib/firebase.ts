import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const firebaseConfigFromEnv = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// Check if all crucial environment variables are present and not just empty strings
const isConfigured = 
  firebaseConfigFromEnv.apiKey && 
  firebaseConfigFromEnv.apiKey.length > 5 &&
  firebaseConfigFromEnv.projectId;

const finalConfig = isConfigured ? firebaseConfigFromEnv : firebaseConfig;
const databaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || (firebaseConfig as any).firestoreDatabaseId;

if (!finalConfig.apiKey) {
  console.error("Firebase API Key is missing! Check .env.local or firebase-applet-config.json");
}

const app = initializeApp(finalConfig);
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connection testing
async function testConnection() {
  try {
    // Only attempt if not already testing or specifically called
    await getDocFromServer(doc(db, '_internal_', 'connection-test'));
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    }
  }
}

testConnection();

export { signInWithPopup, signOut };
