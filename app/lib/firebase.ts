import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAQGs09wxOnfI34Uzz9DeO0Md2HgswlwNc",
  authDomain: "fantadolomiti2026.firebaseapp.com",
  projectId: "fantadolomiti2026",
  storageBucket: "fantadolomiti2026.firebasestorage.app",
  messagingSenderId: "409020030046",
  appId: "1:409020030046:web:5aa5dac46f51cf330068cf",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;