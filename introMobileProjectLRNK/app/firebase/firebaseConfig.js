import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

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


const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);

export default app;