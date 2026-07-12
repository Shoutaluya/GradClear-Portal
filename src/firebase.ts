import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  initializeFirestore, 
  CACHE_SIZE_UNLIMITED 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// AI Studio injects variables using import.meta.env
// The configuration values can be extracted from firebase-applet-config.json
const firebaseConfig = {
  projectId: "gen-lang-client-0095822000",
  appId: "1:795508085713:web:6bb493d10f4e48548cc6f0",
  apiKey: "AIzaSyAVdsavUrn-X9GawXavMFX7IlqrbhjYhdM",
  authDomain: "gen-lang-client-0095822000.firebaseapp.com",
  storageBucket: "gen-lang-client-0095822000.firebasestorage.app",
  messagingSenderId: "795508085713",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with the specific database ID and offline persistence
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
}, "ai-studio-9e6a0cc4-0bdd-4fac-bd30-6400af76e98c");

export const storage = getStorage(app);

// Enable persistence for offline capabilities
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a a time.
    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a a time.");
  } else if (err.code == 'unimplemented') {
    // The current browser does not support all of the features required to enable persistence
    console.warn("The current browser does not support all of the features required to enable persistence");
  }
});
