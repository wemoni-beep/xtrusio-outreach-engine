import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCfYL5aqA2kwBq0pUpXDQ2klAM5sUOXaqQ',
  authDomain: 'xtrusio-outreach-engine.firebaseapp.com',
  projectId: 'xtrusio-outreach-engine',
  storageBucket: 'xtrusio-outreach-engine.firebasestorage.app',
  messagingSenderId: '194064090061',
  appId: '1:194064090061:web:a1896c98c24ee7a80f7a84',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
