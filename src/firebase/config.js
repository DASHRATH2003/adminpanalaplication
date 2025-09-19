// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDpjMz_gzDUtdLtBryB1hDBccT7vgqRYaE",
  authDomain: "sadhana-cart.firebaseapp.com",
  projectId: "sadhana-cart",
  storageBucket: "sadhana-cart.firebasestorage.app",
  messagingSenderId: "126398142924",
  appId: "1:126398142924:web:90a0999a0ebc992e85a569",
  measurementId: "G-FER4YR4F73"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);
export { analytics };
export default app;