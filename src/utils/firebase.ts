import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

// Support optional environment variables for production environments like Cloudflare Pages / Vercel
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || config.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || config.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || config.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || config.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || config.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || config.appId
};

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || config.firestoreDatabaseId || '(default)';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId as the 3rd parameter
export const db = initializeFirestore(app, {}, databaseId);

