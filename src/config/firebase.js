// Firebase configuration
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Authentication and get a reference to the service
  auth = getAuth(app);
  
  // Initialize Cloud Firestore and get a reference to the service
  db = getFirestore(app);
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw new Error('Failed to initialize Firebase. Please check your configuration.');
}

// Helper: secondary app auth that does not affect the primary session
let secondaryApp = null;
export const getSecondaryAuth = () => {
  try {
    if (!secondaryApp) {
      // Create or reuse a named secondary app
      const apps = getApps();
      secondaryApp = apps.find(a => a.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary');
    }
    return getAuth(secondaryApp);
  } catch (error) {
    console.error('Error creating secondary auth:', error);
    throw error;
  }
};

// Connect to emulators if in development (optional)
if (process.env.NODE_ENV === 'development') {
  // Uncomment these lines if you want to use Firebase emulators for development
  // connectAuthEmulator(auth, "http://localhost:9099");
  // connectFirestoreEmulator(db, 'localhost', 8080);
}

export { auth, db };

export default app;
