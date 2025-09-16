// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB9cLdv9ooBChYDLa_cWTZnnjar7PKUhs0",
  authDomain: "nextgen-online-school.firebaseapp.com",
  projectId: "nextgen-online-school",
  storageBucket: "nextgen-online-school.firebasestorage.app",
  messagingSenderId: "235126447754",
  appId: "1:235126447754:web:0f9433dbb3fa5fb0ded773",
  measurementId: "G-CPE2LZ0QZS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export { app, analytics, db, auth, storage };

// export default app;
