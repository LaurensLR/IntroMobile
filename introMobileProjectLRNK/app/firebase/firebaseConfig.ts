import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBJTpAW62FYeK1jSQ8XP_m-bKX-KW44724",
  authDomain: "intromobilelrnk.firebaseapp.com",
  databaseURL:
    "https://intromobilelrnk-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "intromobilelrnk",
  storageBucket: "intromobilelrnk.firebasestorage.app",
  messagingSenderId: "1061874813294",
  appId: "1:1061874813294:web:f0ca506e8dcd819530597f",
  measurementId: "G-Q65HXZ8530",
};

const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIRESTORE_DB = getFirestore(FIREBASE_APP);

export default FIREBASE_APP;
